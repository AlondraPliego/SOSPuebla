import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldAlert,
  LayoutDashboard,
  BellPlus,
  Users,
  Package,
  Smartphone,
  CheckCircle2,
  XCircle,
  Zap,
  MapPin,
  Search,
  LogOut,
  RefreshCw,
  Satellite,
  Siren,
  Phone,
} from "lucide-react";
import MapView from "../components/MapView";
import { refugiosPuebla } from "../data/pueblaData";
import { apiPanel as api, sesiones, EVENTO_SESION_EXPIRADA, ROLES_PANEL } from "../api/client";
import { suscribir } from "../api/realtime";
import {
  TIPOS_ALERTA,
  SEVERIDADES,
  ESTADOS_ALERTA,
  FUENTES_ALERTA,
  CATEGORIAS,
  MUNICIPIOS,
  etiquetaTipo,
  etiquetaCategoria,
  etiquetaEstatusVoluntario,
  haceCuanto,
  ESTADOS_SOS,
  CONDICIONES_VULNERABLES,
  etiquetaTipoSos,
} from "../api/mapeos";

const SOS_ABIERTOS = ["activo", "en_atencion"];

// sólo operador / admin pueden usar el Centro de Mando
const ROLES_STAFF = ROLES_PANEL;
const nombreRol = (r) => (r === "admin" ? "Administrador" : r === "operador" ? "Operador" : r);

const estiloSeveridad = {
  critica: "bg-red-100 text-red-800",
  alta: "bg-orange-100 text-orange-800",
  moderada: "bg-amber-100 text-amber-800",
  preventiva: "bg-yellow-100 text-yellow-800",
};

/** VoluntarioDto del backend -> fila de la tabla del padrón */
const filaVoluntario = (v) => ({
  id: v.id,
  nombre: [v.nombre, v.apellidos].filter(Boolean).join(" "),
  documento: v.extranjero ? v.numero_documento || "—" : v.curp || "—",
  nacionalidad: v.extranjero ? `Extranjero${v.pais_origen ? ` · ${v.pais_origen}` : ""}` : "Mexicano",
  categoria: (v.categorias || []).map(etiquetaCategoria).join(", "),
  municipio: v.municipio || "",
  estatus: etiquetaEstatusVoluntario(v.estatus_aprobacion),
});

