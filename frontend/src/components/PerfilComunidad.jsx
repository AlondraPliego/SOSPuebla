import { useEffect, useState } from "react";
import { UserRound, Pencil, ShieldCheck, ChevronRight } from "lucide-react";
import { api } from "../api/client";
import { CONDICIONES_VULNERABLES, ESTADOS_SOS, etiquetaTipoSos, haceCuanto } from "../api/mapeos";
import { claseInput } from "./MiCuenta";

/**
 * Tarjeta superior de la pestaña Comunidad.
 *  - sin sesión: invitación a crear cuenta
 *  - ciudadano: datos de emergencia (editables) + historial de SOS
 *  - voluntario: historial de SOS (el voluntario también puede pedir auxilio)
 */
export default function PerfilComunidad({ sesion, onAbrirCuenta }) {
  const [perfil, setPerfil] = useState(null);
  const [misSos, setMisSos] = useState([]);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const campo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const usuarioId = sesion?.usuario_id ?? null;
  const esCiudadano = sesion?.rol === "ciudadano";

  useEffect(() => {
    if (usuarioId == null) return;
    let vigente = true;
    const tareas = [api.misSos(), esCiudadano ? api.ciudadanoMe() : Promise.resolve(null)];
    Promise.all(tareas)
      .then(([s, p]) => {
        if (!vigente) return;
        setMisSos(s);
        setPerfil(p);
      })
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [usuarioId, esCiudadano]);

  if (!sesion) {
    return (
      <button
        onClick={onAbrirCuenta}
        className="w-full mb-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left hover:border-guinda transition"
      >
        <span className="w-10 h-10 rounded-full bg-fondo flex items-center justify-center shrink-0">
          <UserRound className="w-5 h-5 text-guinda" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Crea tu cuenta ciudadana</p>
          <p className="text-[11px] text-gray-500">
            Recibe el detalle de las alertas y que tu SOS llegue con tus datos y tu contacto de emergencia.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setPerfil(await api.actualizarCiudadano(form));
      setEditando(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const editar = () => {
    setForm({
      telefono: perfil.telefono || "",
      condicion_vulnerable: perfil.condicion_vulnerable || "",
      contacto_nombre: perfil.contacto_nombre || "",
      contacto_telefono: perfil.contacto_telefono || "",
    });
    setEditando(true);
  };

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 mb-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-guinda shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-dorado font-bold">
            {esCiudadano ? "Mis datos de emergencia" : "Mi cuenta de voluntario"}
          </p>
          <p className="text-sm font-bold text-gray-900 truncate">{sesion.nombre || "Mi cuenta"}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl px-3 py-2">{error}</div>}

      {esCiudadano && perfil && !editando && (
        <div className="text-xs text-gray-700 space-y-1">
          <p>
            {perfil.municipio}
            {perfil.colonia ? ` · ${perfil.colonia}` : ""} · Tel. {perfil.telefono || "—"}
          </p>
          {perfil.condicion_vulnerable && (
            <p>Condición: {CONDICIONES_VULNERABLES[perfil.condicion_vulnerable] || perfil.condicion_vulnerable}</p>
          )}
          <p>
            Contacto de emergencia:{" "}
            <strong>
              {perfil.contacto_nombre
                ? `${perfil.contacto_nombre} (${perfil.contacto_telefono || "sin teléfono"})`
                : "sin registrar"}
            </strong>
          </p>
          <button onClick={editar} className="flex items-center gap-1 text-[11px] font-bold text-guinda hover:underline pt-1">
            <Pencil className="w-3 h-3" /> Editar datos de emergencia
          </button>
        </div>
      )}

      {editando && (
        <form onSubmit={guardar} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className={claseInput} value={form.telefono} onChange={campo("telefono")} placeholder="Tu teléfono" />
          <select className={claseInput} value={form.condicion_vulnerable} onChange={campo("condicion_vulnerable")}>
            {Object.entries(CONDICIONES_VULNERABLES).map(([v, t]) => (
              <option key={v} value={v}>{t}</option>
            ))}
          </select>
          <input className={claseInput} value={form.contacto_nombre} onChange={campo("contacto_nombre")} placeholder="Nombre del contacto" />
          <input className={claseInput} value={form.contacto_telefono} onChange={campo("contacto_telefono")} placeholder="Teléfono del contacto" />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="flex-1 bg-guinda text-white font-bold py-2.5 rounded-xl text-xs">Guardar</button>
            <button type="button" onClick={() => setEditando(false)} className="flex-1 bg-fondo border border-gray-200 font-bold py-2.5 rounded-xl text-xs">Cancelar</button>
          </div>
        </form>
      )}

      <div className="pt-2 border-t border-gray-100 space-y-1.5">
        <p className="text-[11px] font-bold uppercase text-gray-600">Mis SOS</p>
        {misSos.length === 0 ? (
          <p className="text-[11px] text-gray-500">No has enviado solicitudes de auxilio.</p>
        ) : (
          misSos.slice(0, 5).map((s) => (
            <div key={s.id} className="flex justify-between gap-2 text-[11px] text-gray-600">
              <span className="truncate">SOS-{s.id} · {etiquetaTipoSos(s.tipo)}</span>
              <span className="shrink-0">{ESTADOS_SOS[s.estado] || s.estado} · {haceCuanto(s.creado_en)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
