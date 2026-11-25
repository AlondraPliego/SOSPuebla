// Traducciones entre los valores del backend y los textos que muestra la interfaz.

// Valores válidos según los enums del backend (TipoAlerta / SeveridadAlerta).
export const TIPOS_ALERTA = [
  { valor: "sismo", etiqueta: "Sismo" },
  { valor: "incendio", etiqueta: "Incendio" },
  { valor: "inundacion", etiqueta: "Inundación / lluvias" },
  { valor: "huracan", etiqueta: "Huracán" },
];

export const SEVERIDADES = [
  { valor: "critica", etiqueta: "Crítica (Rojo)" },
  { valor: "alta", etiqueta: "Alta (Naranja)" },
  { valor: "moderada", etiqueta: "Moderada (Ámbar)" },
  { valor: "preventiva", etiqueta: "Preventiva (Amarillo)" },
];

export const ESTADOS_ALERTA = {
  pendiente: "Pendiente de autorizar",
  activa: "Activa",
  en_atencion: "En atención",
  cerrada: "Cerrada",
};

export const FUENTES_ALERTA = {
  manual: "Manual",
  simulador: "Simulador",
  nasa_eonet: "NASA EONET",
};

export const CATEGORIAS = {
  primeros_auxilios: "Primeros auxilios",
  busqueda_rescate: "Búsqueda y rescate",
  logistica_acopio: "Logística / acopio",
  traslado: "Traslado",
  apoyo_psicologico: "Apoyo psicológico",
  cocina: "Cocina",
  medico_enfermeria: "Médico / enfermería",
  comunicaciones: "Comunicaciones",
  traduccion: "Traducción",
  otro: "Otro",
};

// Valores válidos del módulo SOS (SosService.TIPOS / ESTADOS en el backend)
export const TIPOS_SOS = [
  { valor: "emergencia_medica", etiqueta: "Emergencia médica" },
  { valor: "atrapado", etiqueta: "Estoy atrapado" },
  { valor: "incendio", etiqueta: "Incendio" },
  { valor: "inundacion", etiqueta: "Inundación" },
  { valor: "derrumbe", etiqueta: "Derrumbe" },
  { valor: "violencia", etiqueta: "Violencia" },
  { valor: "otro", etiqueta: "Otro" },
];
export const ESTADOS_SOS = {
  activo: "Recibido · en espera",
  en_atencion: "En atención",
  atendido: "Atendido",
  cancelado: "Cancelado",
};
export const CONDICIONES_VULNERABLES = {
  "": "Ninguna",
  adulto_mayor: "Adulto mayor",
  discapacidad: "Persona con discapacidad",
  embarazo: "Embarazo",
  enfermedad_cronica: "Enfermedad crónica",
  menor_a_cargo: "Menores a cargo",
};
export const etiquetaTipoSos = (t) => TIPOS_SOS.find((x) => x.valor === t)?.etiqueta || t;

export const PRIORIDADES = {
  urgente: "Urgente",
  normal: "Normal",
  suficiente: "Suficiente",
};

// Municipios con coordenadas para ubicar alertas emitidas desde el panel.
export const MUNICIPIOS = [
  { nombre: "Puebla", lat: 19.0414, lng: -98.2063 },
  { nombre: "San Pedro Cholula", lat: 19.0636, lng: -98.3059 },
  { nombre: "San Andrés Cholula", lat: 19.054, lng: -98.297 },
  { nombre: "Cuautlancingo", lat: 19.095, lng: -98.258 },
  { nombre: "Amozoc", lat: 19.031, lng: -98.049 },
  { nombre: "Atlixco", lat: 18.9005, lng: -98.4326 },
  { nombre: "Tehuacán", lat: 18.4618, lng: -97.3927 },
  { nombre: "Huauchinango", lat: 20.1767, lng: -98.0528 },
  { nombre: "Izúcar de Matamoros", lat: 18.6, lng: -98.4667 },
];

export const etiquetaTipo = (t) => TIPOS_ALERTA.find((x) => x.valor === t)?.etiqueta || t || "Alerta";
export const etiquetaCategoria = (c) => CATEGORIAS[c] || c;
export const etiquetaEstatusVoluntario = (e) =>
  e === "aprobado" ? "Activo" : e === "rechazado" ? "Rechazado" : "Pendiente";

