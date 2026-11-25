import { ShieldAlert, Radio } from "lucide-react";


const titulos = {
  monitoreo: "Monitoreo y Riesgos",
  centros: "Refugios y Acopio",
  preparate: "Prepárate",
  voluntarios: "Portal de Voluntarios",
  comunidad: "Encuentra tu Comunidad",
};

export default function Header({ vistaActual, onOpenSOS }) {
  return (
<header className="bg-guinda text-white px-5 pt-6 pb-5 rounded-b-3xl shadow-sm">
<div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-dorado font-semibold">
            Protección Civil · Estado de Puebla
          </p>
          <h1 className="text-xl font-bold tracking-tight mt-0.5">
            {titulos[vistaActual] || "Alerta Puebla"}
          </h1>
        </div>

        <button
          onClick={onOpenSOS}
          className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 active:scale-95 transition text-white text-xs font-bold px-3 py-2 rounded-xl border border-red-400/40 shadow-sm"
        >
          <Radio className="w-4 h-4" />
          <span>SOS</span>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 bg-guindaDark/70 px-3 py-1.5 rounded-lg text-xs text-gray-100 border border-white/10">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="truncate">
          Semáforo Popocatépetl: <strong className="text-amber-300">Amarillo Fase 2</strong>
        </span>
      </div>
    </header>
  );
}