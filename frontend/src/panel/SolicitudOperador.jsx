import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiPanel } from "../api/client";
import { MUNICIPIOS_CATALOGO } from "../data/localidades";

const claseInput =
  "w-full px-3 py-2.5 text-sm md:text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-guinda";
const claseEtiqueta = "block text-xs font-semibold text-gray-700 mb-1";

/**
 * Solicitud de acceso de un operador municipal. La cuenta queda pendiente hasta que
 * el administrador estatal la aprueba en la pestaña "Operadores".
 */
export default function SolicitudOperador({ onVolver }) {
  const [form, setForm] = useState({
    nombre: "",
    cargo: "",
    municipio: "",
    telefono: "",
    correo: "",
    password: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviada, setEnviada] = useState(null);
  const campo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const r = await apiPanel.solicitarAcceso({ ...form, correo: form.correo.trim() });
      setEnviada(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (enviada) {
    return (
      <div className="space-y-4 text-center py-2">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
        <div>
          <p className="text-sm font-bold text-gray-900">Solicitud enviada</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Tu acceso como operador de <strong>{enviada.municipio}</strong> quedó pendiente. El administrador
            estatal debe aprobarlo; después podrás ingresar con tu correo y contraseña.
          </p>
        </div>
        <button onClick={onVolver} className="w-full bg-guinda text-white font-bold py-3 rounded-xl text-xs">
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <button
        type="button"
        onClick={onVolver}
        className="flex items-center gap-1.5 text-xs font-bold text-guinda hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
      </button>
      <div>
        <h2 className="text-sm font-bold text-gray-900">Solicitar acceso de operador municipal</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Para autoridades municipales de Protección Civil. Administrarás refugios, centros de acopio, zonas de
          riesgo y puntos de encuentro de tu municipio.
        </p>
      </div>

      <div>
        <label className={claseEtiqueta}>Nombre completo</label>
        <input required className={claseInput} value={form.nombre} onChange={campo("nombre")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={claseEtiqueta}>Municipio</label>
          <select required className={claseInput} value={form.municipio} onChange={campo("municipio")}>
            <option value="">Elige…</option>
            {MUNICIPIOS_CATALOGO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={claseEtiqueta}>Teléfono</label>
          <input type="tel" className={claseInput} value={form.telefono} onChange={campo("telefono")} />
        </div>
      </div>
      <div>
        <label className={claseEtiqueta}>Cargo</label>
        <input
          className={claseInput}
          value={form.cargo}
          onChange={campo("cargo")}
          placeholder="Ej. Director de Protección Civil municipal"
        />
      </div>
      <div>
        <label className={claseEtiqueta}>Correo institucional</label>
        <input required type="email" className={claseInput} value={form.correo} onChange={campo("correo")} />
      </div>
      <div>
        <label className={claseEtiqueta}>Contraseña (mínimo 8 caracteres)</label>
        <input
          required
          minLength={8}
          type="password"
          autoComplete="new-password"
          className={claseInput}
          value={form.password}
          onChange={campo("password")}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg px-3 py-2">{error}</div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-guinda hover:bg-guindaDark disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-xs transition"
      >
        {enviando ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
