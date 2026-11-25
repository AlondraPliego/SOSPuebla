import { useState } from "react";
import { MapPin, Package } from "lucide-react";
import Refugios from "./Refugios";
import Acopio from "./Acopio";

export default function Centros() {
  const [subVista, setSubVista] = useState("refugios");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSubVista("refugios")}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
            subVista === "refugios"
              ? "bg-guinda text-white border-guinda"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Refugios</span>
        </button>

        <button
          onClick={() => setSubVista("acopio")}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
            subVista === "acopio"
              ? "bg-guinda text-white border-guinda"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Centros de Acopio</span>
        </button>
      </div>

      {subVista === "refugios" ? <Refugios /> : <Acopio />}
    </div>
  );
}