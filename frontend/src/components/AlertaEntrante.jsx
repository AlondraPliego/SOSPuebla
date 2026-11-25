import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Navigation,
  PhoneCall,
  Users,
  Check,
  X,
} from "lucide-react";
import MapView from "./MapView";

const coloresSeveridad = {
  critica: {
    fondo: "bg-red-700",
    badge: "bg-red-100 text-red-800 border-red-200",
    etiqueta: "Crítica",
  },
  alta: {
    fondo: "bg-orange-600",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    etiqueta: "Alta",
  },
  preventiva: {
    fondo: "bg-amber-600",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    etiqueta: "Preventiva",
  },
  informativa: {
    fondo: "bg-green-700",
    badge: "bg-green-100 text-green-800 border-green-200",
    etiqueta: "Informativa",
  },
};

export default function AlertaEntrante({ alerta, onCerrar }) {
  const [paso, setPaso] = useState("entrante");
  const [segundos, setSegundos] = useState(0);
  const [estadoVoluntario, setEstadoVoluntario] = useState("Confirmó asistencia");
  const [confirmados, setConfirmados] = useState(alerta.voluntariosConfirmados || 14);

  const estilo = coloresSeveridad[alerta.severidad] || coloresSeveridad.critica;

  useEffect(() => {
    if (paso === "entrante" && navigator.vibrate) {
      navigator.vibrate([300, 150, 300, 150, 400]);
    }
    const timer = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [paso]);

  const formatoTiempo = (seg) => {
    const mins = Math.floor(seg / 60);
    const resto = seg % 60;
    return `${String(mins).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
  };

  const confirmarAsistencia = () => {
    setConfirmados((prev) => prev + 1);
    setEstadoVoluntario("Confirmó asistencia");
    setPaso("detalle");
  };

  if (paso === "entrante") {
    return (
      <div
        className={`fixed inset-0 z-50 flex justify-center ${estilo.fondo} text-white`}
      >
        <div className="w-full max-w-md min-h-screen flex flex-col justify-between p-6">
          <div className="flex items-center justify-between text-xs font-semibold opacity-90">
            <span className="uppercase tracking-wider">
              Alerta · Severidad {estilo.etiqueta}
            </span>
            <span className="flex items-center gap-1 bg-black/25 px-2.5 py-1 rounded-full font-mono">
              <Clock className="w-3.5 h-3.5" />
              {formatoTiempo(segundos)}
            </span>
          </div>

          <div className="text-center space-y-4 my-auto py-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto animate-pulse">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest font-bold text-white/80">
                {alerta.tipo}
              </p>
              <h1 className="text-3xl font-black tracking-tight uppercase">
                {alerta.titulo}
              </h1>
              <p className="text-sm font-semibold text-white/95 flex items-center justify-center gap-1 pt-1">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{alerta.zona}</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-black/25 px-4 py-2 rounded-xl text-xs font-bold">
              <span>A {alerta.distancia} de tu ubicación</span>
              <span>·</span>
              <span>Emitida {alerta.hora}</span>
            </div>

            <div className="bg-black/20 border border-white/20 rounded-xl p-4 text-xs leading-relaxed text-white/95">
              {alerta.instrucciones}
            </div>
          </div>

          <div className="space-y-3 pb-2">
            <button
              onClick={confirmarAsistencia}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-black py-4 rounded-2xl text-sm shadow-lg active:scale-[0.98] transition"
            >
              <CheckCircle2 className="w-5 h-5 text-green-700" />
              <span>CONFIRMO ASISTENCIA</span>
            </button>

            <button
              onClick={onCerrar}
              className="w-full flex items-center justify-center gap-2 bg-black/30 hover:bg-black/40 text-white border border-white/30 font-bold py-3.5 rounded-2xl text-xs transition"
            >
              <XCircle className="w-4 h-4" />
              <span>No puedo ahora</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-200 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-fondo flex flex-col shadow-xl overflow-y-auto">
        <div className="bg-guinda text-white px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold">
              Detalle de Incidente · {alerta.estadoIncidente}
            </p>
            <h2 className="text-base font-bold">{alerta.titulo}</h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 pb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500">Tu estado actual</p>
              <p className="text-sm font-bold text-guinda">{estadoVoluntario}</p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${estilo.badge}`}>
              Severidad {estilo.etiqueta}
            </span>
          </div>

          <MapView
            puntos={[
              {
                id: alerta.id,
                nombre: alerta.puntoEncuentro,
                direccion: alerta.zona,
                lat: alerta.lat,
                lng: alerta.lng,
              },
            ]}
            seleccionado={{
              id: alerta.id,
              lat: alerta.lat,
              lng: alerta.lng,
            }}
            onSelect={() => {}}
          />

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase text-dorado">Punto de encuentro</p>
                <p className="text-sm font-bold text-gray-900">{alerta.puntoEncuentro}</p>
                <p className="text-xs text-gray-500 mt-0.5">{alerta.zona}</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${alerta.lat},${alerta.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 bg-guinda text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Ruta</span>
              </a>
            </div>

            <div className="pt-2.5 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase text-gray-600 mb-1.5">
                Categorías solicitadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {alerta.categoriasRequeridas.map((cat) => (
                  <span
                    key={cat}
                    className="text-[11px] bg-fondo text-gray-800 border border-gray-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2.5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-700 font-semibold">
              <Users className="w-4 h-4 text-guinda" />
              <span>{confirmados} voluntarios confirmados en esta alerta</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setEstadoVoluntario("En camino")}
              className={`w-full py-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                estadoVoluntario === "En camino"
                  ? "bg-guinda text-white border-guinda"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              {estadoVoluntario === "En camino" && <Check className="w-4 h-4" />}
              <span>Ya voy en camino</span>
            </button>

            <button
              onClick={() => setEstadoVoluntario("En zona")}
              className={`w-full py-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                estadoVoluntario === "En zona"
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              {estadoVoluntario === "En zona" && <Check className="w-4 h-4" />}
              <span>Llegué a la zona (Check-in)</span>
            </button>

            <a
              href="tel:8007134147"
              className="w-full py-3 rounded-xl text-xs font-bold bg-fondo text-guinda border border-gray-300 flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Contactar coordinador</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}