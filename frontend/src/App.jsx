import { useState } from "react";
import { X, Radio, CheckCircle2, BellRing, Monitor } from "lucide-react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import AlertaEntrante from "./components/AlertaEntrante";
import Monitoreo from "./pages/Monitoreo";
import Centros from "./pages/Centros";
import Preparate from "./pages/Preparate";
import Voluntarios from "./pages/Voluntarios";
import Comunidad from "./pages/Comunidad";
import PanelSecretaria from "./pages/PanelSecretaria";

const alertaDemoPuebla = {
  id: 901,
  tipo: "Sismo",
  titulo: "ALERTA DE SISMO",
  severidad: "critica",
  estadoIncidente: "Activa",
  zona: "Puebla Centro, Col. Centro Histórico",
  puntoEncuentro: "Zócalo de Puebla · Módulo PC",
  lat: 19.0436,
  lng: -98.1981,
  distancia: "2.4 km",
  hora: "Hace 1 min",
  instrucciones:
    "Mantén la calma. Si estás en zona de riesgo, resguárdate y evacúa al terminar el movimiento. Se requiere apoyo de brigadistas cercanos.",
  categoriasRequeridas: ["Primeros auxilios", "Evacuación", "Comunicación", "Brigadista"],
  voluntariosConfirmados: 18,
};

export default function App() {
  const [modo, setModo] = useState("movil");
  const [vistaActual, setVistaActual] = useState("monitoreo");
  const [modalSOS, setModalSOS] = useState(false);
  const [alertaEnviada, setAlertaEnviada] = useState(false);
  const [alertaActiva, setAlertaActiva] = useState(null);

  if (modo === "secretaria") {
    return (
      <PanelSecretaria
        onVolverMovil={() => setModo("movil")}
        onEmitirAlerta={(nuevaAlerta) => {
          setAlertaActiva(nuevaAlerta);
          setModo("movil");
        }}
      />
    );
  }

  const activarDije = () => {
    setAlertaEnviada(true);
    setTimeout(() => {
      setAlertaEnviada(false);
      setModalSOS(false);
    }, 2500);
  };

  const renderVista = () => {
    switch (vistaActual) {
      case "monitoreo":
        return <Monitoreo />;
      case "centros":
        return <Centros />;
      case "preparate":
        return <Preparate />;
      case "voluntarios":
        return <Voluntarios />;
      case "comunidad":
        return <Comunidad />;
      default:
        return <Monitoreo />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-fondo flex flex-col shadow-xl relative">
        <div className="bg-black text-gray-300 text-[10px] px-2.5 py-1.5 flex items-center justify-between gap-1.5">
          <button
            onClick={() => setModo("secretaria")}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white font-bold px-2 py-0.5 rounded shrink-0 transition"
          >
            <Monitor className="w-3 h-3" />
            <span>Panel Web</span>
          </button>

          <span className="truncate text-center">Prototipo · Alertas simuladas</span>

          <button
            onClick={() => setAlertaActiva(alertaDemoPuebla)}
            className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white font-bold px-2 py-0.5 rounded shrink-0 transition"
          >
            <BellRing className="w-3 h-3" />
            <span>Simular</span>
          </button>
        </div>

        <Header vistaActual={vistaActual} onOpenSOS={() => setModalSOS(true)} />

        <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
          {renderVista()}
        </main>

        <BottomNav vistaActual={vistaActual} setVistaActual={setVistaActual} />

        {alertaActiva && (
          <AlertaEntrante
            alerta={alertaActiva}
            onCerrar={() => setAlertaActiva(null)}
          />
        )}

        {modalSOS && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <Radio className="w-5 h-5" />
                  <span>Alerta de Emergencia / Dije</span>
                </div>
                <button
                  onClick={() => setModalSOS(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {alertaEnviada ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                  <p className="font-bold text-gray-900 text-sm">
                    Alerta enviada a Protección Civil y grupo familiar
                  </p>
                  <p className="text-xs text-gray-500">
                    Ubicación GPS compartida (Puebla, Pue.)
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Envía tu ubicación actual a tus contactos cercanos y al sistema estatal de emergencias. También vinculable con el dije físico para personas vulnerables.
                  </p>
                  <button
                    onClick={activarDije}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl text-sm transition"
                  >
                    Emitir Alerta Ahora
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}