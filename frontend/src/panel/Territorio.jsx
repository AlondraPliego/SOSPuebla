import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag, House, Package, TriangleAlert, Plus, Pencil, Trash2, X, Lock, Crosshair } from "lucide-react";
import MapView from "../components/MapView";
import { apiPanel } from "../api/client";
import { MUNICIPIOS_CATALOGO, localidadesDe, coordsMunicipio, localidadMasCercana } from "../data/localidades";
import { NIVELES_RIESGO, TIPOS_RIESGO } from "../data/zonasRiesgo";
import { PRIORIDADES } from "../api/mapeos";
import { puedeAdministrar, esAdmin, mismoMunicipio } from "./alcance";

const claseInput =
  "w-full px-3 py-2 text-sm md:text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-guinda disabled:bg-fondo disabled:text-gray-500";
const claseEtiqueta = "block text-[11px] font-semibold text-gray-700 mb-1";

// Qué campos tiene cada tipo de lugar (además de nombre, municipio, localidad y ubicación)
const TIPOS = {
  puntos: {
    titulo: "Puntos de encuentro",
    singular: "punto de encuentro",
    icon: Flag,
    color: "#2563eb",
    ayuda:
      "Lugar donde se reúnen los voluntarios de la zona al recibir una alerta. Lo ven en su gafete desde antes de la emergencia.",
    vacio: { direccion: "", indicaciones: "", responsable: "", telefono: "", activo: true },
  },
  refugios: {
    titulo: "Refugios",
    singular: "refugio",
    icon: House,
    color: "#691C32",
    ayuda: "Albergue temporal para población evacuada. La ocupación se muestra en la app.",
    vacio: { direccion: "", capacidad: 100, ocupados: 0, estado: "disponible", mascotas: false, telefono: "" },
  },
  centros: {
    titulo: "Centros de acopio",
    singular: "centro de acopio",
    icon: Package,
    color: "#0f766e",
    ayuda: "Recibe donativos. Sus necesidades (urgente, normal, suficiente) aparecen en la app.",
    vacio: { direccion: "", horario: "9:00 - 18:00", telefono: "", responsable: "", abierto: true },
  },
  zonas: {
    titulo: "Zonas de riesgo",
    singular: "zona de riesgo",
    icon: TriangleAlert,
    color: "#b91c1c",
    ayuda: "Área (círculo) con un riesgo identificado. La app avisa a quien está dentro y muestra qué hacer.",
    vacio: { tipo: "inundacion", nivel: "medio", radio_m: 500, descripcion: "", recomendaciones: "" },
  },
};

const ESTADOS_REFUGIO = ["disponible", "activo", "lleno", "cerrado"];

/** Lo que el backend recibe para cada tipo (sólo los campos que acepta). */
function cuerpo(tipo, f) {
  const base = { nombre: f.nombre, municipio: f.municipio, localidad: f.localidad || null, lat: f.lat, lng: f.lng };
  if (tipo === "puntos")
    return { ...base, direccion: f.direccion, indicaciones: f.indicaciones, responsable: f.responsable, telefono: f.telefono, activo: !!f.activo };
  if (tipo === "refugios")
    return { ...base, direccion: f.direccion, capacidad: Number(f.capacidad) || 0, ocupados: Number(f.ocupados) || 0, estado: f.estado, mascotas: !!f.mascotas, telefono: f.telefono };
  if (tipo === "centros")
    return { ...base, direccion: f.direccion, horario: f.horario, telefono: f.telefono, responsable: f.responsable, abierto: !!f.abierto, necesidades: f.id ? null : [] };
  return { ...base, tipo: f.tipo, nivel: f.nivel, radio_m: Number(f.radio_m) || 0, descripcion: f.descripcion, recomendaciones: f.recomendaciones };
}

