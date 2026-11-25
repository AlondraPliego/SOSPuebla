import { useState, useEffect, useRef } from "react";
import { ShieldAlert, Phone, Building2 } from "lucide-react";
import Header from "./components/Header";
import ModalSOS, { obtenerUbicacion } from "./components/ModalSOS";
import MiDije from "./components/MiDije";
import { miDije, leerAlertaDije } from "./api/dije";
import MiCuenta from "./components/MiCuenta";
import PerfilComunidad from "./components/PerfilComunidad";
import BottomNav from "./components/BottomNav";
import AlertaEntrante from "./components/AlertaEntrante";
import Monitoreo from "./pages/Monitoreo";
import Centros from "./pages/Centros";
import Preparate from "./pages/Preparate";
import Voluntarios from "./pages/Voluntarios";
import Comunidad from "./pages/Comunidad";
import { api, sesiones, haySesionApp, EVENTO_SESION_EXPIRADA, ROLES_APP } from "./api/client";
import { suscribir } from "./api/realtime";
import { alertaParaApp, alertaGenerica } from "./api/mapeos";

/** Sesión guardada de la app, sólo si es de un rol de la app (ciudadano / voluntario). */
const sesionInicial = () => {
  const s = sesiones.app();
  return s && ROLES_APP.includes(s.rol) ? s : null;
};

/**
 * App pública (ciudadanos y voluntarios). El Panel Web del operador vive aparte en /panel.
 * Se adapta a teléfono (barra inferior), tableta y escritorio (navegación en el encabezado).
 */
