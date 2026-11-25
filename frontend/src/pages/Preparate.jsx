import { useState } from "react";
import { CheckSquare, Square, ShieldAlert, PackageCheck, WifiOff } from "lucide-react";

const itemsMochila = [
  "Agua embotellada (2 litros por persona)",
  "Alimentos no perecederos y abrelatas",
  "Documentos oficiales en bolsa hermética (INE, actas, CURP)",
  "Botiquín básico y medicamentos recetados",
  "Cubrebocas KN95 y lentes protectores (ceniza volcánica)",
  "Linterna con pilas de repuesto y radio portátil",
  "Copia de llaves de casa y dinero en efectivo",
  "Silbato de emergencia y ropa abrigadora",
];

const protocolos = [
  {
    titulo: "Caída de Ceniza (Popocatépetl)",
    pasos: [
      "Cubre nariz y boca con cubrebocas o pañuelo húmedo.",
      "Cierra puertas, ventanas y tapa tinacos o depósitos de agua.",
      "Barre la ceniza en seco y deposítala en bolsas; nunca la arrojes al drenaje.",
    ],
  },
  {
    titulo: "Inundaciones y Deslaves",
    pasos: [
      "No intentes cruzar ríos, arroyos ni calles con corriente de agua.",
      "Desconecta la energía eléctrica y cierra llaves de gas antes de evacuar.",
      "Dirígete al refugio temporal más cercano en zona alta.",
    ],
  },
  {
    titulo: "Sismo",
    pasos: [
      "Aléjate de ventanas, cables y objetos que puedan caer.",
      "Ubícate en zonas de menor riesgo y evacúa al terminar el movimiento.",
      "Usa mensajes de texto o la sección Comunidad para reportarte a salvo.",
    ],
  },
];

export default function Preparate() {
  const [tab, setTab] = useState("mochila");
  const [marcados, setMarcados] = useState([0, 2]);

  const toggleItem = (idx) => {
    setMarcados((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const progreso = Math.round((marcados.length / itemsMochila.length) * 100);

  return (
    <div className="space-y-4 md:max-w-3xl md:mx-auto">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-600">
        <WifiOff className="w-4 h-4 text-guinda shrink-0" />
        <span>Guías guardadas para consulta sin conexión en zonas rurales y urbanas.</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setTab("mochila")}
          className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
            tab === "mochila"
              ? "bg-guinda text-white border-guinda"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          Mochila
        </button>
        <button
          onClick={() => setTab("protocolos")}
          className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
            tab === "protocolos"
              ? "bg-guinda text-white border-guinda"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          Qué Hacer
        </button>
        <button
          onClick={() => setTab("acopiar")}
          className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
            tab === "acopiar"
              ? "bg-guinda text-white border-guinda"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          Cómo Acopiar
        </button>
      </div>

      {tab === "mochila" && (
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Mochila de Emergencia</h2>
            <span className="text-xs font-bold text-guinda">{progreso}% lista</span>
          </div>

          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-guinda transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>

          <div className="space-y-2 pt-1">
            {itemsMochila.map((item, idx) => {
              const listo = marcados.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleItem(idx)}
                  className="w-full flex items-start gap-2.5 text-left p-2 rounded-lg hover:bg-fondo transition"
                >
                  {listo ? (
                    <CheckSquare className="w-4 h-4 text-guinda shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs ${
                      listo ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {tab === "protocolos" && (
        <section className="space-y-3">
          {protocolos.map((proto) => (
            <div
              key={proto.titulo}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-guinda" />
                <h3 className="text-sm font-bold text-gray-900">{proto.titulo}</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-4">
                {proto.pasos.map((paso, i) => (
                  <li key={i}>{paso}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {tab === "acopiar" && (
        <section className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-guinda" />
              <h3 className="text-sm font-bold text-gray-900">Cómo preparar tu donación</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-4">
              <li>Revisa que los alimentos tengan al menos 6 meses de caducidad.</li>
              <li>Marca con plumón permanente los paquetes con la palabra <strong>DONACIÓN</strong>.</li>
              <li>Separa artículos de higiene y limpieza de los alimentos para evitar contaminación.</li>
              <li>Entrega ropa únicamente limpia, en buen estado y clasificada (niño/adulto).</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-red-800">Qué NO llevar al acopio</h3>
            <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-4">
              <li>Medicamentos caducados o cajas ya abiertas.</li>
              <li>Alimentos perecederos o envases de vidrio frágiles.</li>
              <li>Ropa rota, sucia o calzado sin par.</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}