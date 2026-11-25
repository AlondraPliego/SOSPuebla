// Catálogos de las zonas de riesgo. Las zonas se administran desde el Centro de Mando (backend:
// /zonas-riesgo); los datos iniciales son de referencia y conviene validarlos con el Atlas de Riesgos
// del Estado de Puebla / Atlas Nacional de Riesgos (CENAPRED).

export const TIPOS_RIESGO = {
  volcanico: { etiqueta: "Volcánico" },
  inundacion: { etiqueta: "Inundación" },
  deslave: { etiqueta: "Deslave" },
  sismo: { etiqueta: "Sismo" },
  incendio: { etiqueta: "Incendio" },
};

export const NIVELES_RIESGO = {
  alto: { etiqueta: "Riesgo alto", color: "#b91c1c", fondo: "bg-red-50 text-red-800 border-red-200" },
  medio: { etiqueta: "Riesgo medio", color: "#d97706", fondo: "bg-amber-50 text-amber-800 border-amber-200" },
  bajo: { etiqueta: "Riesgo bajo", color: "#ca8a04", fondo: "bg-yellow-50 text-yellow-800 border-yellow-200" },
};

/** Zona tal como llega del backend -> formato de la app (radio en metros, recomendaciones en lista). */
export const zonaDesdeApi = (z) => ({
  ...z,
  radioM: z.radio_m,
  recomendaciones: (z.recomendaciones || "").split("\n").map((r) => r.trim()).filter(Boolean),
  color: NIVELES_RIESGO[z.nivel]?.color || NIVELES_RIESGO.medio.color,
  tipoTexto: TIPOS_RIESGO[z.tipo]?.etiqueta || z.tipo,
});

const ESTADOS_REFUGIO = { activo: "Activo", disponible: "Disponible", lleno: "Lleno", cerrado: "Cerrado" };
/** Refugio del backend -> formato de las tarjetas de la app. */
export const refugioDesdeApi = (r) => ({
  ...r,
  capacidadTotal: r.capacidad || 0,
  ocupados: r.ocupados || 0,
  estadoClave: r.estado,
  estado: ESTADOS_REFUGIO[r.estado] || r.estado,
  telefono: r.telefono || "",
});
