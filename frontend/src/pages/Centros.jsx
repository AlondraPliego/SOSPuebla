import { useCallback, useEffect, useState } from "react";
import { MapPin, Package, TriangleAlert } from "lucide-react";
import Refugios from "./Refugios";
import Acopio from "./Acopio";
import ZonasRiesgo from "./ZonasRiesgo";
import FiltroLocalidad from "../components/FiltroLocalidad";
import { obtenerUbicacion } from "../components/ModalSOS";
import { localidadMasCercana } from "../data/localidades";

const PESTANAS = [
  { id: "refugios", label: "Refugios", icon: MapPin },
  { id: "acopio", label: "Acopio", icon: Package },
  { id: "riesgo", label: "Zonas de riesgo", corto: "Riesgos", icon: TriangleAlert },
];

const FILTRO_VACIO = { busqueda: "", municipio: "", localidad: "" };

export default function Centros() {
  const [subVista, setSubVista] = useState("refugios");
  const [filtro, setFiltro] = useState(FILTRO_VACIO);
  // { estado: inactivo | buscando | ok | sin-permiso, lat, lng, municipio, localidad }
  const [ubicacion, setUbicacion] = useState({ estado: "inactivo" });

  // Ubica a la persona y preselecciona su municipio (la lista pone primero su localidad)
  const ubicar = useCallback(async () => {
    setUbicacion((u) => ({ ...u, estado: "buscando" }));
    const gps = await obtenerUbicacion();
    if (!gps) {
      setUbicacion({ estado: "sin-permiso" });
      return;
    }
    const cercana = localidadMasCercana(gps);
    setUbicacion({ estado: "ok", ...gps, municipio: cercana.municipio, localidad: cercana.localidad });
    setFiltro((f) => ({ ...f, municipio: cercana.municipio, localidad: "" }));
  }, []);

  // al abrir la sección se intenta ubicar automáticamente
  useEffect(() => {
    ubicar();
  }, [ubicar]);

  const props = { filtro, ubicacion, onVerTodo: () => setFiltro(FILTRO_VACIO) };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 lg:max-w-xl">
        {PESTANAS.map((p) => {
          const Icon = p.icon;
          const activa = subVista === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSubVista(p.id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                activa ? "bg-guinda text-white border-guinda" : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {p.corto ? (
                <>
                  <span className="sm:hidden">{p.corto}</span>
                  <span className="hidden sm:inline truncate">{p.label}</span>
                </>
              ) : (
                <span className="truncate">{p.label}</span>
              )}
            </button>
          );
        })}
      </div>

      <FiltroLocalidad filtro={filtro} onFiltro={setFiltro} ubicacion={ubicacion} onUbicar={ubicar} />

      {subVista === "refugios" && <Refugios {...props} />}
      {subVista === "acopio" && <Acopio {...props} />}
      {subVista === "riesgo" && <ZonasRiesgo {...props} />}
    </div>
  );
}
