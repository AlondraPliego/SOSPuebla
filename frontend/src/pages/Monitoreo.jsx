import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CloudRain,
  Activity,
  Flame,
  RefreshCw,
} from "lucide-react";

export default function Monitoreo() {
  const [clima, setClima] = useState(null);
  const [sismo, setSismo] = useState(null);
  const [eventoNasa, setEventoNasa] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");

  const cargarDatosReales = async () => {
    setCargando(true);
    try {
      const [resClima, resSismo, resNasa] = await Promise.all([
        fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=19.0414&longitude=-98.2063&current=temperature_2m,precipitation,wind_speed_10m&timezone=America%2FMexico_City"
        ),
        fetch(
          "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=19.0414&longitude=-98.2063&maxradiuskm=300&limit=1"
        ),
        fetch(
          "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&bbox=-100.5,21.0,-96.5,17.5&limit=1"
        ),
      ]);

      if (resClima.ok) {
        const dataClima = await resClima.json();
        setClima(dataClima.current);
      }

      if (resSismo.ok) {
        const dataSismo = await resSismo.json();
        if (dataSismo.features && dataSismo.features.length > 0) {
          setSismo(dataSismo.features[0]);
        }
      }

      if (resNasa.ok) {
        const dataNasa = await resNasa.json();
        if (dataNasa.events && dataNasa.events.length > 0) {
          setEventoNasa(dataNasa.events[0]);
        } else {
          setEventoNasa(null);
        }
      }

      const ahora = new Date();
      setUltimaActualizacion(
        ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      setUltimaActualizacion("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosReales();
  }, []);

  const nivelLluvia =
    clima && clima.precipitation > 5
      ? { texto: "Riesgo Inundación", estilo: "bg-red-50 text-red-800 border-red-200" }
      : clima && clima.precipitation > 0
      ? { texto: "Lluvia Activa", estilo: "bg-blue-50 text-blue-800 border-blue-200" }
      : { texto: "Sin Lluvia", estilo: "bg-gray-100 text-gray-700 border-gray-200" };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
          Monitoreo Real · Puebla
        </h2>
        <button
          onClick={cargarDatosReales}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-guinda transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} />
          <span>{cargando ? "Actualizando..." : `En vivo · ${ultimaActualizacion}`}</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-guinda shrink-0" />
            <h3 className="font-bold text-gray-900 text-sm">Clima y Riesgo Pluvial</h3>
          </div>
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${nivelLluvia.estilo}`}
          >
            {nivelLluvia.texto}
          </span>
        </div>

        {clima ? (
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-fondo rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Temperatura</p>
              <p className="text-sm font-bold text-gray-900">{clima.temperature_2m} °C</p>
            </div>
            <div className="bg-fondo rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Lluvia</p>
              <p className="text-sm font-bold text-gray-900">{clima.precipitation} mm</p>
            </div>
            <div className="bg-fondo rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Viento</p>
              <p className="text-sm font-bold text-gray-900">{clima.wind_speed_10m} km/h</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-2">Consultando estación meteorológica...</p>
        )}

        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Open-Meteo · Puebla Capital</span>
          <span>Tiempo real</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-guinda shrink-0" />
            <h3 className="font-bold text-gray-900 text-sm">Actividad Sísmica Cercana</h3>
          </div>
          {sismo && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              M {sismo.properties.mag?.toFixed(1)}
            </span>
          )}
        </div>

        {sismo ? (
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            Último evento registrado: <strong>{sismo.properties.place}</strong> (
            {new Date(sismo.properties.time).toLocaleString("es-MX", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
            ).
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-2">
            {cargando ? "Consultando red sísmica..." : "Sin sismos recientes en un radio de 300 km."}
          </p>
        )}

        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>USGS · Radio 300 km de Puebla</span>
          <span>API Oficial</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {eventoNasa ? (
              <Flame className="w-5 h-5 text-red-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <h3 className="font-bold text-gray-900 text-sm">
              {eventoNasa ? eventoNasa.title : "Volcán Popocatépetl y Satélite"}
            </h3>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
            {eventoNasa ? eventoNasa.categories?.[0]?.title || "Activo" : "Amarillo Fase 2"}
          </span>
        </div>

        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
          {eventoNasa
            ? `Evento activo detectado por satélite NASA en la región centro de México (${new Date(
                eventoNasa.geometry?.[0]?.date
              ).toLocaleDateString("es-MX")}).`
            : "Sin incendios ni tormentas severas activas en satélite NASA para Puebla. Monitoreo volcánico permanente."}
        </p>

        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>NASA EONET / CENAPRED</span>
          <span>Satelital</span>
        </div>
      </div>
    </section>
  );
}