export default function App() {
  const [vistaActual, setVistaActual] = useState("monitoreo");
  const [modalSOS, setModalSOS] = useState(false);
  const [sosKey, setSosKey] = useState(0); // fuerza a releer el último SOS (p. ej. el que mandó el dije)
  const [modalCuenta, setModalCuenta] = useState(false);
  const [registroVoluntario, setRegistroVoluntario] = useState(0); // >0 abre el formulario de registro
  const [alertaActiva, setAlertaActiva] = useState(null);
  const [sesion, setSesion] = useState(sesionInicial);

  const actualizarSesion = (s) => {
    sesiones.guardarApp(s);
    setSesion(s);
  };

  // refs para leer el valor actual dentro de los callbacks (WebSocket y Bluetooth)
  const sesionRef = useRef(sesion);
  useEffect(() => {
    sesionRef.current = sesion;
  }, [sesion]);
  const voluntarioIdRef = useRef(null);
  const alertaActivaRef = useRef(null);
  useEffect(() => {
    voluntarioIdRef.current = sesion?.rol === "voluntario" ? sesion.voluntario_id ?? null : null;
  }, [sesion]);
  useEffect(() => {
    alertaActivaRef.current = alertaActiva;
  }, [alertaActiva]);

  // Alerta oficial -> el dije vibra (sismo con patrón fuerte; ver firmware)
  const avisarAlDije = (tipo) => {
    if (miDije.conectado) miDije.enviar(`AVISO,${tipo || "general"}`).catch(() => {});
  };

  const mostrarAlertaDelBackend = (detalle) => {
    const alerta = alertaParaApp(detalle, voluntarioIdRef.current);
    alertaActivaRef.current = alerta;
    setAlertaActiva(alerta);
  };

  // Alertas en tiempo real: cuando Protección Civil emite una alerta activa se muestra en pantalla.
  useEffect(() => {
    return suscribir("/topic/alertas", async (p) => {
      if (!p || typeof p !== "object") return;
      const alertaId = p.alertaId ?? p.alerta_id;
      if (alertaId == null) return;
      const esNueva = p.tipo === "alerta:nueva" && p.estado === "activa";
      if (!esNueva && alertaActivaRef.current?.id !== alertaId) return;

      // sin sesión el backend no entrega el detalle: se avisa igual con una alerta genérica
      if (!haySesionApp()) {
        if (esNueva) {
          setAlertaActiva(alertaGenerica(p));
          avisarAlDije(null);
        }
        return;
      }
      try {
        const detalle = await api.alerta(alertaId);
        if (esNueva || alertaActivaRef.current?.id === alertaId) mostrarAlertaDelBackend(detalle);
        if (esNueva) avisarAlDije(detalle.tipo);
      } catch {
        if (esNueva) {
          setAlertaActiva(alertaGenerica(p));
          avisarAlDije(null);
        }
      }
    });
  }, []);

  // El dije pide auxilio ("ALERTA" o "ALERTA,lat,lng"): se crea el SOS en el backend y,
  // si llegó, se le responde "OK" (vibra 3 veces). Si falla, el dije vibra largo al no recibir "OK".
  useEffect(() => {
    return miDije.onMensaje(async (texto) => {
      const alerta = leerAlertaDije(texto);
      if (!alerta) return;
      const s = sesionRef.current;
      const ubicacion = alerta.lat != null ? alerta : await obtenerUbicacion();
      const datos = {
        tipo: "otro",
        origen: "dije",
        mensaje: "Alerta enviada desde el dije (botón de pánico o grito)",
        ...(ubicacion || {}),
      };
      if (!ubicacion && !s) datos.municipio = "Puebla";
      if (s?.rol === "voluntario" && s.nombre) datos.nombre = s.nombre;
      try {
        const creado = await api.enviarSos(datos);
        sesiones.guardarUltimoSos(creado);
        await miDije.enviar("OK");
        setSosKey((k) => k + 1);
        setModalSOS(true); // muestra el folio, el estado y el botón para avisar al contacto
      } catch {
        /* sin "OK": el dije avisa a la persona con una vibración larga */
      }
    });
  }, []);

  // Si la sesión expira (o el backend rechaza el token) la app vuelve a modo visitante
  useEffect(() => {
    const alExpirar = () => setSesion(sesionInicial());
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  // Respuesta del voluntario notificado: "confirmo" | "declino"
  const responderAlerta = async (estado) => {
    const alerta = alertaActivaRef.current;
    const voluntarioId = voluntarioIdRef.current;
    if (!alerta?.voluntarioNotificado || voluntarioId == null) return;
    await api.confirmarAlerta(alerta.id, voluntarioId, estado);
  };

  const irA = (vista) => {
    setVistaActual(vista);
    setModalCuenta(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderVista = () => {
    switch (vistaActual) {
      case "monitoreo":
        return <Monitoreo />;
      case "centros":
        return <Centros />;
      case "preparate":
        return <Preparate />;
      case "voluntarios":
        return (
          <Voluntarios
            key={`vol-${registroVoluntario}-${sesion?.usuario_id ?? "anon"}`}
            sesion={sesion}
            onSesion={actualizarSesion}
            onAbrirCuenta={() => setModalCuenta(true)}
            modoInicial={registroVoluntario > 0 && sesion?.rol !== "voluntario" ? "registro" : "info"}
          />
        );
      case "comunidad":
        return (
          <div className="md:max-w-3xl md:mx-auto">
            <PerfilComunidad
              key={sesion?.usuario_id ?? "anon"}
              sesion={sesion}
              onAbrirCuenta={() => setModalCuenta(true)}
            />
            <MiDije />
            <Comunidad />
          </div>
        );
      default:
        return <Monitoreo />;
    }
  };

  return (
    <div className="min-h-screen bg-fondo flex flex-col">
      <Header
        vistaActual={vistaActual}
        setVistaActual={irA}
        onOpenSOS={() => setModalSOS(true)}
        onOpenCuenta={() => setModalCuenta(true)}
        sesion={sesion}
      />

      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-4 lg:pt-8 pb-28 lg:pb-12">
        {renderVista()}

        <p className="lg:hidden text-center text-[11px] text-gray-400 mt-8">
          ¿Eres personal de Protección Civil?{" "}
          <a href="/panel" className="font-semibold text-gray-500 underline">
            Acceso institucional
          </a>
        </p>
      </main>

      {/* pie de página de escritorio */}
      <footer className="hidden lg:block bg-guinda text-gray-400">
        <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-3 gap-8 text-xs">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-white font-black text-sm">
              <ShieldAlert className="w-5 h-5" /> Alerta Puebla
            </p>
            <p className="leading-relaxed">
              Sistema estatal de alertas, refugios, centros de acopio y voluntariado de Protección Civil del Estado de Puebla.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-white font-bold">Números de emergencia</p>
            <a href="tel:911" className="flex items-center gap-2 hover:text-white"><Phone className="w-3.5 h-3.5" /> 911 · Emergencias</a>
            <a href="tel:8007134147" className="flex items-center gap-2 hover:text-white"><Phone className="w-3.5 h-3.5" /> 800 713 4147 · Protección Civil Puebla</a>
          </div>
          <div className="space-y-1.5">
            <p className="text-white font-bold">Personal institucional</p>
            <a href="/panel" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-3 py-2 rounded-lg transition">
              <Building2 className="w-4 h-4" /> Acceso al Centro de Mando
            </a>
          </div>
        </div>
      </footer>

      <BottomNav vistaActual={vistaActual} setVistaActual={irA} />

      {alertaActiva && (
        <AlertaEntrante
          key={alertaActiva.id}
          alerta={alertaActiva}
          onResponder={responderAlerta}
          onCerrar={() => setAlertaActiva(null)}
        />
      )}

      {modalSOS && (
        <ModalSOS
          key={sosKey}
          sesion={sesion}
          onCerrar={() => setModalSOS(false)}
          onIrACuenta={() => {
            setModalSOS(false);
            setModalCuenta(true);
          }}
        />
      )}

      {modalCuenta && (
        <MiCuenta
          sesion={sesion}
          onSesion={actualizarSesion}
          onCerrar={() => setModalCuenta(false)}
          onIr={irA}
          onRegistroVoluntario={() => {
            setRegistroVoluntario((n) => n + 1);
            irA("voluntarios");
          }}
        />
      )}
    </div>
  );
}