export default function Territorio({ sesion, onAviso }) {
  const [tipo, setTipo] = useState("puntos");
  // una lista por tipo: al cambiar de pestaña nunca se mezclan (p. ej. puntos dibujados como zonas)
  const [listas, setListas] = useState({});
  const items = listas[tipo] || [];
  const [cargando, setCargando] = useState(false);
  const [municipio, setMunicipio] = useState(esAdmin(sesion) ? "" : sesion?.municipio || "");
  const [editando, setEditando] = useState(null); // objeto del formulario o null
  const [seleccion, setSeleccion] = useState(null);
  const conf = TIPOS[tipo];

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await apiPanel.territorio[tipo].listar();
      setListas((prev) => ({ ...prev, [tipo]: lista }));
    } catch (e) {
      onAviso("error", e.message);
    } finally {
      setCargando(false);
    }
  }, [tipo, onAviso]);

  useEffect(() => {
    setSeleccion(null);
    cargar();
  }, [cargar]);

  const visibles = useMemo(
    () => items.filter((x) => !municipio || mismoMunicipio(x.municipio, municipio)),
    [items, municipio]
  );
  const puedeAgregar = esAdmin(sesion) || !!sesion?.municipio;

  const nuevo = () => {
    const m = esAdmin(sesion) ? municipio || "Puebla" : sesion.municipio;
    setEditando({ nombre: "", municipio: m, localidad: "", ...coordsMunicipio(m), ...conf.vacio });
  };

  const editar = (x) =>
    setEditando({
      ...conf.vacio,
      ...x,
      // los campos nulos del backend se editan como texto vacío
      ...Object.fromEntries(Object.entries(x).map(([k, v]) => [k, v ?? ""])),
    });

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const datos = cuerpo(tipo, editando);
      if (editando.id) await apiPanel.territorio[tipo].actualizar(editando.id, datos);
      else await apiPanel.territorio[tipo].crear(datos);
      onAviso("ok", `${conf.singular[0].toUpperCase()}${conf.singular.slice(1)} “${editando.nombre}” guardado.`);
      setEditando(null);
      cargar();
    } catch (err) {
      onAviso("error", err.message);
    }
  };

  const borrar = async (x) => {
    if (!window.confirm(`¿Eliminar ${conf.singular} “${x.nombre}”? Esta acción no se puede deshacer.`)) return;
    try {
      await apiPanel.territorio[tipo].borrar(x.id);
      onAviso("ok", `Se eliminó “${x.nombre}”.`);
      cargar();
    } catch (err) {
      onAviso("error", err.message);
    }
  };

  // Necesidades de un centro de acopio (se guardan al momento)
  const agregarNecesidad = async (centro, item, prioridad) => {
    try {
      await apiPanel.agregarNecesidad(centro.id, { item, prioridad });
      cargar();
    } catch (err) {
      onAviso("error", err.message);
    }
  };
  const quitarNecesidad = async (centro, n) => {
    try {
      await apiPanel.borrarNecesidad(centro.id, n.id);
      cargar();
    } catch (err) {
      onAviso("error", err.message);
    }
  };

  const puntosMapa = tipo === "zonas" ? [] : visibles.map((x) => ({ ...x, color: conf.color }));
  const zonasMapa =
    tipo === "zonas"
      ? visibles.map((z) => ({ ...z, radioM: z.radio_m, color: NIVELES_RIESGO[z.nivel]?.color || "#d97706" }))
      : [];

  return (
    <div className="space-y-4">
      {/* tipo de lugar */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        {Object.entries(TIPOS).map(([k, t]) => {
          const Icon = t.icon;
          return (
            <button
              key={k}
              onClick={() => setTipo(k)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 transition ${
                tipo === k ? "bg-guinda text-white border-guinda" : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.titulo}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">{conf.titulo}</p>
          <p className="text-[11px] text-gray-500">{conf.ayuda}</p>
        </div>
        <label className="md:w-56">
          <span className={claseEtiqueta}>Municipio</span>
          <select className={claseInput} value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="">Todo el estado</option>
            {MUNICIPIOS_CATALOGO.map((m) => (
              <option key={m} value={m}>
                {m}
                {!esAdmin(sesion) && mismoMunicipio(m, sesion?.municipio) ? " (mi municipio)" : ""}
              </option>
            ))}
          </select>
        </label>
        {puedeAgregar && (
          <button
            onClick={nuevo}
            className="flex items-center justify-center gap-1.5 bg-guinda hover:bg-guindaDark text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Agregar {conf.singular}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:items-start">
        <div className="lg:col-span-3 lg:sticky lg:top-20">
          <MapView puntos={puntosMapa} zonas={zonasMapa} seleccionado={seleccion} onSelect={setSeleccion} />
        </div>

        <div className="lg:col-span-2 space-y-2.5">
          {cargando && <p className="text-xs text-gray-500">Cargando…</p>}
          {!cargando && visibles.length === 0 && (
            <p className="text-xs text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center">
              No hay {conf.titulo.toLowerCase()} registrados{municipio ? ` en ${municipio}` : ""}.
            </p>
          )}
          {visibles.map((x) => {
            const puede = puedeAdministrar(sesion, x.municipio);
            return (
              <div
                key={x.id}
                onClick={() => setSeleccion(x)}
                className={`bg-white border rounded-xl p-3.5 shadow-sm cursor-pointer transition ${
                  seleccion?.id === x.id ? "border-guinda ring-1 ring-guinda/30" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-dorado">
                      {x.municipio}
                      {x.localidad ? ` · ${x.localidad}` : ""}
                    </p>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{x.nombre}</p>
                    <Detalle tipo={tipo} x={x} />
                  </div>
                  {puede ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editar(x);
                        }}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-guinda"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          borrar(x);
                        }}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-red-700"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0" title="Otro municipio: solo lectura">
                      <Lock className="w-3 h-3" /> Solo lectura
                    </span>
                  )}
                </div>

                {tipo === "centros" && (
                  <Necesidades
                    centro={x}
                    puede={puede}
                    onAgregar={agregarNecesidad}
                    onQuitar={quitarNecesidad}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editando && (
        <Editor
          tipo={tipo}
          conf={conf}
          sesion={sesion}
          valor={editando}
          onCambio={setEditando}
          onGuardar={guardar}
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

/** Una línea de datos según el tipo de lugar. */
function Detalle({ tipo, x }) {
  const linea = "text-[11px] text-gray-600 mt-0.5";
  if (tipo === "puntos")
    return (
      <>
        {x.indicaciones && <p className={linea}>{x.indicaciones}</p>}
        <p className="text-[10px] text-gray-400 mt-0.5">
          {x.activo ? "Activo" : "Inactivo"}
          {x.responsable ? ` · ${x.responsable}` : ""}
          {x.telefono ? ` · ${x.telefono}` : ""}
        </p>
      </>
    );
  if (tipo === "refugios")
    return (
      <p className={linea}>
        {x.ocupados}/{x.capacidad} personas · {x.estado}
        {x.mascotas ? " · acepta mascotas" : ""}
      </p>
    );
  if (tipo === "centros")
    return (
      <p className={linea}>
        {x.abierto ? "Abierto" : "Cerrado"}
        {x.horario ? ` · ${x.horario}` : ""}
      </p>
    );
  return (
    <p className={linea}>
      {TIPOS_RIESGO[x.tipo]?.etiqueta || x.tipo} · {NIVELES_RIESGO[x.nivel]?.etiqueta || x.nivel} · radio{" "}
      {x.radio_m >= 1000 ? `${(x.radio_m / 1000).toFixed(1)} km` : `${x.radio_m} m`}
    </p>
  );
}

/** Necesidades de un centro de acopio: se agregan y quitan al momento. */
function Necesidades({ centro, puede, onAgregar, onQuitar }) {
  const [item, setItem] = useState("");
  const [prioridad, setPrioridad] = useState("urgente");
  return (
    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1">
        {centro.necesidades?.length === 0 && <span className="text-[10px] text-gray-400">Sin necesidades registradas</span>}
        {centro.necesidades?.map((n) => (
          <span
            key={n.id}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${
              n.prioridad === "urgente"
                ? "bg-red-50 text-red-800 border-red-200"
                : n.prioridad === "suficiente"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-fondo text-gray-700 border-gray-200"
            }`}
          >
            {n.item} · {PRIORIDADES[n.prioridad] || n.prioridad}
            {puede && (
              <button onClick={() => onQuitar(centro, n)} className="hover:text-red-700" title="Quitar">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {puede && (
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!item.trim()) return;
            onAgregar(centro, item.trim(), prioridad);
            setItem("");
          }}
        >
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Agregar necesidad (ej. cobijas)"
            className="flex-1 min-w-0 px-2 py-1 text-[11px] border border-gray-300 rounded-lg"
          />
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            className="px-1.5 py-1 text-[11px] border border-gray-300 rounded-lg bg-white"
          >
            {Object.entries(PRIORIDADES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button className="px-2 py-1 bg-guinda text-white rounded-lg" title="Agregar">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}

/** Formulario de alta/edición con selector de ubicación en el mapa. */
function Editor({ tipo, conf, sesion, valor, onCambio, onGuardar, onCerrar }) {
  const f = valor;
  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    onCambio((prev) => ({ ...prev, [k]: v }));
  };
  const cambiarMunicipio = (e) => {
    const m = e.target.value;
    onCambio((prev) => ({ ...prev, municipio: m, localidad: "", ...coordsMunicipio(m) }));
  };
  const marcar = ({ lat, lng }) => {
    // al marcar en el mapa se sugiere la localidad más cercana del mismo municipio
    const cercana = localidadMasCercana({ lat, lng }, f.municipio);
    onCambio((prev) => ({
      ...prev,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      localidad: prev.localidad || cercana?.localidad || "",
    }));
  };
  const listaLocalidades = localidadesDe(f.municipio);
  const punto = { id: "nuevo", nombre: f.nombre || "Nueva ubicación", lat: f.lat, lng: f.lng, color: conf.color };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center md:p-4" onClick={onCerrar}>
      <form
        onSubmit={onGuardar}
        onClick={(e) => e.stopPropagation()}
        className="animate-subir bg-white w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[94vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">
            {f.id ? "Editar" : "Agregar"} {conf.singular}
          </p>
          <button type="button" onClick={onCerrar} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className={claseEtiqueta}>Nombre</label>
              <input required className={claseInput} value={f.nombre} onChange={set("nombre")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={claseEtiqueta}>Municipio</label>
                <select
                  className={claseInput}
                  value={f.municipio}
                  onChange={cambiarMunicipio}
                  disabled={!esAdmin(sesion)}
                  title={esAdmin(sesion) ? "" : "Como operador municipal solo administras tu municipio"}
                >
                  {MUNICIPIOS_CATALOGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={claseEtiqueta}>Localidad</label>
                <input
                  className={claseInput}
                  value={f.localidad}
                  onChange={set("localidad")}
                  list="localidades-editor"
                  placeholder="Colonia o junta auxiliar"
                />
                <datalist id="localidades-editor">
                  {listaLocalidades.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>
            </div>

            {tipo !== "zonas" && (
              <div>
                <label className={claseEtiqueta}>Dirección</label>
                <input className={claseInput} value={f.direccion} onChange={set("direccion")} />
              </div>
            )}

            {tipo === "puntos" && (
              <>
                <div>
                  <label className={claseEtiqueta}>Indicaciones para los voluntarios</label>
                  <textarea
                    rows={2}
                    className={claseInput}
                    value={f.indicaciones}
                    onChange={set("indicaciones")}
                    placeholder="Ej. Preséntate en la carpa de Protección Civil con tu gafete"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={claseEtiqueta}>Responsable</label>
                    <input className={claseInput} value={f.responsable} onChange={set("responsable")} />
                  </div>
                  <div>
                    <label className={claseEtiqueta}>Teléfono</label>
                    <input className={claseInput} value={f.telefono} onChange={set("telefono")} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input type="checkbox" checked={!!f.activo} onChange={set("activo")} className="accent-guinda" />
                  Punto activo (visible para los voluntarios)
                </label>
              </>
            )}

            {tipo === "refugios" && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={claseEtiqueta}>Capacidad</label>
                    <input type="number" min="0" className={claseInput} value={f.capacidad} onChange={set("capacidad")} />
                  </div>
                  <div>
                    <label className={claseEtiqueta}>Ocupados</label>
                    <input type="number" min="0" className={claseInput} value={f.ocupados} onChange={set("ocupados")} />
                  </div>
                  <div>
                    <label className={claseEtiqueta}>Estado</label>
                    <select className={claseInput} value={f.estado} onChange={set("estado")}>
                      {ESTADOS_REFUGIO.map((e) => (
                        <option key={e} value={e}>
                          {e[0].toUpperCase() + e.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className={claseEtiqueta}>Teléfono</label>
                    <input className={claseInput} value={f.telefono} onChange={set("telefono")} />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 pb-2">
                    <input type="checkbox" checked={!!f.mascotas} onChange={set("mascotas")} className="accent-guinda" />
                    Acepta mascotas
                  </label>
                </div>
              </>
            )}

            {tipo === "centros" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={claseEtiqueta}>Horario</label>
                    <input className={claseInput} value={f.horario} onChange={set("horario")} />
                  </div>
                  <div>
                    <label className={claseEtiqueta}>Teléfono</label>
                    <input className={claseInput} value={f.telefono} onChange={set("telefono")} />
                  </div>
                </div>
                <div>
                  <label className={claseEtiqueta}>Responsable</label>
                  <input className={claseInput} value={f.responsable} onChange={set("responsable")} />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input type="checkbox" checked={!!f.abierto} onChange={set("abierto")} className="accent-guinda" />
                  Abierto (recibiendo donativos)
                </label>
                {!f.id && (
                  <p className="text-[11px] text-gray-500">Las necesidades se agregan en la lista, después de guardar.</p>
                )}
              </>
            )}

            {tipo === "zonas" && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={claseEtiqueta}>Tipo</label>
                    <select className={claseInput} value={f.tipo} onChange={set("tipo")}>
                      {Object.entries(TIPOS_RIESGO).map(([k, t]) => (
                        <option key={k} value={k}>
                          {t.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={claseEtiqueta}>Nivel</label>
                    <select className={claseInput} value={f.nivel} onChange={set("nivel")}>
                      {Object.entries(NIVELES_RIESGO).map(([k, n]) => (
                        <option key={k} value={k}>
                          {n.etiqueta.replace("Riesgo ", "")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={claseEtiqueta}>Radio (m)</label>
                    <input type="number" min="50" max="50000" step="50" className={claseInput} value={f.radio_m} onChange={set("radio_m")} />
                  </div>
                </div>
                <div>
                  <label className={claseEtiqueta}>Descripción del riesgo</label>
                  <textarea rows={2} className={claseInput} value={f.descripcion} onChange={set("descripcion")} />
                </div>
                <div>
                  <label className={claseEtiqueta}>Qué hacer (una recomendación por línea)</label>
                  <textarea rows={3} className={claseInput} value={f.recomendaciones} onChange={set("recomendaciones")} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
              <Crosshair className="w-3.5 h-3.5 text-guinda" /> Haz clic en el mapa para marcar la ubicación
            </p>
            <MapView
              alto="h-64 md:h-80"
              puntos={tipo === "zonas" ? [] : [punto]}
              zonas={
                tipo === "zonas"
                  ? [{ ...punto, radioM: Number(f.radio_m) || 0, color: NIVELES_RIESGO[f.nivel]?.color || "#d97706" }]
                  : []
              }
              seleccionado={punto}
              onSelect={() => {}}
              onMapClick={marcar}
            />
            <p className="text-[11px] text-gray-500 font-mono">
              {Number(f.lat).toFixed(5)}, {Number(f.lng).toFixed(5)}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex gap-2 justify-end">
          <button type="button" onClick={onCerrar} className="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300">
            Cancelar
          </button>
          <button type="submit" className="px-5 py-2.5 rounded-xl text-xs font-bold bg-guinda hover:bg-guindaDark text-white">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
