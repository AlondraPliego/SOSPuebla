import { Home, Info, BookOpen, HeartHandshake, Users } from "lucide-react";

export const itemsNav = [
  { id: "monitoreo", label: "Inicio", icon: Home },
  { id: "centros", label: "Centros", icon: Info },
  { id: "preparate", label: "Prepárate", icon: BookOpen },
  { id: "voluntarios", label: "Voluntarios", icon: HeartHandshake },
  { id: "comunidad", label: "Comunidad", icon: Users },
];

/** Barra inferior: sólo en teléfono/tablet. En escritorio la navegación está en el encabezado. */
export default function BottomNav({ vistaActual, setVistaActual }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-white/95 backdrop-blur border-t border-gray-200 px-1 pt-2 pb-safe flex justify-around items-center pointer-events-auto shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {itemsNav.map((item) => {
          const Icon = item.icon;
          const activo = vistaActual === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setVistaActual(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
                activo ? "text-guinda font-semibold bg-fondo" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className={`w-5 h-5 ${activo ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