export function haceCuanto(fechaIso) {
  if (!fechaIso) return "";
  const t = new Date(fechaIso).getTime();
  if (Number.isNaN(t)) return "";
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "Justo ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  return new Date(t).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

const CONFIRMADOS = ["confirmo", "en_camino", "en_zona"];

/**
 * Qué hacer según el tipo de alerta (protocolos de Protección Civil / CENAPRED).
 * La app los muestra al recibir la alerta, además del mensaje del operador.
 */
export const INSTRUCCIONES_ALERTA = {
  sismo: {
    titulo: "Durante el sismo",
    pasos: [
      "Mantén la calma y aléjate de ventanas, espejos y objetos que puedan caer.",
      "Si no puedes salir rápido: agáchate, cúbrete la cabeza y sujétate junto a un mueble firme.",
      "No uses elevadores ni escaleras mientras tiembla.",
      "Al terminar, sal con calma al punto de reunión y no regreses hasta que lo indique Protección Civil.",
      "Revisa si hay olor a gas o cables dañados; no enciendas cerillos.",
    ],
  },
  incendio: {
    titulo: "Ante un incendio",
    pasos: [
      "Aléjate del fuego y del humo; avisa a quien esté cerca.",
      "Si hay humo, avanza agachado y cubre nariz y boca con un trapo húmedo.",
      "Antes de abrir una puerta, tócala: si está caliente, no la abras.",
      "No regreses por pertenencias. Llama al 911 cuando estés a salvo.",
    ],
  },
  inundacion: {
    titulo: "Ante una inundación",
    pasos: [
      "Sube a la parte más alta de tu casa o a un refugio cercano.",
      "Desconecta la luz y cierra el gas si puedes hacerlo sin riesgo.",
      "No cruces calles ni ríos con corriente: 15 cm de agua pueden derribarte.",
      "No toques cables ni postes caídos y evita el agua estancada.",
    ],
  },
  huracan: {
    titulo: "Ante un huracán",
    pasos: [
      "Permanece en un lugar resistente, lejos de ventanas; si te lo indican, ve a un refugio.",
      "Ten a la mano tu mochila de emergencia, agua y documentos.",
      "Desconecta aparatos eléctricos y no salgas durante la calma del ojo del huracán.",
      "Sigue sólo la información oficial de Protección Civil.",
    ],
  },
  _general: {
    titulo: "Qué hacer ahora",
    pasos: [
      "Mantén la calma y aléjate de la zona de riesgo.",
      "Sigue las indicaciones de Protección Civil y de los brigadistas.",
      "Ten tu teléfono con batería y llama al 911 si necesitas ayuda.",
    ],
  },
};
export const instruccionesDe = (tipo) => INSTRUCCIONES_ALERTA[tipo] || INSTRUCCIONES_ALERTA._general;

/**
 * Alerta para quien no tiene sesión: con la seguridad activa, el detalle
 * (GET /alertas/{id}) exige token, así que se muestra con lo que trae el aviso del WebSocket.
 */
export function alertaGenerica(p) {
  const id = p.alertaId ?? p.alerta_id;
  return {
    id,
    tipo: "Protección Civil Puebla",
    titulo: "ALERTA DE EMERGENCIA",
    severidad: "critica",
    estadoIncidente: ESTADOS_ALERTA[p.estado] || "Activa",
    zona: "Estado de Puebla",
    puntoEncuentro: "Sigue las indicaciones de Protección Civil",
    lat: 19.0414,
    lng: -98.2063,
    distancia: "tu zona",
    hora: "Justo ahora",
    instrucciones:
      p.mensaje ||
      "Protección Civil emitió una alerta activa. Mantén la calma y sigue las indicaciones oficiales. Inicia sesión como voluntario para ver el detalle y confirmar tu apoyo.",
    categoriasRequeridas: [],
    tipoClave: null,
    voluntariosConfirmados: 0,
    voluntarioNotificado: false,
    miEstado: null,
  };
}

/**
 * Convierte un AlertaDetalle del backend al formato que usa la pantalla AlertaEntrante.
 * @param {object} a  AlertaDetalle (snake_case)
 * @param {number|null} voluntarioId  voluntario con sesión en la app móvil (si hay)
 */
export function alertaParaApp(a, voluntarioId = null, punto = null) {
  const notificados = a.voluntarios_notificados || [];
  const mio = voluntarioId != null ? notificados.find((v) => v.voluntario_id === voluntarioId) : null;
  const tipo = etiquetaTipo(a.tipo);
  return {
    id: a.id,
    tipo,
    titulo: `ALERTA DE ${tipo.split(" ")[0].toUpperCase()}`,
    severidad: a.severidad,
    estadoIncidente: ESTADOS_ALERTA[a.estado] || a.estado,
    zona: a.municipio,
    // punto de encuentro designado por Protección Civil más cercano a la alerta (si hay)
    puntoEncuentro: punto?.nombre || `Módulo PC · ${a.municipio}`,
    puntoDireccion: punto ? [punto.localidad, punto.direccion].filter(Boolean).join(" · ") : null,
    puntoIndicaciones: punto?.indicaciones || null,
    puntoLat: punto?.lat ?? null,
    puntoLng: punto?.lng ?? null,
    lat: a.lat,
    lng: a.lng,
    distancia: mio?.distancia_km != null ? `${mio.distancia_km.toFixed(1)} km` : `radio ${a.radio_km} km`,
    hora: haceCuanto(a.creada_en),
    instrucciones: a.mensaje || "Mantén la calma y sigue las indicaciones de Protección Civil.",
    categoriasRequeridas: [],
    tipoClave: a.tipo,
    voluntariosConfirmados: notificados.filter((v) => CONFIRMADOS.includes(v.estado)).length,
    // datos extra para la integración
    voluntarioNotificado: !!mio,
    miEstado: mio?.estado || null,
  };
}
