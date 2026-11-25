import { useEffect, useMemo, useState } from "react";
import {
  Mountain,
  Waves,
  Landmark,
  Activity,
  Flame,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  Navigation,
} from "lucide-react";
import MapView from "../components/MapView";
import ListaPorLocalidad, { textoDistancia } from "../components/ListaPorLocalidad";
import { NIVELES_RIESGO, zonaDesdeApi } from "../data/zonasRiesgo";
import { aplicarFiltro, distanciaKm } from "../data/localidades";
import { api } from "../api/client";

const ICONOS = { volcanico: Mountain, inundacion: Waves, deslave: Landmark, sismo: Activity, incendio: Flame };

/** Zonas de riesgo por municipio y localidad, con aviso si la persona está dentro de una. */
export default function ZonasRiesgo({ filtro, ubicacion, onVerTodo }) {
  const [seleccion, setSeleccion] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [ZONAS, setZonas] = useState([]);
  const [estadoCarga, setEstadoCarga] = useState("cargando"); // cargando | ok | error

  // las zonas las administra Protección Civil desde el Centro de Mando
  useEffect(() => {
    api
      .zonasRiesgo()
      .then((lista) => {
        setZonas(lista.map(zonaDesdeApi));
        setEstadoCarga("ok");
      })
      .catch(() => setEstadoCarga("error"));
  }, []);

  const zonasFiltradas = useMemo(
    () => aplicarFiltro(ZONAS, filtro, ["tipoTexto", "descripcion"]),
    [ZONAS, filtro]
  );
  const seleccionada = zonasFiltradas.find((z) => z.id === seleccion?.id) || null;

  // ¿la persona está dentro de alguna zona? (se revisan todas, no sólo las filtradas)
  const dentro =
    ubicacion.estado === "ok"
      ? ZONAS.filter((z) => distanciaKm(ubicacion, z) * 1000 <= z.radioM).sort((a, b) =>
          a.nivel === "alto" ? -1 : b.nivel === "alto" ? 1 : 0
        )
      : [];

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start">
      <div className="space-y-3 lg:col-span-3 lg:sticky lg:top-36">
        {dentro.length > 0 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-900 rounded-2xl p-3.5">
            <TriangleAlert className="w-5 h-5 shrink-0 text-red-700" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold">Estás dentro de una zona de riesgo</p>
              {dentro.map((z) => (
                <p key={z.id}>
                  {z.nombre} · {NIVELES_RIESGO[z.nivel].etiqueta.toLowerCase()}
                </p>
              ))}
            </div>
          </div>
        )}

        <MapView
          puntos={[]}
          zonas={zonasFiltradas}
          seleccionado={seleccionada}
          onSelect={setSeleccion}
          ubicacion={ubicacion}
        />

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
          {Object.entries(NIVELES_RIESGO).map(([k, n]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: n.color, opacity: 0.7 }} />
              {n.etiqueta}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
          Zonas de riesgo ({zonasFiltradas.length})
        </h2>

        <ListaPorLocalidad
          items={zonasFiltradas}
          ubicacion={ubicacion}
          vacio={
            estadoCarga === "cargando" ? (
              "Cargando zonas de riesgo..."
            ) : estadoCarga === "error" ? (
              "No se pudieron cargar las zonas de riesgo. Revisa que el servidor esté encendido e inténtalo de nuevo."
            ) : (
            <>
              No hay zonas de riesgo registradas con este filtro.{" "}
              <button onClick={onVerTodo} className="font-bold text-guinda underline">
                Ver todo el estado
              </button>
            </>
            )
          }
          render={(z) => {
            const Icon = ICONOS[z.tipo] || TriangleAlert;
            const nivel = NIVELES_RIESGO[z.nivel];
            const activa = seleccionada?.id === z.id;
            const expandida = abierta === z.id;
            return (
              <div
                key={z.id}
                onClick={() => setSeleccion(z)}
                className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition ${
                  activa ? "border-guinda ring-1 ring-guinda/30" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${nivel.color}1a`, color: nivel.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-dorado">
                        {z.tipoTexto}
                        {z.distanciaKm != null && ` · ${textoDistancia(z.distanciaKm)} de ti`}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug">{z.nombre}</h3>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${nivel.fondo}`}>
                    {nivel.etiqueta}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{z.descripcion}</p>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAbierta(expandida ? null : z.id);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-guinda"
                  >
                    {expandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Qué hacer
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${z.lat},${z.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-guinda"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Ver en mapa
                  </a>
                </div>

                {expandida && (
                  <ol className="mt-2 space-y-1.5 text-xs text-gray-700">
                    {z.recomendaciones.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="w-4 h-4 rounded-full bg-fondo border border-gray-200 text-[10px] font-bold text-guinda flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          }}
        />

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Zonas registradas por Protección Civil de cada municipio. Consulta también el Atlas de Riesgos del
          Estado de Puebla y el Atlas Nacional de Riesgos (CENAPRED).
        </p>
      </div>
    </div>
  );
}
