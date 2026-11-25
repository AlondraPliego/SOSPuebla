import { useState } from "react";
import { X, UserRound, HeartHandshake, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import { api, ROLES_APP, ROLES_PANEL } from "../api/client";
import { MUNICIPIOS, CONDICIONES_VULNERABLES } from "../api/mapeos";

export const claseInput =
  "w-full px-3 py-2.5 text-sm md:text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-guinda focus:ring-2 focus:ring-guinda/10";
export const claseEtiqueta = "block text-xs font-semibold text-gray-700 mb-1";

/** Inicia sesión en la app y completa el nombre desde el perfil correspondiente. */
export async function iniciarSesionApp(identificador, password) {
  const r = await api.login(identificador, password);
  if (ROLES_PANEL.includes(r.rol)) {
    throw new Error("Las cuentas de Protección Civil ingresan desde el Panel Web (/panel).");
  }
  if (!ROLES_APP.includes(r.rol)) throw new Error("Esta cuenta no tiene acceso a la app.");
  return r;
}

const ROL_TEXTO = { ciudadano: "Ciudadano", voluntario: "Voluntario" };

/**
 * Hoja "Mi cuenta": único punto de inicio de sesión/registro de la app.
 * Detecta el rol (ciudadano o voluntario) y la app muestra las funciones que le tocan.
 */
export default function MiCuenta({ sesion, onSesion, onCerrar, onRegistroVoluntario, onIr }) {
  const [modo, setModo] = useState("login"); // login | registro
  const [ident, setIdent] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    correo: "",
    telefono: "",
    municipio: "Puebla",
    colonia: "",
    condicion_vulnerable: "",
    contacto_nombre: "",
    contacto_telefono: "",
  });
  const campo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const completarNombre = async (r) => {
    // la sesión se guarda primero para que las consultas del perfil lleven el token
    onSesion(r);
    try {
      if (r.rol === "voluntario" && r.voluntario_id != null) {
        const v = await api.voluntario(r.voluntario_id);
        onSesion({ ...r, nombre: [v.nombre, v.apellidos].filter(Boolean).join(" ") });
      } else {
        const c = await api.ciudadanoMe();
        onSesion({ ...r, nombre: [c.nombre, c.apellidos].filter(Boolean).join(" ") });
      }
    } catch {
      /* sin nombre: se muestra "Mi cuenta" */
    }
  };

  const entrar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const r = await iniciarSesionApp(ident.trim(), password);
      await completarNombre(r);
      setPassword("");
      onCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const registrarCiudadano = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    const muni = MUNICIPIOS.find((m) => m.nombre === form.municipio) || MUNICIPIOS[0];
    try {
      await api.registrarCiudadano({
        ...form,
        correo: form.correo.trim(),
        condicion_vulnerable: form.condicion_vulnerable || null,
        password,
        lat: muni.lat,
        lng: muni.lng,
      });
      const r = await iniciarSesionApp(form.correo.trim(), password);
      await completarNombre(r);
      setPassword("");
      onCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const aviso = error && (
    <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl px-3 py-2">{error}</div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onClick={onCerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-subir bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-guinda font-bold text-sm">
            <UserRound className="w-5 h-5" />
            <span>Mi cuenta</span>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-fondo">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {sesion ? (
            <>
              <div className="bg-guinda text-white rounded-2xl p-4 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-gray-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Sesión activa · {ROL_TEXTO[sesion.rol] || sesion.rol}
                  </p>
                  <p className="text-base font-bold truncate">{sesion.nombre || "Mi cuenta"}</p>
                </div>
              </div>

              <div className="space-y-2">
                {sesion.rol === "voluntario" && (
                  <button onClick={() => onIr("voluntarios")} className="w-full flex items-center justify-between bg-fondo hover:bg-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 transition">
                    <span className="flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-guinda" /> Mi gafete y brigadas</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <button onClick={() => onIr("comunidad")} className="w-full flex items-center justify-between bg-fondo hover:bg-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 transition">
                  <span className="flex items-center gap-2"><UserRound className="w-4 h-4 text-guinda" /> {sesion.rol === "ciudadano" ? "Mis datos de emergencia y SOS" : "Mis SOS y comunidad"}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <button
                onClick={() => {
                  onSesion(null);
                  onCerrar();
                }}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:text-red-700 hover:border-red-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1 bg-fondo p-1 rounded-xl">
                {[
                  ["login", "Iniciar sesión"],
                  ["registro", "Crear cuenta"],
                ].map(([m, t]) => (
                  <button
                    key={m}
                    onClick={() => {
                      setModo(m);
                      setError("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      modo === m ? "bg-white text-guinda shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {modo === "login" ? (
                <form onSubmit={entrar} className="space-y-3">
                  <div>
                    <label className={claseEtiqueta}>Correo electrónico o CURP</label>
                    <input required autoComplete="username" className={claseInput} value={ident} onChange={(e) => setIdent(e.target.value)} placeholder="tu@correo.com" />
                  </div>
                  <div>
                    <label className={claseEtiqueta}>Contraseña</label>
                    <input required type="password" autoComplete="current-password" className={claseInput} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <p className="text-[11px] text-gray-500">Ciudadanos y voluntarios entran aquí; la app se ajusta a tu tipo de cuenta.</p>
                  {aviso}
                  <button type="submit" disabled={cargando} className="w-full bg-guinda hover:bg-guindaDark disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-sm md:text-xs transition">
                    {cargando ? "Verificando..." : "Entrar"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={onRegistroVoluntario}
                    className="w-full flex items-center gap-3 border border-gray-200 hover:border-guinda rounded-2xl p-3.5 text-left transition"
                  >
                    <HeartHandshake className="w-6 h-6 text-guinda shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Quiero ser voluntario</p>
                      <p className="text-[11px] text-gray-500">Brigadas, gafete digital y alertas para apoyar en emergencias.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="flex-1 h-px bg-gray-200" /> o crea tu cuenta ciudadana <span className="flex-1 h-px bg-gray-200" />
                  </div>

                  <form onSubmit={registrarCiudadano} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={claseEtiqueta}>Nombre(s)</label>
                        <input required className={claseInput} value={form.nombre} onChange={campo("nombre")} />
                      </div>
                      <div>
                        <label className={claseEtiqueta}>Apellidos</label>
                        <input className={claseInput} value={form.apellidos} onChange={campo("apellidos")} />
                      </div>
                    </div>
                    <div>
                      <label className={claseEtiqueta}>Correo electrónico</label>
                      <input required type="email" autoComplete="email" className={claseInput} value={form.correo} onChange={campo("correo")} />
                    </div>
                    <div>
                      <label className={claseEtiqueta}>Contraseña (mínimo 6)</label>
                      <input required minLength={6} type="password" autoComplete="new-password" className={claseInput} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={claseEtiqueta}>Teléfono</label>
                        <input type="tel" className={claseInput} value={form.telefono} onChange={campo("telefono")} />
                      </div>
                      <div>
                        <label className={claseEtiqueta}>Municipio</label>
                        <select className={claseInput} value={form.municipio} onChange={campo("municipio")}>
                          {MUNICIPIOS.map((m) => (
                            <option key={m.nombre} value={m.nombre}>{m.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={claseEtiqueta}>Colonia</label>
                      <input className={claseInput} value={form.colonia} onChange={campo("colonia")} />
                    </div>
                    <div>
                      <label className={claseEtiqueta}>¿Alguna condición de vulnerabilidad?</label>
                      <select className={claseInput} value={form.condicion_vulnerable} onChange={campo("condicion_vulnerable")}>
                        {Object.entries(CONDICIONES_VULNERABLES).map(([v, t]) => (
                          <option key={v} value={v}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={claseEtiqueta}>Contacto de emergencia</label>
                        <input className={claseInput} value={form.contacto_nombre} onChange={campo("contacto_nombre")} placeholder="Nombre" />
                      </div>
                      <div>
                        <label className={claseEtiqueta}>Su teléfono</label>
                        <input type="tel" className={claseInput} value={form.contacto_telefono} onChange={campo("contacto_telefono")} placeholder="10 dígitos" />
                      </div>
                    </div>
                    {aviso}
                    <button type="submit" disabled={cargando} className="w-full bg-guinda hover:bg-guindaDark disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-sm md:text-xs transition">
                      {cargando ? "Creando cuenta..." : "Crear cuenta ciudadana"}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
