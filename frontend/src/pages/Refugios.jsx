import { useState } from "react";
import { MapPin, Navigation, Phone, PawPrint, Users } from "lucide-react";
import { refugiosPuebla } from "../data/pueblaData";
import MapView from "../components/MapView";

export default function Refugios() {
  const [municipioFiltro, setMunicipioFiltro] = useState("Todos");
  const [seleccionado, setSeleccionado] = useState(refugiosPuebla[0]);

  const municipios = ["Todos", ...new Set(refugiosPuebla.map((r) => r.municipio))];

  const refugiosFiltrados =
    municipioFiltro === "Todos"
      ? refugiosPuebla
      : refugiosPuebla.filter((r) => r.municipio === municipioFiltro);

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start">
      <div className="space-y-4 lg:col-span-3 lg:sticky lg:top-36">
      <MapView
        puntos={refugiosFiltrados}
        seleccionado={seleccionado}
        onSelect={setSeleccionado}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {municipios.map((mun) => (
          <button
            key={mun}
            onClick={() => setMunicipioFiltro(mun)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${
              municipioFiltro === mun
                ? "bg-guinda text-white border-guinda"
                : "bg-white text-gray-700 border-gray-200 hover:border-guinda/40"
            }`}
          >
            {mun}
          </button>
        ))}
      </div>

      </div>

      <div className="space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
          Refugios Temporales en Puebla ({refugiosFiltrados.length})
        </h2>
        <span className="text-[11px] text-gray-500">Selecciona uno para ubicar</span>
      </div>

      <div className="space-y-3">
        {refugiosFiltrados.map((refugio) => {
          const porcentaje = Math.round((refugio.ocupados / refugio.capacidadTotal) * 100);
          const disponibles = refugio.capacidadTotal - refugio.ocupados;
          const esActivo = seleccionado?.id === refugio.id;

          return (
            <div
              key={refugio.id}
              onClick={() => setSeleccionado(refugio)}
              className={`bg-white rounded-xl p-4 border shadow-sm transition cursor-pointer ${
                esActivo ? "border-guinda ring-1 ring-guinda/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-dorado">
                    {refugio.municipio}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">
                    {refugio.nombre}
                  </h3>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    refugio.estado === "Activo"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {refugio.estado}
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-1.5 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-guinda shrink-0 mt-0.5" />
                <span>{refugio.direccion}</span>
              </p>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Ocupación: {refugio.ocupados} / {refugio.capacidadTotal}
                  </span>
                  <span className="font-semibold text-gray-800">{disponibles} lugares libres</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-guinda rounded-full"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-[11px] text-gray-600">
                  {refugio.mascotas && (
                    <span className="flex items-center gap-1 text-guinda font-medium">
                      <PawPrint className="w-3.5 h-3.5" />
                      Acepta mascotas
                    </span>
                  )}
                  <a
                    href={`tel:${refugio.telefono.replace(/\s/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-guinda"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {refugio.telefono}
                  </a>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${refugio.lat},${refugio.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 bg-guinda hover:bg-guindaDark text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Cómo llegar</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}