/** Panel Web de Protección Civil (ruta /panel). Exclusivo de operador y administrador. */
export default function PanelSecretaria() {
  const [sesion, setSesion] = useState(() => {
    const s = sesiones.panel();
    return s && ROLES_STAFF.includes(s.rol) ? s : null;
  });
  const autenticado = !!sesion;
  const [correo, setCorreo] = useState("operador@puebla.gob.mx");
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [entrando, setEntrando] = useState(false);
  const rol = nombreRol(sesion?.rol);

  const [vista, setVista] = useState("dashboard");
  const [voluntarios, setVoluntarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [centros, setCentros] = useState([]);
  const [alertasFeed, setAlertasFeed] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [sosLista, setSosLista] = useState([]);
  const [notasSos, setNotasSos] = useState({});
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }

  const [tipoAlerta, setTipoAlerta] = useState("sismo");
  const [severidad, setSeveridad] = useState("critica");
  const [zona, setZona] = useState("Puebla");
  const [radioKm, setRadioKm] = useState(5);
  const [categoriasAlerta, setCategoriasAlerta] = useState([]);
  const [mensaje, setMensaje] = useState(
    "Mantén la calma. Si estás en zona de riesgo, resguárdate y evacúa al terminar el movimiento."
  );
  const [emitiendo, setEmitiendo] = useState(false);
  const [cuentaRegresiva, setCuentaRegresiva] = useState(null);
  const cuentaRef = useRef(null);
  useEffect(() => {
    cuentaRef.current = cuentaRegresiva;
  }, [cuentaRegresiva]);

  // Token vencido o inválido: regresa al login del panel
  useEffect(() => {
    const alExpirar = () => {
      const s = sesiones.panel();
      if (!s || !ROLES_STAFF.includes(s.rol)) {
        setSesion(null);
        setAviso(null);
        setErrorLogin("Tu sesión expiró. Vuelve a iniciar sesión.");
      }
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const mostrarError = (e) => setAviso({ tipo: "error", texto: e.message || String(e) });

  // ------------------------------------------------------------------
  // Carga de datos desde el backend
  // ------------------------------------------------------------------
  const cargarAlertas = useCallback(async () => {
    const [lista, res] = await Promise.all([api.alertas(), api.resumen()]);
    setAlertasFeed(lista);
    setResumen(res);
  }, []);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    const [rAlertas, rVol, rCentros, rSos] = await Promise.allSettled([
      cargarAlertas(),
      api.voluntarios(),
      api.centros(),
      api.listarSos(),
    ]);
    if (rVol.status === "fulfilled") setVoluntarios(rVol.value.map(filaVoluntario));
    if (rCentros.status === "fulfilled") setCentros(rCentros.value);
    if (rSos.status === "fulfilled") setSosLista(rSos.value);
    const fallo = [rAlertas, rVol, rCentros, rSos].find((r) => r.status === "rejected");
    if (fallo) mostrarError(fallo.reason);
    setCargando(false);
  }, [cargarAlertas]);

  useEffect(() => {
    if (autenticado) cargarTodo();
  }, [autenticado, cargarTodo]);

  // Tiempo real: feed de alertas y cuenta regresiva del simulador
  useEffect(() => {
    if (!autenticado) return;
    const quitarAlertas = suscribir("/topic/alertas", () => {
      cargarAlertas().catch(() => {});
    });
    const quitarCountdown = suscribir("/topic/sismo/countdown", (p) => {
      if (!p || typeof p !== "object") return;
      if (p.estado === "disparado" || p.segundos === 0) {
        cuentaRef.current = null;
        setCuentaRegresiva(null);
        // la alerta llega a la app de ciudadanos y voluntarios por WebSocket
        setAviso({ tipo: "ok", texto: "Simulación disparada: la alerta de sismo se envió a la app de ciudadanos y voluntarios." });
        cargarAlertas().catch(() => {});
      } else {
        setCuentaRegresiva(p.segundos);
      }
    });
    // SOS ciudadanos en tiempo real
    const quitarSos = suscribir("/topic/sos", (p) => {
      api.listarSos().then(setSosLista).catch(() => {});
      if (p?.tipo === "sos:nuevo") {
        setAviso({ tipo: "error", texto: `🚨 Nuevo SOS ciudadano recibido (SOS-${p.sosId}). Revisa la pestaña SOS.` });
        if (navigator.vibrate) navigator.vibrate(300);
      }
    });
    return () => {
      quitarAlertas();
      quitarCountdown();
      quitarSos();
    };
  }, [autenticado, cargarAlertas]);

  // ------------------------------------------------------------------
  // Acciones
  // ------------------------------------------------------------------
  const iniciarSesion = async (e) => {
    e.preventDefault();
    setErrorLogin("");
    setEntrando(true);
    try {
      const r = await api.login(correo.trim(), password);
      if (!ROLES_STAFF.includes(r.rol)) {
        setErrorLogin("Esta cuenta no tiene acceso al Centro de Mando (requiere operador o administrador).");
        return;
      }
      sesiones.guardarPanel(r);
      setSesion(r);
      setPassword("");
    } catch (err) {
      setErrorLogin(err.message);
    } finally {
      setEntrando(false);
    }
  };

  const cerrarSesion = () => {
    sesiones.guardarPanel(null);
    setSesion(null);
  };

  const handleEmitirManual = async (e) => {
    e.preventDefault();
    const municipio = MUNICIPIOS.find((m) => m.nombre === zona) || MUNICIPIOS[0];
    setEmitiendo(true);
    setAviso(null);
    try {
      const detalle = await api.crearAlerta({
        tipo: tipoAlerta,
        severidad,
        municipio: municipio.nombre,
        lat: municipio.lat,
        lng: municipio.lng,
        radio_km: radioKm,
        mensaje,
        categorias_requeridas: categoriasAlerta.length ? categoriasAlerta : null,
      });
      await cargarAlertas().catch(() => {});
      setAviso({
        tipo: "ok",
        texto: `Alerta #${detalle.id} emitida · ${detalle.voluntarios_notificados.length} voluntarios notificados`,
      });
    } catch (err) {
      mostrarError(err);
    } finally {
      setEmitiendo(false);
    }
  };

  const simularSismo = async () => {
    setAviso(null);
    try {
      setCuentaRegresiva(10);
      await api.simularSismo({ municipio: "Puebla", lat: 19.0414, lng: -98.2063, radio_km: 15, segundos_countdown: 10 });
      // respaldo: si el countdown por WebSocket no llega, se libera el botón
      setTimeout(() => {
        if (cuentaRef.current !== null) {
          setCuentaRegresiva(null);
          cargarAlertas().catch(() => {});
        }
      }, 14000);
    } catch (err) {
      setCuentaRegresiva(null);
      mostrarError(err);
    }
  };

  const accionAlerta = async (fn, textoOk) => {
    setAviso(null);
    try {
      await fn();
      await cargarAlertas();
      if (textoOk) setAviso({ tipo: "ok", texto: textoOk });
    } catch (err) {
      mostrarError(err);
    }
  };

  const sincronizarNasa = () =>
    accionAlerta(async () => {
      const r = await api.sincronizarNasa(20);
      setAviso({ tipo: "ok", texto: `NASA EONET: ${r.alertasCreadas ?? r.alertas_creadas ?? 0} alertas nuevas` });
    });

  const cambiarEstatusVoluntario = async (id, nuevoEstatus) => {
    try {
      const v = await api.aprobarVoluntario(id, nuevoEstatus);
      setVoluntarios((prev) => prev.map((x) => (x.id === id ? filaVoluntario(v) : x)));
      api.resumen().then(setResumen).catch(() => {});
    } catch (err) {
      mostrarError(err);
    }
  };

  const toggleCentro = async (id) => {
    const c = centros.find((x) => x.id === id);
    if (!c) return;
    try {
      const actualizado = await api.actualizarCentro(id, {
        nombre: c.nombre,
        direccion: c.direccion,
        municipio: c.municipio,
        lat: c.lat,
        lng: c.lng,
        horario: c.horario,
        telefono: c.telefono,
        responsable: c.responsable,
        abierto: !c.abierto,
      });
      setCentros((prev) => prev.map((x) => (x.id === id ? actualizado : x)));
      api.resumen().then(setResumen).catch(() => {});
    } catch (err) {
      mostrarError(err);
    }
  };

  const cambiarEstadoSos = async (id, estado) => {
    try {
      const nota = notasSos[id]?.trim() || null;
      const actualizado = await api.estadoSos(id, estado, nota);
      setSosLista((prev) => prev.map((s) => (s.id === id ? actualizado : s)));
      setNotasSos((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      mostrarError(err);
    }
  };

  const toggleCategoriaAlerta = (cat) =>
    setCategoriasAlerta((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-guinda">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  SECIHTI · Protección Civil Puebla
                </p>
                <h1 className="text-lg font-bold text-gray-900">Panel Web Secretaría</h1>
              </div>
            </div>
            <a
              href="/"
              className="text-xs font-bold text-gray-500 hover:text-guinda flex items-center gap-1 shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              <span>Sitio público</span>
            </a>
          </div>

          <form onSubmit={iniciarSesion} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo institucional
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
              />
            </div>

            <p className="text-[11px] text-gray-500">
              El rol de acceso (Operador de Monitoreo o Administrador Estatal) se asigna según tu cuenta.
            </p>

            {errorLogin && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg px-3 py-2">
                {errorLogin}
              </div>
            )}

            <button
              type="submit"
              disabled={entrando}
              className="w-full bg-guinda hover:bg-guindaDark disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-xs transition mt-2"
            >
              {entrando ? "Verificando..." : "Ingresar al Centro de Mando"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const voluntariosFiltrados = voluntarios.filter(
    (v) =>
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.municipio.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const activosCount =
    resumen?.voluntarios_registrados ?? voluntarios.filter((v) => v.estatus === "Activo").length;
  const pendientesCount = voluntarios.filter((v) => v.estatus === "Pendiente").length;
  const centrosAbiertos = resumen?.centros_abiertos ?? centros.filter((c) => c.abierto).length;
  const alertasVigentes = alertasFeed.filter((a) => a.estado !== "cerrada");
  const sosAbiertos = sosLista.filter((s) => SOS_ABIERTOS.includes(s.estado));
  const alertasActivasCount =
    resumen?.alertas_activas ?? alertasFeed.filter((a) => a.estado === "activa" || a.estado === "en_atencion").length;

  const puntosMapa = [
    ...refugiosPuebla.map((r) => ({ ...r, id: `r-${r.id}` })),
    ...centros.map((c) => ({ ...c, id: `c-${c.id}` })),
    ...alertasVigentes
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => ({
        id: `a-${a.id}`,
        nombre: `Alerta: ${etiquetaTipo(a.tipo)} (${ESTADOS_ALERTA[a.estado] || a.estado})`,
        direccion: a.municipio,
        lat: a.lat,
        lng: a.lng,
      })),
    ...sosLista
      .filter((s) => SOS_ABIERTOS.includes(s.estado) && s.lat != null && s.lng != null)
      .map((s) => ({
        id: `s-${s.id}`,
        nombre: `SOS-${s.id}: ${etiquetaTipoSos(s.tipo)} · ${s.nombre}`,
        direccion: `${ESTADOS_SOS[s.estado] || s.estado}${s.telefono ? ` · Tel. ${s.telefono}` : ""}`,
        lat: s.lat,
        lng: s.lng,
      })),
  ];

  return (
    <div className="min-h-screen bg-fondo flex flex-col">
      <header className="bg-guinda text-white px-4 md:px-6 py-3.5 flex flex-wrap sticky top-0 z-30 items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-white" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold">
              Centro de Mando · Estado de Puebla ({rol})
            </p>
            <h1 className="text-base font-bold leading-tight">
              Sistema Web de Emergencias
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarTodo}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-white text-guinda hover:bg-gray-100 text-xs font-bold px-3 py-2 rounded-lg transition"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Ver sitio público</span>
          </a>
          <button
            onClick={cerrarSesion}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-5 md:space-y-6">
        <nav className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap pb-1 [scrollbar-width:none]">
          {[
            { id: "dashboard", label: "Dashboard y Mapa", icon: LayoutDashboard },
            { id: "emitir", label: "Emitir / Simular Alerta", icon: BellPlus },
            {
              id: "voluntarios",
              label: `Voluntarios (${pendientesCount} pendientes)`,
              icon: Users,
            },
            { id: "centros", label: "Centros de Acopio", icon: Package },
            { id: "sos", label: `SOS Ciudadano (${sosAbiertos.length} abiertos)`, icon: Siren },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setVista(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 shrink-0 whitespace-nowrap rounded-xl text-xs font-bold border transition ${
                  vista === item.id
                    ? "bg-guinda text-white border-guinda shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {aviso && (
          <div
            className={`flex items-start justify-between gap-3 text-xs rounded-lg px-3 py-2 border ${
              aviso.tipo === "ok"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span>{aviso.texto}</span>
            <button onClick={() => setAviso(null)} className="font-bold">
              ×
            </button>
          </div>
        )}

        {vista === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Alertas Activas</p>
                <p className="text-2xl font-black text-red-700 mt-1">{alertasActivasCount}</p>
                {resumen?.alertas_pendientes_autorizacion > 0 && (
                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    {resumen.alertas_pendientes_autorizacion} por autorizar
                  </p>
                )}
                {sosAbiertos.length > 0 && (
                  <button
                    onClick={() => setVista("sos")}
                    className="block text-left text-[10px] text-red-700 font-bold mt-0.5 hover:underline"
                  >
                    🚨 {sosAbiertos.length} SOS ciudadanos abiertos
                  </button>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Voluntarios Activos</p>
                <p className="text-2xl font-black text-guinda mt-1">{activosCount}</p>
                {resumen && (
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    {resumen.voluntarios_confirmados_ahora} confirmados ahora
                  </p>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Solicitudes Pendientes</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{pendientesCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Centros Abiertos</p>
                <p className="text-2xl font-black text-green-700 mt-1">
                  {centrosAbiertos} / {centros.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900">
                    Mapa Operativo · Refugios, Centros y Alertas en Puebla
                  </h2>
                  <span className="text-xs text-gray-500">En tiempo real</span>
                </div>
                <MapView
                  puntos={puntosMapa}
                  seleccionado={puntosMapa[0]}
                  onSelect={() => {}}
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-gray-900">Feed de Alertas</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={sincronizarNasa}
                      className="flex items-center gap-1 text-xs font-bold text-guinda hover:underline"
                      title="Traer eventos de NASA EONET (quedan pendientes de autorizar)"
                    >
                      <Satellite className="w-3.5 h-3.5" />
                      NASA
                    </button>
                    <button
                      onClick={() => setVista("emitir")}
                      className="text-xs font-bold text-red-700 hover:underline"
                    >
                      + Nueva
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[28rem] overflow-y-auto">
                  {alertasVigentes.length === 0 && (
                    <p className="text-xs text-gray-500">
                      {cargando ? "Cargando alertas..." : "Sin alertas vigentes."}
                    </p>
                  )}
                  {alertasVigentes.map((alerta) => {
                    const notificados = alerta.voluntarios_notificados || [];
                    const confirmados = notificados.filter((v) => v.estado === "confirmo").length;
                    return (
                      <div
                        key={alerta.id}
                        className="p-3 rounded-lg bg-fondo border border-gray-200 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {etiquetaTipo(alerta.tipo)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              estiloSeveridad[alerta.severidad] || "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {alerta.severidad}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-guinda" />
                          {alerta.municipio}
                          {alerta.radio_km != null && ` · ${alerta.radio_km} km`}
                        </p>
                        {alerta.mensaje && (
                          <p className="text-[11px] text-gray-500 line-clamp-2">{alerta.mensaje}</p>
                        )}
                        <div className="flex justify-between text-[10px] text-gray-500 pt-1">
                          <span>
                            Estado: {ESTADOS_ALERTA[alerta.estado] || alerta.estado} ·{" "}
                            {FUENTES_ALERTA[alerta.fuente] || alerta.fuente}
                          </span>
                          <span>{haceCuanto(alerta.creada_en)}</span>
                        </div>
                        {alerta.estado !== "pendiente" && (
                          <p className="text-[10px] text-gray-600 font-semibold">
                            {notificados.length} notificados · {confirmados} confirmaron
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {alerta.estado === "pendiente" && (
                            <button
                              onClick={() =>
                                accionAlerta(
                                  () => api.autorizarAlerta(alerta.id),
                                  `Alerta #${alerta.id} autorizada y enviada a voluntarios`
                                )
                              }
                              className="bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                              Autorizar
                            </button>
                          )}
                          {alerta.estado === "activa" && (
                            <button
                              onClick={() =>
                                accionAlerta(() => api.cambiarEstadoAlerta(alerta.id, "en_atencion"))
                              }
                              className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                              En atención
                            </button>
                          )}
                          <button
                            onClick={() =>
                              accionAlerta(() => api.cambiarEstadoAlerta(alerta.id, "cerrada"))
                            }
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded"
                          >
                            {alerta.estado === "pendiente" ? "Descartar" : "Cerrar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "emitir" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleEmitirManual}
              className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4"
            >
              <h2 className="text-sm font-bold text-gray-900">
                Emitir Alerta Oficial a Voluntarios
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de alerta
                  </label>
                  <select
                    value={tipoAlerta}
                    onChange={(e) => setTipoAlerta(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    {TIPOS_ALERTA.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Severidad
                  </label>
                  <select
                    value={severidad}
                    onChange={(e) => setSeveridad(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    {SEVERIDADES.map((s) => (
                      <option key={s.valor} value={s.valor}>
                        {s.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Municipio
                  </label>
                  <select
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    {MUNICIPIOS.map((m) => (
                      <option key={m.nombre} value={m.nombre}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Radio de afectación: {radioKm} km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={radioKm}
                    onChange={(e) => setRadioKm(Number(e.target.value))}
                    className="w-full accent-guinda mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Categorías de voluntarios requeridas (opcional: sin selección se notifica a todos)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CATEGORIAS).map(([valor, etiqueta]) => {
                    const activa = categoriasAlerta.includes(valor);
                    return (
                      <button
                        type="button"
                        key={valor}
                        onClick={() => toggleCategoriaAlerta(valor)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          activa
                            ? "bg-guinda text-white border-guinda font-semibold"
                            : "bg-fondo text-gray-700 border-gray-200"
                        }`}
                      >
                        {activa ? "✓ " : "+ "}
                        {etiqueta}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Instrucciones para voluntarios
                </label>
                <textarea
                  rows={3}
                  required
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={emitiendo}
                className="w-full bg-red-700 hover:bg-red-800 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                {emitiendo ? "Emitiendo..." : "Emitir Alerta a Ciudadanos y Voluntarios"}
              </button>
            </form>

            <div className="bg-guinda text-white rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">
                  Modo Demostración · Hackathon
                </span>
                <h3 className="text-base font-bold">Simulador de Sismo</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Inicia una cuenta regresiva de 10 segundos y dispara automáticamente la pantalla de alerta crítica en la app de ciudadanos y voluntarios.
                </p>
              </div>

              {cuentaRegresiva !== null ? (
                <div className="bg-red-700 rounded-xl p-6 text-center space-y-1 animate-pulse">
                  <p className="text-xs uppercase font-bold">Emitiendo alerta en</p>
                  <p className="text-5xl font-black font-mono">{cuentaRegresiva}s</p>
                </div>
              ) : (
                <button
                  onClick={simularSismo}
                  className="w-full flex items-center justify-center gap-2 bg-white text-guinda hover:bg-gray-100 font-black py-3.5 rounded-xl text-xs transition"
                >
                  <Zap className="w-4 h-4 text-red-700" />
                  <span>Simular Sismo (10 s)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {vista === "voluntarios" && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gray-900">
                Padrón y Solicitudes de Voluntariado
              </h2>
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, municipio..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />
              </div>
            </div>

            {/* teléfono: tarjetas */}
            <div className="md:hidden space-y-2.5">
              {voluntariosFiltrados.map((v) => (
                <div key={v.id} className="border border-gray-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{v.nombre}</p>
                      <p className="text-[11px] text-gray-500">{v.categoria} · {v.municipio}</p>
                      <p className="text-[10px] font-mono text-gray-400 truncate">{v.documento} · {v.nacionalidad}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        v.estatus === "Activo"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : v.estatus === "Rechazado"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {v.estatus}
                    </span>
                  </div>
                  {v.estatus === "Pendiente" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => cambiarEstatusVoluntario(v.id, "aprobado")}
                        className="flex items-center justify-center gap-1 bg-green-700 text-white text-xs font-bold py-2 rounded-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                      </button>
                      <button
                        onClick={() => cambiarEstatusVoluntario(v.id, "rechazado")}
                        className="flex items-center justify-center gap-1 bg-red-700 text-white text-xs font-bold py-2 rounded-lg"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {voluntariosFiltrados.length === 0 && (
                <p className="text-xs text-gray-500 py-4 text-center">
                  {cargando ? "Cargando voluntarios..." : "Sin voluntarios que coincidan."}
                </p>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">CURP / Documento</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Municipio</th>
                    <th className="py-2.5 px-3">Estatus</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {voluntariosFiltrados.map((v) => (
                    <tr key={v.id} className="hover:bg-fondo/60">
                      <td className="py-3 px-3 font-bold text-gray-900">{v.nombre}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                        {v.documento}
                        <span className="block text-[10px] font-sans text-gray-400">
                          {v.nacionalidad}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-700">{v.categoria}</td>
                      <td className="py-3 px-3 text-gray-700">{v.municipio}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            v.estatus === "Activo"
                              ? "bg-green-50 text-green-800 border border-green-200"
                              : v.estatus === "Rechazado"
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {v.estatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {v.estatus === "Pendiente" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => cambiarEstatusVoluntario(v.id, "aprobado")}
                              className="inline-flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => cambiarEstatusVoluntario(v.id, "rechazado")}
                              className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">Gestionado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {voluntariosFiltrados.length === 0 && (
                <p className="text-xs text-gray-500 py-4 text-center">
                  {cargando ? "Cargando voluntarios..." : "Sin voluntarios que coincidan."}
                </p>
              )}
            </div>
          </div>
        )}

        {vista === "sos" && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-gray-900">Solicitudes de Auxilio (SOS) · Ciudadanos</h2>
              <span className="text-xs text-gray-500">En tiempo real</span>
            </div>

            {sosLista.length === 0 && (
              <p className="text-xs text-gray-500">
                {cargando ? "Cargando SOS..." : "No se han recibido solicitudes de auxilio."}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sosLista.map((s) => {
                const abierto = SOS_ABIERTOS.includes(s.estado);
                return (
                  <div
                    key={s.id}
                    className={`border rounded-xl p-4 space-y-2 ${
                      s.estado === "activo"
                        ? "border-red-300 bg-red-50/40"
                        : s.estado === "en_atencion"
                        ? "border-amber-300 bg-amber-50/40"
                        : "border-gray-200 opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500">
                          SOS-{s.id} · {s.origen === "dije" ? "Dije" : "App"} · {haceCuanto(s.creado_en)}
                        </p>
                        <h3 className="text-sm font-bold text-gray-900">{etiquetaTipoSos(s.tipo)}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          s.estado === "activo"
                            ? "bg-red-100 text-red-800"
                            : s.estado === "en_atencion"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ESTADOS_SOS[s.estado] || s.estado}
                      </span>
                    </div>

                    <p className="text-xs text-gray-800">
                      <strong>{s.nombre}</strong>
                      {s.condicion_vulnerable &&
                        ` · ${CONDICIONES_VULNERABLES[s.condicion_vulnerable] || s.condicion_vulnerable}`}
                    </p>
                    {s.mensaje && <p className="text-xs text-gray-600">“{s.mensaje}”</p>}

                    <div className="text-[11px] text-gray-600 space-y-0.5">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-guinda" />
                        {s.lat != null ? (
                          <a
                            href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                          </a>
                        ) : (
                          <span>Sin GPS · {s.municipio || "sin municipio"}</span>
                        )}
                        {s.lat != null && s.municipio && <span>· {s.municipio}</span>}
                      </p>
                      {s.telefono && (
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-guinda" />
                          <a href={`tel:${s.telefono}`} className="underline">{s.telefono}</a>
                        </p>
                      )}
                      {s.contacto_nombre && (
                        <p>
                          Contacto familiar: {s.contacto_nombre}
                          {s.contacto_telefono && (
                            <>
                              {" "}· <a href={`tel:${s.contacto_telefono}`} className="underline">{s.contacto_telefono}</a>
                            </>
                          )}
                        </p>
                      )}
                      {s.nota && <p className="text-gray-800">Nota: {s.nota}</p>}
                    </div>

                    {abierto && (
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="text"
                          value={notasSos[s.id] || ""}
                          onChange={(e) => setNotasSos((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          placeholder="Nota para el ciudadano (ej. ambulancia en camino)"
                          className="w-full px-2.5 py-1.5 text-[11px] border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {s.estado === "activo" && (
                            <button
                              onClick={() => cambiarEstadoSos(s.id, "en_atencion")}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                              Atender
                            </button>
                          )}
                          <button
                            onClick={() => cambiarEstadoSos(s.id, "atendido")}
                            className="bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold px-2 py-1 rounded"
                          >
                            Marcar atendido
                          </button>
                          <button
                            onClick={() => cambiarEstadoSos(s.id, "cancelado")}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold px-2 py-1 rounded"
                          >
                            Descartar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {vista === "centros" && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">
              Control de Centros de Acopio · Puebla
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {centros.map((centro) => (
                <div
                  key={centro.id}
                  className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{centro.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{centro.direccion}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Horario: {centro.horario} · Tel: {centro.telefono}
                    </p>
                    {centro.necesidades?.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Necesita:{" "}
                        {centro.necesidades
                          .map((n) => (n.prioridad === "urgente" ? `${n.item} (urgente)` : n.item))
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleCentro(centro.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                      centro.abierto
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {centro.abierto ? "Abierto" : "Cerrado"}
                  </button>
                </div>
              ))}
              {centros.length === 0 && (
                <p className="text-xs text-gray-500">
                  {cargando ? "Cargando centros..." : "No hay centros de acopio registrados."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
