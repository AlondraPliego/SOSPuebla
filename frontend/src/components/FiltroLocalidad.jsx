import { Search, LocateFixed, MapPin, Loader2, X } from "lucide-react";
import { MUNICIPIOS_CATALOGO, localidadesDe } from "../data/localidades";

const claseSelect =
  "w-full px-3 py-2.5 text-sm md:text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-guinda";

/**
 * Búsqueda + Municipio + Localidad, compartido por Refugios, Centros de acopio y Zonas de riesgo.
 * La ubicación de la persona (GPS) preselecciona su municipio; la puede cambiar cuando quiera.
 */
export default function FiltroLocalidad({ filtro, onFiltro, ubicacion, onUbicar }) {
  const cambiar = (cambios) => onFiltro({ ...filtro, ...cambios });
  const localidades = filtro.municipio ? localidadesDe(filtro.municipio) : [];

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-3 md:p-4 shadow-sm space-y-2.5">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={filtro.busqueda}
          onChange={(e) => cambiar({ busqueda: e.target.value })}
          placeholder="Buscar lugar o colonia"
          className="w-full pl-9 pr-9 py-2.5 text-sm md:text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-guinda"
        />
        {filtro.busqueda && (
          <button
            onClick={() => cambiar({ busqueda: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
            title="Borrar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_auto] gap-2">
        <label className="block">
        <span className="block text-[11px] font-semibold text-gray-600 mb-1">Municipio</span>
        <select
          value={filtro.municipio}
          onChange={(e) => cambiar({ municipio: e.target.value, localidad: "" })}
          className={claseSelect}
          aria-label="Municipio"
        >
          <option value="">Todos</option>
          {MUNICIPIOS_CATALOGO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        </label>

        <label className="block">
        <span className="block text-[11px] font-semibold text-gray-600 mb-1">Localidad</span>
        <select
          value={filtro.localidad}
          onChange={(e) => cambiar({ localidad: e.target.value })}
          disabled={!filtro.municipio}
          className={`${claseSelect} disabled:bg-fondo disabled:text-gray-400`}
          aria-label="Localidad"
        >
          <option value="">{filtro.municipio ? "Todas" : "Elige municipio"}</option>
          {localidades.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        </label>

        <button
          onClick={onUbicar}
          disabled={ubicacion.estado === "buscando"}
          className="col-span-2 md:col-span-1 md:self-end flex items-center justify-center gap-1.5 bg-guinda hover:bg-guindaDark disabled:bg-gray-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
        >
          {ubicacion.estado === "buscando" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
          <span>Cerca de mí</span>
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
        <MapPin className="w-3.5 h-3.5 text-guinda shrink-0" />
        {ubicacion.estado === "buscando" && <span>Buscando tu ubicación…</span>}
        {ubicacion.estado === "ok" && (
          <span>
            Estás cerca de <strong className="text-gray-800">{ubicacion.localidad}</strong>, {ubicacion.municipio}.
            {(filtro.municipio || filtro.localidad) && (
              <>
                {" "}
                <button
                  onClick={() => cambiar({ municipio: "", localidad: "" })}
                  className="font-semibold text-guinda underline"
                >
                  Ver todo el estado
                </button>
              </>
            )}
          </span>
        )}
        {ubicacion.estado === "sin-permiso" && (
          <span>Activa tu ubicación para ver primero lo más cercano, o elige tu municipio y localidad.</span>
        )}
        {ubicacion.estado === "inactivo" && <span>Elige tu municipio y localidad, o usa “Cerca de mí”.</span>}
      </p>
    </section>
  );
}
