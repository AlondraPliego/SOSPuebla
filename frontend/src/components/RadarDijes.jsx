import { useEffect, useRef, useState } from "react";
import { Radar, Lightbulb, LightbulbOff, Loader2, X, AlertTriangle } from "lucide-react";
import { ConexionDije, bluetoothDisponible, leerAlertaDije } from "../api/dije";

const MORSE_SOS = "··· − − − ···";

/**
 * Exclusivo de voluntarios: localiza dijes cercanos por Bluetooth y les pide que su LED
 * parpadee S-O-S en código morse para encontrar a la persona.
 * El selector del navegador funciona como "radar": sólo lista dijes dentro del alcance (~10-30 m).
 */
export default function RadarDijes() {
  const soporte = bluetoothDisponible();
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [localizados, setLocalizados] = useState([]); // [{ id, nombre, estado, senal, alerta }]
  const conexiones = useRef(new Map()); // id -> ConexionDije

  const actualizar = (id, cambios) =>
    setLocalizados((prev) => prev.map((d) => (d.id === id ? { ...d, ...cambios } : d)));

  // al salir de la pantalla se apagan las señales y se cierran las conexiones
  useEffect(() => {
    const mapa = conexiones.current;
    return () => {
      mapa.forEach((c) => {
        c.enviar("SOS_LUZ_OFF").catch(() => {});
        c.desconectar();
      });
    };
  }, []);

  const buscar = async () => {
    setError("");
    setBuscando(true);
    const c = new ConexionDije("rescate");
    try {
      const disp = await c.buscarYConectar();
      const id = disp.id;
      conexiones.current.get(id)?.desconectar();
      conexiones.current.set(id, c);
      c.onEstado((estado) => actualizar(id, { estado, ...(estado === "desconectado" ? { senal: false } : {}) }));
      // si la persona presiona su dije mientras el voluntario está conectado, se le avisa
      c.onMensaje((t) => {
        if (leerAlertaDije(t)) actualizar(id, { alerta: true });
      });
      setLocalizados((prev) => [
        { id, nombre: c.nombre, estado: "conectado", senal: false, alerta: false },
        ...prev.filter((d) => d.id !== id),
      ]);
      await c.enviar("SOS_LUZ");
      actualizar(id, { senal: true });
    } catch (e) {
      if (!/cancel/i.test(e.message)) setError(e.message);
    } finally {
      setBuscando(false);
    }
  };

  const senal = async (id, encender) => {
    setError("");
    const c = conexiones.current.get(id);
    try {
      if (!c?.conectado) await c?.conectarA(c.dispositivo);
      await c.enviar(encender ? "SOS_LUZ" : "SOS_LUZ_OFF");
      actualizar(id, { senal: encender });
    } catch (e) {
      setError(e.message);
    }
  };

  const quitar = (id) => {
    const c = conexiones.current.get(id);
    c?.enviar("SOS_LUZ_OFF").catch(() => {});
    setTimeout(() => c?.desconectar(), 300);
    conexiones.current.delete(id);
    setLocalizados((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-guinda text-white flex items-center justify-center shrink-0">
            <Radar className={`w-5 h-5 ${buscando ? "animate-spin" : ""}`} />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">Radar de dijes</p>
            <p className="text-[11px] text-gray-500 leading-snug">
              Localiza dijes cercanos y haz que su luz parpadee <strong>SOS</strong> en morse{" "}
              <span className="font-mono">({MORSE_SOS})</span> para ubicar a la persona.
            </p>
          </div>
        </div>
      </div>

      {soporte.ok ? (
        <button
          onClick={buscar}
          disabled={buscando}
          className="w-full flex items-center justify-center gap-2 bg-guinda hover:bg-guindaDark disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-xs transition"
        >
          {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
          {buscando ? "Buscando dijes cercanos..." : "Buscar dijes cercanos"}
        </button>
      ) : (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {soporte.motivo}
        </p>
      )}

      {error && <p className="text-[11px] text-red-700">{error}</p>}

      {localizados.length > 0 && (
        <div className="space-y-2">
          {localizados.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border p-3 space-y-2 ${
                d.alerta ? "border-red-300 bg-red-50" : d.senal ? "border-amber-300 bg-amber-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{d.nombre}</p>
                  <p className="text-[11px] text-gray-500">
                    {d.estado === "conectado"
                      ? d.senal
                        ? "Parpadeando SOS · busca la luz"
                        : "Conectado"
                      : d.estado === "conectando"
                      ? "Conectando..."
                      : "Fuera de alcance"}
                  </p>
                </div>
                <button onClick={() => quitar(d.id)} className="p-1 text-gray-400 hover:text-gray-700" title="Quitar">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {d.alerta && (
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-red-800">
                  <AlertTriangle className="w-3.5 h-3.5" /> Esta persona presionó su botón de pánico
                </p>
              )}
              <button
                onClick={() => senal(d.id, !d.senal)}
                className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition ${
                  d.senal ? "bg-white border border-gray-300 text-gray-800" : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                {d.senal ? <LightbulbOff className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                {d.senal ? "Detener señal SOS" : "Activar señal SOS"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
