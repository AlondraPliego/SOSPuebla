import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, PauseCircle, PlayCircle } from "lucide-react";
import { apiPanel } from "../api/client";

const ESTILO = {
  pendiente: "bg-amber-50 text-amber-800 border-amber-200",
  aprobado: "bg-green-50 text-green-800 border-green-200",
  rechazado: "bg-red-50 text-red-800 border-red-200",
  suspendido: "bg-gray-100 text-gray-700 border-gray-200",
};
const TEXTO = { pendiente: "Pendiente", aprobado: "Activo", rechazado: "Rechazado", suspendido: "Suspendido" };

/** Administrador estatal: aprueba, rechaza o suspende a los operadores municipales. */
export default function Operadores({ onAviso }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setLista(await apiPanel.operadores());
    } catch (e) {
      onAviso("error", e.message);
    } finally {
      setCargando(false);
    }
  }, [onAviso]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = async (o, estatus, texto) => {
    try {
      const nuevo = await apiPanel.estatusOperador(o.id, estatus);
      setLista((prev) => prev.map((x) => (x.id === o.id ? nuevo : x)));
      onAviso("ok", `${o.nombre} (${o.municipio}): ${texto}`);
    } catch (e) {
      onAviso("error", e.message);
    }
  };

  const pendientes = lista.filter((o) => o.estatus === "pendiente").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-900">Operadores municipales</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Cada operador administra solo su municipio. {pendientes > 0 && <strong>{pendientes} solicitudes pendientes.</strong>}
        </p>
      </div>

      {cargando && <p className="text-xs text-gray-500">Cargando operadores…</p>}
      {!cargando && lista.length === 0 && <p className="text-xs text-gray-500">No hay operadores registrados.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lista.map((o) => (
          <div key={o.id} className="border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-dorado">{o.municipio}</p>
                <p className="text-sm font-bold text-gray-900 truncate">{o.nombre}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {o.cargo || "Sin cargo"} · {o.correo}
                  {o.telefono ? ` · ${o.telefono}` : ""}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${ESTILO[o.estatus]}`}>
                {TEXTO[o.estatus] || o.estatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {o.estatus === "pendiente" && (
                <>
                  <button
                    onClick={() => cambiar(o, "aprobado", "acceso aprobado")}
                    className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button
                    onClick={() => cambiar(o, "rechazado", "solicitud rechazada")}
                    className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </>
              )}
              {o.estatus === "aprobado" && (
                <button
                  onClick={() => cambiar(o, "suspendido", "acceso suspendido")}
                  className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                >
                  <PauseCircle className="w-3.5 h-3.5" /> Suspender
                </button>
              )}
              {(o.estatus === "suspendido" || o.estatus === "rechazado") && (
                <button
                  onClick={() => cambiar(o, "aprobado", o.estatus === "rechazado" ? "acceso aprobado" : "acceso reactivado")}
                  className="flex items-center gap-1 bg-guinda hover:bg-guindaDark text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> {o.estatus === "rechazado" ? "Aprobar" : "Reactivar"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
