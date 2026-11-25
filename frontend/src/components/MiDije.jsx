import { useEffect, useState } from "react";
import { Bluetooth, BluetoothOff, Vibrate, Lightbulb, Loader2 } from "lucide-react";
import { miDije, bluetoothDisponible } from "../api/dije";

/**
 * Vincula el dije de la persona con este teléfono por Bluetooth.
 * La lógica de las alertas (SOS del dije y aviso de sismo al dije) vive en App, así sigue
 * funcionando aunque se cambie de pestaña.
 */
export default function MiDije() {
  const [estado, setEstado] = useState(miDije.estado);
  const [error, setError] = useState("");
  const [luz, setLuz] = useState(false);
  const soporte = bluetoothDisponible();

  useEffect(() => miDije.onEstado(setEstado), []);

  const conectar = async () => {
    setError("");
    try {
      await miDije.buscarYConectar();
    } catch (e) {
      // cerrar el selector sin elegir no es un error para el usuario
      if (!/cancel/i.test(e.message)) setError(e.message);
    }
  };

  const mandar = async (cmd) => {
    setError("");
    try {
      await miDije.enviar(cmd);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              estado === "conectado" ? "bg-green-50 text-green-700" : "bg-fondo text-guinda"
            }`}
          >
            {estado === "conectado" ? <Bluetooth className="w-5 h-5" /> : <BluetoothOff className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Mi dije seguro</p>
            <p className="text-[11px] text-gray-500 truncate">
              {estado === "conectado"
                ? `${miDije.nombre} conectado · el botón o un grito envían SOS`
                : estado === "conectando"
                ? "Conectando..."
                : "Botón de pánico portátil vinculado por Bluetooth"}
            </p>
          </div>
        </div>
        {estado === "conectado" ? (
          <button
            onClick={() => miDije.desconectar()}
            className="text-[11px] font-bold text-gray-500 hover:text-red-700 shrink-0"
          >
            Desvincular
          </button>
        ) : (
          <button
            onClick={conectar}
            disabled={!soporte.ok || estado === "conectando"}
            className="flex items-center gap-1.5 bg-guinda hover:bg-guindaDark disabled:bg-gray-300 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0 transition"
          >
            {estado === "conectando" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Vincular
          </button>
        )}
      </div>

      {!soporte.ok && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {soporte.motivo}
        </p>
      )}

      {estado === "conectado" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => mandar("VIBRAR")}
              className="flex items-center justify-center gap-1.5 bg-fondo hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2.5 rounded-xl transition"
            >
              <Vibrate className="w-4 h-4" /> Probar vibración
            </button>
            <button
              onClick={() => {
                mandar(luz ? "LED_OFF" : "LED_ON");
                setLuz(!luz);
              }}
              className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl transition ${
                luz ? "bg-amber-100 text-amber-900" : "bg-fondo hover:bg-gray-200 text-gray-800"
              }`}
            >
              <Lightbulb className="w-4 h-4" /> {luz ? "Apagar luz" : "Encender luz"}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Mantén esta página abierta: si presionas el botón del dije 1 segundo (o detecta un grito) se envía
            un SOS con tu ubicación a Protección Civil. Si llega una alerta de sismo, el dije vibrará.
          </p>
        </>
      )}

      {error && <p className="text-[11px] text-red-700">{error}</p>}
    </section>
  );
}
