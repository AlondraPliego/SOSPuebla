// Alcance territorial en el panel (el backend lo valida igual; esto sólo decide qué botones mostrar).
//  - admin: autoridad estatal, administra todo el estado
//  - operador: autoridad municipal, administra su municipio y ve el resto en solo lectura

const normal = (m) =>
  (m || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/^puebla capital$/, "puebla");

export const mismoMunicipio = (a, b) => normal(a) === normal(b);

export const esAdmin = (sesion) => sesion?.rol === "admin";

/** ¿Puede crear/editar/borrar/atender algo de ese municipio? */
export const puedeAdministrar = (sesion, municipio) =>
  esAdmin(sesion) || (sesion?.rol === "operador" && !!sesion.municipio && mismoMunicipio(sesion.municipio, municipio));

export const etiquetaRol = (sesion) =>
  esAdmin(sesion)
    ? "Administrador estatal"
    : sesion?.municipio
    ? `Operador municipal · ${sesion.municipio}`
    : "Operador municipal";
