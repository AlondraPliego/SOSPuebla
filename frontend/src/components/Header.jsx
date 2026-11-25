import { ShieldAlert, Radio, UserRound, HeartHandshake } from "lucide-react";
import { itemsNav } from "./BottomNav";

const titulos = {
  monitoreo: "Monitoreo y Riesgos",
  centros: "Refugios y Acopio",
  preparate: "Prepárate",
  voluntarios: "Portal de Voluntarios",
  comunidad: "Encuentra tu Comunidad",
};

const iniciales = (nombre) =>
  (nombre || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

function BotonCuenta({ sesion, onOpenCuenta, compacto }) {
  const esVoluntario = sesion?.rol === "voluntario";
  return (
    <button
      onClick={onOpenCuenta}
      title={sesion ? "Mi cuenta" : "Iniciar sesión"}
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 transition text-white text-xs font-semibold rounded-xl border border-white/15 px-2.5 py-2"
    >
      {sesion ? (
        <span className="w-6 h-6 rounded-full bg-white text-guinda text-[10px] font-black flex items-center justify-center">
          {iniciales(sesion.nombre)}
        </span>
      ) : (
        <UserRound className="w-4 h-4" />
      )}
      {!compacto && (
        <span className="max-w-[9rem] truncate">
          {sesion ? sesion.nombre?.split(" ")[0] || "Mi cuenta" : "Iniciar sesión"}
        </span>
      )}
      {esVoluntario && !compacto && <HeartHandshake className="w-3.5 h-3.5 text-gray-300" />}
    </button>
  );
}

export default function Header({ vistaActual, setVistaActual, onOpenSOS, onOpenCuenta, sesion }) {
  return (
    <header className="bg-guinda text-white lg:sticky lg:top-0 lg:z-30 rounded-b-3xl lg:rounded-none shadow-sm">
      <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-6 pb-5 lg:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              Protección Civil · Estado de Puebla
            </p>
            {/* teléfono: título de la sección · escritorio: marca */}
            <h1 className="text-xl font-bold tracking-tight mt-0.5 lg:hidden">
              {titulos[vistaActual] || "Alerta Puebla"}
            </h1>
            <h1 className="hidden lg:flex items-center gap-2 text-lg font-black tracking-tight mt-0.5">
              <ShieldAlert className="w-5 h-5" />
              Alerta Puebla
            </h1>
          </div>

          {/* navegación de escritorio */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 rounded-2xl p-1">
            {itemsNav.map((item) => {
              const Icon = item.icon;
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    activo ? "bg-white text-guinda shadow-sm" : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="lg:hidden">
              <BotonCuenta sesion={sesion} onOpenCuenta={onOpenCuenta} compacto />
            </div>
            <div className="hidden lg:block">
              <BotonCuenta sesion={sesion} onOpenCuenta={onOpenCuenta} />
            </div>
            <button
              onClick={onOpenSOS}
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 active:scale-95 transition text-white text-xs font-bold px-3 py-2 rounded-xl border border-red-400/40 shadow-sm"
            >
              <Radio className="w-4 h-4" />
              <span>SOS</span>
            </button>
          </div>
        </div>

        <div className="mt-3 lg:mt-2.5 flex items-center gap-2 bg-guindaDark/70 px-3 py-1.5 rounded-lg text-xs text-gray-100 border border-white/10 lg:w-fit">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">
            Semáforo Popocatépetl: <strong className="text-amber-300">Amarillo Fase 2</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
