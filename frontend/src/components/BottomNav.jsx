import { Home, Info, BookOpen, HeartHandshake, Users } from "lucide-react";

const items = [
  { id: "monitoreo", label: "Inicio", icon: Home },
  { id: "centros", label: "Centros", icon: Info },
  { id: "preparate", label: "Prepárate", icon: BookOpen },
  { id: "voluntarios", label: "Voluntarios", icon: HeartHandshake },
  { id: "comunidad", label: "Comunidad", icon: Users },
];

export default function BottomNav({ vistaActual, setVistaActual }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-white border-t border-gray-200 px-1 py-2 flex justify-around items-center pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const activo = vistaActual === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setVistaActual(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition ${
                activo ? "text-guinda font-semibold" : "text-gray-500 hover:text-gray-800"
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