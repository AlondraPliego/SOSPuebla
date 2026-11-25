// Catálogo de municipios y localidades (colonias, barrios, juntas auxiliares) con coordenadas
// aproximadas del centro de cada una. Sirve para:
//   - agrupar refugios, centros de acopio y zonas de riesgo por "Municipio · Localidad"
//   - ubicar a la persona: su GPS -> localidad más cercana
// Para la versión final conviene cargarlo del Marco Geoestadístico del INEGI.

export const LOCALIDADES = [
  // Puebla (capital)
  { municipio: "Puebla", localidad: "Centro Histórico", lat: 19.0436, lng: -98.1981 },
  { municipio: "Puebla", localidad: "Barrio de Analco", lat: 19.0402, lng: -98.1912 },
  { municipio: "Puebla", localidad: "Barrio de San Francisco", lat: 19.0458, lng: -98.1874 },
  { municipio: "Puebla", localidad: "Barrio de Xonaca", lat: 19.0545, lng: -98.1752 },
  { municipio: "Puebla", localidad: "Zona de los Fuertes", lat: 19.0575, lng: -98.1820 },
  { municipio: "Puebla", localidad: "San Felipe Hueyotlipan", lat: 19.0780, lng: -98.2215 },
  { municipio: "Puebla", localidad: "La Paz", lat: 19.0580, lng: -98.2205 },
  { municipio: "Puebla", localidad: "San Baltazar Campeche", lat: 19.0210, lng: -98.2060 },
  { municipio: "Puebla", localidad: "Reserva Atlixcáyotl", lat: 19.0215, lng: -98.2420 },
  // Zona metropolitana
  { municipio: "San Pedro Cholula", localidad: "Centro", lat: 19.0630, lng: -98.3060 },
  { municipio: "San Pedro Cholula", localidad: "San Cristóbal Tepontla", lat: 19.0790, lng: -98.3230 },
  { municipio: "San Andrés Cholula", localidad: "Centro", lat: 19.0540, lng: -98.2970 },
  { municipio: "San Andrés Cholula", localidad: "Tlaxcalancingo", lat: 19.0330, lng: -98.2800 },
  { municipio: "San Andrés Cholula", localidad: "Lomas de Angelópolis", lat: 19.0040, lng: -98.2600 },
  { municipio: "Cuautlancingo", localidad: "Centro", lat: 19.0950, lng: -98.2580 },
  { municipio: "Amozoc", localidad: "Centro", lat: 19.0310, lng: -98.0490 },
  // Faldas del Popocatépetl
  { municipio: "San Nicolás de los Ranchos", localidad: "Centro", lat: 19.0670, lng: -98.4950 },
  { municipio: "San Nicolás de los Ranchos", localidad: "Santiago Xalitzintla", lat: 19.0830, lng: -98.5170 },
  { municipio: "Atlixco", localidad: "Centro", lat: 18.9080, lng: -98.4330 },
  { municipio: "Atlixco", localidad: "Metepec", lat: 18.9350, lng: -98.4620 },
  // Interior del estado
  { municipio: "Huauchinango", localidad: "Centro", lat: 20.1760, lng: -98.0530 },
  { municipio: "Huauchinango", localidad: "El Paraíso", lat: 20.1725, lng: -98.0570 },
  { municipio: "Izúcar de Matamoros", localidad: "Centro", lat: 18.6010, lng: -98.4660 },
  { municipio: "Tehuacán", localidad: "Centro", lat: 18.4620, lng: -97.3930 },
];

/** Nombres que se usan en los datos y que significan el mismo municipio. */
export function normalizarMunicipio(m) {
  if (!m) return "";
  return m === "Puebla Capital" ? "Puebla" : m;
}

/** Texto sin acentos y en minúsculas, para buscar sin importar cómo se escriba. */
export const plano = (t) =>
  (t || "").toString().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function distanciaKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Localidad más cercana a un punto; si se da municipio, sólo entre las de ese municipio. */
export function localidadMasCercana(punto, municipio) {
  const candidatas = municipio ? LOCALIDADES.filter((l) => l.municipio === municipio) : LOCALIDADES;
  let mejor = null;
  for (const l of candidatas.length ? candidatas : LOCALIDADES) {
    const d = distanciaKm(punto, l);
    if (!mejor || d < mejor.distanciaKm) mejor = { ...l, distanciaKm: d };
  }
  return mejor;
}

/**
 * Completa un lugar (refugio, centro, zona) con su municipio y localidad.
 * Respeta los que ya trae; si falta la localidad, toma la más cercana dentro de su municipio.
 */
export function ubicarLugar(item) {
  const municipio = normalizarMunicipio(item.municipio);
  if (item.localidad && municipio) return { ...item, municipio };
  const cercana =
    item.lat != null && item.lng != null ? localidadMasCercana(item, municipio || undefined) : null;
  return {
    ...item,
    municipio: municipio || cercana?.municipio || "Sin municipio",
    localidad: item.localidad || cercana?.localidad || "Sin localidad",
  };
}

export const MUNICIPIOS_CATALOGO = [...new Set(LOCALIDADES.map((l) => l.municipio))].sort((a, b) =>
  a.localeCompare(b, "es")
);
/** Coordenadas de referencia de un municipio (su "Centro" o su primera localidad). */
export function coordsMunicipio(municipio) {
  const ls = LOCALIDADES.filter((l) => l.municipio === municipio);
  const c = ls.find((l) => /^Centro/.test(l.localidad)) || ls[0] || LOCALIDADES[0];
  return { lat: c.lat, lng: c.lng };
}

export const localidadesDe = (municipio) =>
  LOCALIDADES.filter((l) => l.municipio === municipio).map((l) => l.localidad);

/** Filtro compartido por las tres pestañas: { busqueda, municipio, localidad } ("" = todos). */
export function aplicarFiltro(items, filtro, camposTexto = []) {
  const q = plano(filtro.busqueda).trim();
  return items.filter((it) => {
    if (filtro.municipio && it.municipio !== filtro.municipio) return false;
    if (filtro.localidad && it.localidad !== filtro.localidad) return false;
    if (!q) return true;
    return [it.nombre, it.municipio, it.localidad, it.direccion, ...camposTexto.map((c) => it[c])]
      .some((v) => plano(Array.isArray(v) ? v.join(" ") : v).includes(q));
  });
}
