import { useEffect, useState } from "react";
import { X, Radio, CheckCircle2, MapPin, Phone, MessageCircle, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { api, sesiones } from "../api/client";
import { suscribir } from "../api/realtime";
import { TIPOS_SOS, ESTADOS_SOS, etiquetaTipoSos } from "../api/mapeos";

/** Pide la ubicación GPS del navegador; resuelve null si no hay permiso o tarda demasiado. */
/**
 * Ubicación GPS. En la app de Android usa el plugin nativo (pide el permiso de ubicación del
 * sistema); en el navegador, la API web. Resuelve null si no hay permiso o tarda demasiado.
 */
export async function obtenerUbicacion() {
  if (Capacitor.isNativePlatform()) {
    try {
      const permiso = await Geolocation.requestPermissions();
      if (permiso.location !== "granted" && permiso.coarseLocation !== "granted") return null;
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  });
}

const soloDigitos = (t) => (t || "").replace(/\D/g, "");
const ACTIVOS = ["activo", "en_atencion"];

export default function ModalSOS({ sesion, onCerrar, onIrACuenta }) {
  const [tipo, setTipo] = useState("emergencia_medica");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  // último SOS de este dispositivo (sigue visible mientras esté activo)
  const [sos, setSos] = useState(() => {
    const s = sesiones.ultimoSos();
    return s && ACTIVOS.includes(s.estado) ? s : null;
  });

  const identificado = !!sesion;

  // Estado en tiempo real del SOS enviado
  useEffect(() => {
    if (!sos?.id) return;
    return suscribir(`/topic/sos/${sos.id}`, (p) => {
      if (!p || typeof p !== "object") return;
      setSos((prev) => {
        if (!prev) return prev;
        const nuevo = { ...prev, estado: p.estado, nota: p.nota ?? prev.nota };
        sesiones.guardarUltimoSos(nuevo);
        return nuevo;
      });
    });
  }, [sos?.id]);

  const emitir = async () => {
    setError("");
    setEnviando(true);
    try {
      const gps = await obtenerUbicacion();
      const datos = {
        tipo,
        mensaje: mensaje.trim() || null,
        origen: "app",
        ...(gps || {}),
      };
      // el voluntario no tiene perfil ciudadano: se manda su nombre desde la sesión
      if (sesion?.rol === "voluntario" && sesion.nombre) datos.nombre = sesion.nombre;
      // sin GPS y sin cuenta: se manda el municipio para que el backend acepte el SOS
      if (!gps && !identificado) {
        datos.municipio = "Puebla";
        datos.mensaje = `${datos.mensaje ? `${datos.mensaje} ` : ""}(sin ubicación GPS)`;
      }
      const creado = await api.enviarSos(datos);
      sesiones.guardarUltimoSos(creado);
      setSos(creado);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (e) {
      setError(e.message || "No se pudo enviar el SOS");
    } finally {
      setEnviando(false);
    }
  };

  const cancelar = async () => {
    try {
      const r = await api.cancelarSos(sos.id);
      sesiones.guardarUltimoSos(r);
      setSos(r);
    } catch (e) {
      setError(e.message);
    }
  };

  const nuevoSos = () => {
    sesiones.guardarUltimoSos(null);
    setSos(null);
    setMensaje("");
  };

  const ubicacionTexto =
    sos?.lat != null ? `https://www.google.com/maps?q=${sos.lat},${sos.lng}` : sos?.municipio || "";
  const textoWhatsapp = encodeURIComponent(
    `🚨 ${sos?.nombre || "Necesito ayuda"}: envié un SOS (${etiquetaTipoSos(sos?.tipo)}) a Protección Civil Puebla. Mi ubicación: ${ubicacionTexto}`
  );
  const telContacto = soloDigitos(sos?.contacto_telefono);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onClick={onCerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-subir bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
            <Radio className="w-5 h-5" />
            <span>Alerta de Emergencia / Dije</span>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sos ? (
          <div className="space-y-3">
            <div className="py-3 text-center space-y-2">
              <CheckCircle2
                className={`w-10 h-10 mx-auto ${sos.estado === "cancelado" ? "text-gray-400" : "text-green-600"}`}
              />
              <p className="font-bold text-gray-900 text-sm">
                {sos.estado === "cancelado"
                  ? "SOS cancelado"
                  : "Alerta enviada a Protección Civil"}
              </p>
              <p className="text-xs text-gray-500">
                Folio SOS-{sos.id} · {etiquetaTipoSos(sos.tipo)}
              </p>
              <span
                className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  sos.estado === "en_atencion"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : sos.estado === "atendido"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : sos.estado === "cancelado"
                    ? "bg-gray-100 text-gray-600 border-gray-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {ESTADOS_SOS[sos.estado] || sos.estado}
              </span>
              {sos.nota && (
                <p className="text-xs text-gray-700 bg-fondo rounded-lg px-3 py-2">
                  Protección Civil: {sos.nota}
                </p>
              )}
              <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {sos.lat != null
                  ? `Ubicación compartida (${sos.lat.toFixed(4)}, ${sos.lng.toFixed(4)})`
                  : `Ubicación aproximada: ${sos.municipio || "sin ubicación"}`}
              </p>
            </div>

            {ACTIVOS.includes(sos.estado) && (
              <>
                {telContacto && (
                  <a
                    href={`https://wa.me/${telContacto.length === 10 ? `52${telContacto}` : telContacto}?text=${textoWhatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avisar a {sos.contacto_nombre || "mi contacto"} por WhatsApp</span>
                  </a>
                )}
                <a
                  href="tel:911"
                  className="w-full flex items-center justify-center gap-2 bg-fondo text-guinda border border-gray-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Llamar al 911</span>
                </a>
                {identificado && (
                  <button
                    onClick={cancelar}
                    className="w-full text-xs font-bold text-gray-500 hover:text-red-700 py-1"
                  >
                    Cancelar SOS (falsa alarma)
                  </button>
                )}
              </>
            )}

            {!ACTIVOS.includes(sos.estado) && (
              <button
                onClick={nuevoSos}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                Enviar otro SOS
              </button>
            )}
            {error && <p className="text-xs text-red-700 text-center">{error}</p>}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Envía tu ubicación actual a tus contactos cercanos y al sistema estatal de emergencias. También vinculable con el dije físico para personas vulnerables.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {TIPOS_SOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => setTipo(t.valor)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    tipo === t.valor
                      ? "bg-red-700 text-white border-red-700 font-semibold"
                      : "bg-fondo text-gray-700 border-gray-200"
                  }`}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="¿Qué ocurre? (opcional)"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-red-700"
            />

            <div className="text-[11px] mb-3 rounded-lg px-3 py-2 bg-fondo border border-gray-200 text-gray-600">
              {identificado ? (
                <span>
                  {sesion.rol === "voluntario"
                    ? `Se enviará a nombre de ${sesion.nombre || "tu cuenta de voluntario"}.`
                    : `Se enviará con tu perfil ciudadano (${sesion.nombre || "registrado"}) y tu contacto de emergencia.`}
                </span>
              ) : (
                <span>
                  Envío sin cuenta.{" "}
                  <button
                    onClick={onIrACuenta}
                    className="font-bold text-guinda underline"
                  >
                    Regístrate
                  </button>{" "}
                  para que Protección Civil sepa quién eres y avise a tu familia.
                </span>
              )}
            </div>

            {error && <p className="text-xs text-red-700 mb-2">{error}</p>}

            <button
              onClick={emitir}
              disabled={enviando}
              className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-bold py-3 rounded-xl text-sm transition"
            >
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{enviando ? "Obteniendo ubicación y enviando..." : "Emitir Alerta Ahora"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
