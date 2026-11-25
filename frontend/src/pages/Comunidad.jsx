import { useState } from "react";
import {
  Users,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  HeartHandshake,
  MapPin,
  Radio,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

const grupoInicial = [
  {
    id: 1,
    nombre: "Patricia Morales (Mamá)",
    zona: "Col. La Paz, Puebla",
    estado: "salvo",
    hora: "Hace 5 min",
    dije: false,
  },
  {
    id: 2,
    nombre: "Abuela Francisca",
    zona: "San Pedro Cholula",
    estado: "dije",
    hora: "Conectado · Dije #PUE-04",
    dije: true,
  },
  {
    id: 3,
    nombre: "Daniel Torres",
    zona: "Zona Angelópolis",
    estado: "pendiente",
    hora: "Sin respuesta hace 20 min",
    dije: false,
  },
];

const reportesIniciales = [
  {
    id: 1,
    tipo: "Adulto mayor solo",
    zona: "Barrio de Analco, Puebla Capital",
    detalle: "Señor de aprox. 75 años sin acompañante, requiere medicamento para presión.",
    estatus: "Canalizado a DIF Estatal",
    hora: "Hace 18 min",
  },
  {
    id: 2,
    tipo: "Menor sin acompañante",
    zona: "Centro de Huauchinango",
    detalle: "Niño de 7 años resguardado con vecinos cerca del palacio municipal.",
    estatus: "Brigada en camino",
    hora: "Hace 35 min",
  },
];

export default function Comunidad() {
  const [tab, setTab] = useState("cercanos");
  const [miEstado, setMiEstado] = useState("salvo");
  const [grupo, setGrupo] = useState(grupoInicial);
  const [mostrarFormFamiliar, setMostrarFormFamiliar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaZona, setNuevaZona] = useState("");
  const [usaDije, setUsaDije] = useState(false);

  const [reportes, setReportes] = useState(reportesIniciales);
  const [tipoVulnerable, setTipoVulnerable] = useState("Adulto mayor solo");
  const [ubicacionReporte, setUbicacionReporte] = useState("");
  const [detalleReporte, setDetalleReporte] = useState("");
  const [reporteEnviado, setReporteEnviado] = useState(false);

  const agregarFamiliar = (e) => {
    e.preventDefault();
    const nuevo = {
      id: Date.now(),
      nombre: nuevoNombre,
      zona: nuevaZona || "Puebla Capital",
      estado: usaDije ? "dije" : "pendiente",
      hora: usaDije ? "Dije vinculado activo" : "Invitación enviada",
      dije: usaDije,
    };
    setGrupo((prev) => [nuevo, ...prev]);
    setNuevoNombre("");
    setNuevaZona("");
    setUsaDije(false);
    setMostrarFormFamiliar(false);
  };

  const solicitarConfirmacion = (id) => {
    setGrupo((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, estado: "salvo", hora: "Confirmó estar a salvo ahora" } : m
      )
    );
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setUbicacionReporte("19.0414, -98.2063 (Puebla Centro)");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUbicacionReporte(`${latitude.toFixed(4)}, ${longitude.toFixed(4)} (GPS)`);
      },
      () => {
        setUbicacionReporte("19.0414, -98.2063 (Puebla Capital)");
      }
    );
  };

  const enviarReporte = (e) => {
    e.preventDefault();
    const nuevoReporte = {
      id: Date.now(),
      tipo: tipoVulnerable,
      zona: ubicacionReporte || "Puebla Capital",
      detalle: detalleReporte,
      estatus: "Recibido por Protección Civil",
      hora: "Ahora",
    };
    setReportes((prev) => [nuevoReporte, ...prev]);
    setUbicacionReporte("");
    setDetalleReporte("");
    setReporteEnviado(true);
    setTimeout(() => setReporteEnviado(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("cercanos")}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
            tab === "cercanos"
              ? "bg-guinda text-white border-guinda"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tus Cercanos</span>
        </button>

        <button
          onClick={() => setTab("vulnerables")}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
            tab === "vulnerables"
              ? "bg-guinda text-white border-guinda"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Vulnerables</span>
        </button>
      </div>

      {tab === "cercanos" && (
        <div className="space-y-4">
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Mi Estado Actual
              </h2>
              <span className="text-[11px] text-gray-500">Visible para tu grupo</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setMiEstado("salvo")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                  miEstado === "salvo"
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-fondo text-gray-700 border-gray-200"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Estoy a salvo</span>
              </button>

              <button
                onClick={() => setMiEstado("ayuda")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                  miEstado === "ayuda"
                    ? "bg-red-700 text-white border-red-700"
                    : "bg-fondo text-gray-700 border-gray-200"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Necesito ayuda</span>
              </button>
            </div>
          </section>

          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Grupo Familiar ({grupo.length})
              </h2>
              <button
                onClick={() => setMostrarFormFamiliar(!mostrarFormFamiliar)}
                className="flex items-center gap-1 text-xs font-bold text-guinda hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {mostrarFormFamiliar && (
              <form
                onSubmit={agregarFamiliar}
                className="bg-white border border-guinda/40 rounded-xl p-3.5 shadow-sm space-y-2.5"
              >
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre del familiar o contacto"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />
                <input
                  type="text"
                  value={nuevaZona}
                  onChange={(e) => setNuevaZona(e.target.value)}
                  placeholder="Colonia o municipio en Puebla"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={usaDije}
                    onChange={(e) => setUsaDije(e.target.checked)}
                    className="accent-guinda"
                  />
                  <span>Vincular con Dije de Emergencia (sin celular)</span>
                </label>
                <button
                  type="submit"
                  className="w-full bg-guinda text-white font-bold py-2 rounded-lg text-xs"
                >
                  Guardar en mi grupo
                </button>
              </form>
            )}

            <div className="space-y-2.5">
              {grupo.map((persona) => (
                <div
                  key={persona.id}
                  className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{persona.nombre}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-guinda" />
                        <span>{persona.zona}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        persona.estado === "salvo"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : persona.estado === "dije"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {persona.estado === "salvo"
                        ? "A salvo"
                        : persona.estado === "dije"
                        ? "Dije Activo"
                        : "Sin confirmar"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      {persona.dije ? (
                        <Radio className="w-3.5 h-3.5 text-dorado" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {persona.hora}
                    </span>

                    {persona.estado === "pendiente" && (
                      <button
                        onClick={() => solicitarConfirmacion(persona.id)}
                        className="text-guinda font-bold hover:underline"
                      >
                        Verificar estado
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "vulnerables" && (
        <div className="space-y-4">
          <form
            onSubmit={enviarReporte}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3"
          >
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Reportar Persona Vulnerable
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Canaliza adultos mayores solos o menores sin acompañante hacia Protección Civil y DIF Puebla.
              </p>
            </div>

            {reporteEnviado && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold p-2.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Reporte canalizado al sistema estatal de emergencias.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Situación identificada
              </label>
              <select
                value={tipoVulnerable}
                onChange={(e) => setTipoVulnerable(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-guinda"
              >
                <option value="Adulto mayor solo">Adulto mayor solo</option>
                <option value="Menor sin acompañante">Menor sin acompañante / huérfano</option>
                <option value="Persona con discapacidad">Persona con discapacidad</option>
                <option value="Requiere atención médica">Requiere atención médica urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ubicación exacta o referencia
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={ubicacionReporte}
                  onChange={(e) => setUbicacionReporte(e.target.value)}
                  placeholder="Calle, colonia o municipio"
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />
                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  className="bg-fondo hover:bg-gray-200 text-guinda border border-gray-200 px-3 rounded-lg text-xs font-bold shrink-0"
                >
                  GPS
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Descripción y necesidades
              </label>
              <textarea
                rows={2}
                required
                value={detalleReporte}
                onChange={(e) => setDetalleReporte(e.target.value)}
                placeholder="Ej. Se encuentra en esquina de escuela primaria, requiere cobija y traslado."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-guinda hover:bg-guindaDark text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar y Canalizar Reporte</span>
            </button>
          </form>

          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
              Reportes Recientes en Puebla ({reportes.length})
            </h2>

            {reportes.map((rep) => (
              <div
                key={rep.id}
                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-guinda">{rep.tipo}</span>
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    {rep.estatus}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{rep.detalle}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-dorado" />
                    {rep.zona}
                  </span>
                  <span>{rep.hora}</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}