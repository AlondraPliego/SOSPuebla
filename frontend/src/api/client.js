// Cliente HTTP para el backend Spring Boot (SOS Puebla).
// El backend usa SNAKE_CASE en JSON (spring.jackson.property-naming-strategy),
// por eso todos los cuerpos que se envían y reciben usan claves snake_case.
//
// Hay DOS ámbitos separados, cada uno con su propia sesión y su propio token:
//   - api       -> app pública (ciudadano / voluntario). Ruta "/".
//   - apiPanel  -> Panel Web de Protección Civil (operador / admin). Ruta "/panel".
// Cada ámbito sólo expone las funciones de su rol; el backend además valida el token.

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

const CLAVE_SESION_PANEL = "sos.sesionPanel";
const CLAVE_SESION_APP = "sos.sesionApp";
const CLAVE_ULTIMO_SOS = "sos.ultimoSos";

export const ROLES_APP = ["ciudadano", "voluntario"];
export const ROLES_PANEL = ["operador", "admin"];

function leer(clave) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function guardar(clave, valor) {
  try {
    if (valor == null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento no disponible: la sesión sólo vive en memoria */
  }
}

/** Evento que se dispara cuando una sesión expira o el backend rechaza el token (401). */
export const EVENTO_SESION_EXPIRADA = "sos:sesion-expirada";

/** Devuelve el JWT si sigue vigente; null si expiró. */
function tokenVigente(s) {
  if (!s?.token) return null;
  try {
    const payload = JSON.parse(atob(s.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  } catch {
    /* token no decodificable: que el backend decida */
  }
  return s.token;
}

export const sesiones = {
  panel: () => leer(CLAVE_SESION_PANEL),
  guardarPanel: (s) => guardar(CLAVE_SESION_PANEL, s),
  /** Sesión de la app: { token, rol: "ciudadano"|"voluntario", usuario_id, voluntario_id, nombre } */
  app: () => leer(CLAVE_SESION_APP),
  guardarApp: (s) => guardar(CLAVE_SESION_APP, s),
  // último SOS enviado desde este dispositivo, para seguir su estado
  ultimoSos: () => leer(CLAVE_ULTIMO_SOS),
  guardarUltimoSos: (s) => guardar(CLAVE_ULTIMO_SOS, s),
};

const AMBITOS = {
  app: { leer: sesiones.app, guardar: sesiones.guardarApp },
  panel: { leer: sesiones.panel, guardar: sesiones.guardarPanel },
};

/** true si la app tiene una sesión vigente (necesaria para ver el detalle de alertas). */
export const haySesionApp = () => tokenVigente(sesiones.app()) != null;

export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

function expirar(ambito) {
  AMBITOS[ambito].guardar(null);
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA, { detail: { ambito } }));
}

async function request(ambito, metodo, ruta, cuerpo) {
  const sesion = AMBITOS[ambito].leer();
  if (sesion && !tokenVigente(sesion)) expirar(ambito);
  const token = tokenVigente(AMBITOS[ambito].leer());

  const headers = { Accept: "application/json" };
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  }

  const texto = await res.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = texto;
    }
  }

  if (res.status === 401 && token && ruta !== "/auth/login") expirar(ambito);

  if (!res.ok) {
    const mensaje = (datos && typeof datos === "object" && datos.mensaje) || `Error ${res.status}`;
    throw new ApiError(res.status, mensaje);
  }
  return datos;
}

const app = (m, r, c) => request("app", m, r, c);
const panel = (m, r, c) => request("panel", m, r, c);
const login = (ambito) => (identificador, password) =>
  request(ambito, "POST", "/auth/login", { usuario: identificador, password });

/** Funciones de la app pública (ciudadano / voluntario / visitante). */
export const api = {
  login: login("app"),

  // Alertas (lectura y confirmación del voluntario)
  alerta: (id) => app("GET", `/alertas/${id}`),
  confirmarAlerta: (id, voluntarioId, estado) =>
    app("POST", `/alertas/${id}/confirmar`, { voluntario_id: voluntarioId, estado }),

  // Voluntario
  registrarVoluntario: (datos) => app("POST", "/voluntarios", datos),
  voluntario: (id) => app("GET", `/voluntarios/${id}`),
  disponibilidadVoluntario: (id, disponible) =>
    app("PATCH", `/voluntarios/${id}/disponibilidad`, { disponible }),

  // Centros de acopio (lectura pública)
  centros: () => app("GET", "/centros-acopio"),

  // Ciudadano
  registrarCiudadano: (datos) => app("POST", "/ciudadanos", datos),
  ciudadanoMe: () => app("GET", "/ciudadanos/me"),
  actualizarCiudadano: (datos) => app("PUT", "/ciudadanos/me", datos),

  // SOS (público: sin sesión se envía anónimo)
  enviarSos: (datos) => app("POST", "/sos", datos),
  misSos: () => app("GET", "/sos/mios"),
  cancelarSos: (id) => app("POST", `/sos/${id}/cancelar`),
};

/** Funciones exclusivas del Panel Web (operador / admin). */
export const apiPanel = {
  login: login("panel"),

  alertas: (estado) => panel("GET", `/alertas${estado ? `?estado=${estado}` : ""}`),
  crearAlerta: (datos) => panel("POST", "/alertas", datos),
  cambiarEstadoAlerta: (id, estado) => panel("PATCH", `/alertas/${id}/estado`, { estado }),
  autorizarAlerta: (id) => panel("POST", `/alertas/${id}/autorizar`),
  bitacora: (id) => panel("GET", `/alertas/${id}/bitacora`),
  simularSismo: (datos = {}) => panel("POST", "/alertas/simular-sismo", datos),
  sincronizarNasa: (radioKm = 20) => panel("POST", `/alertas/fuentes/sincronizar?radioKm=${radioKm}`),

  voluntarios: () => panel("GET", "/voluntarios"),
  aprobarVoluntario: (id, estatus) => panel("PATCH", `/voluntarios/${id}/aprobacion`, { estatus }),

  centros: () => panel("GET", "/centros-acopio"),
  actualizarCentro: (id, datos) => panel("PUT", `/centros-acopio/${id}`, datos),

  listarSos: (estado) => panel("GET", `/sos${estado ? `?estado=${estado}` : ""}`),
  estadoSos: (id, estado, nota) => panel("PATCH", `/sos/${id}/estado`, { estado, nota }),

  resumen: () => panel("GET", "/reportes/resumen"),
};
