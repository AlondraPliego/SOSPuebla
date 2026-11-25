package com.sospuebla.demo.territorio;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Datos de demostración del territorio (antes estaban fijos en el frontend).
 * Ubicaciones y radios aproximados: los operadores los ajustan desde el Centro de Mando.
 */
@Component
public class DatosTerritorio implements CommandLineRunner {
  private final RefugioRepo refugios;
  private final ZonaRiesgoRepo zonas;
  private final PuntoEncuentroRepo puntos;

  public DatosTerritorio(RefugioRepo refugios, ZonaRiesgoRepo zonas, PuntoEncuentroRepo puntos) {
    this.refugios = refugios;
    this.zonas = zonas;
    this.puntos = puntos;
  }

  @Override
  public void run(String... args) {
    if (refugios.count() == 0) cargarRefugios();
    if (zonas.count() == 0) cargarZonas();
    if (puntos.count() == 0) cargarPuntos();
  }

  private void cargarRefugios() {
    refugio("Dormitorio Municipal de Puebla", "Puebla", "Centro Histórico",
        "Calle 16 Oriente #207, Centro Histórico", 19.0468, -98.1916, 200, 58, "activo", false, "222 232 3400");
    refugio("Palacio Auxiliar San Felipe Hueyotlipan", "Puebla", "San Felipe Hueyotlipan",
        "Calle Cuauhtémoc s/n, San Felipe Hueyotlipan", 19.0764, -98.2215, 180, 45, "activo", true, "222 288 1120");
    refugio("Polideportivo Xonaca", "Puebla", "Barrio de Xonaca",
        "Av. 42 Norte y Calle 22 Oriente, Barrio de Xonaca", 19.0542, -98.1748, 250, 30, "disponible", true, "222 235 8810");
    refugio("Centro Escolar Niños Héroes de Chapultepec", "Puebla", "Barrio de Analco",
        "Av. 10 Sur #1501, Barrio de Analco", 19.0357, -98.1932, 400, 85, "activo", false, "222 243 2200");
    refugio("Auditorio Municipal de San Pedro Cholula", "San Pedro Cholula", "Centro",
        "Av. Morelos #204, Centro", 19.0615, -98.3054, 220, 40, "disponible", true, "222 247 0095");
    refugio("Recinto Ferial de Huauchinango", "Huauchinango", "El Paraíso",
        "Av. del Ferrocarril, Col. El Paraíso", 20.1736, -98.0549, 500, 120, "activo", true, "776 762 0234");
    refugio("Centro Escolar Pdte. Lázaro Cárdenas", "Izúcar de Matamoros", "Centro",
        "Carretera Internacional a Oaxaca km 65", 18.6012, -98.4648, 300, 60, "disponible", false, "243 436 0180");
  }

  private void cargarZonas() {
    zona("Zona de mayor peligro del Popocatépetl", "volcanico", "alto", "San Nicolás de los Ranchos",
        "Santiago Xalitzintla", 19.083, -98.517, 4000,
        "Comunidad en las faldas del volcán: posible caída de ceniza, fragmentos y flujos de lodo (lahares) en barrancas.",
        "Conoce tu ruta de evacuación y el punto de reunión de tu comunidad.\n"
            + "Ten lista la mochila de emergencia y documentos en bolsa plástica.\n"
            + "Aléjate de barrancas y cauces cuando llueva con caída de ceniza.");
    zona("Caída de ceniza volcánica", "volcanico", "medio", "Atlixco", "Centro", 18.908, -98.433, 3000,
        "Zona expuesta a caída de ceniza cuando el viento sopla hacia el sureste del volcán.",
        "Usa cubrebocas y lentes; cubre tinacos y cisternas.\n"
            + "Barre la ceniza de los techos para evitar que se sobrecarguen.\n"
            + "No la tires al drenaje: guárdala en bolsas.");
    zona("Márgenes del río Atoyac", "inundacion", "alto", "Puebla", "San Baltazar Campeche",
        19.025, -98.215, 1200,
        "Zona baja junto al cauce del río; puede inundarse con lluvias intensas o crecidas.",
        "Ante lluvia fuerte, sube a un nivel alto y aléjate del cauce.\n"
            + "No cruces calles con corriente de agua.\n"
            + "Desconecta la luz si el agua entra a tu casa.");
    zona("Encharcamientos en el bulevar 5 de Mayo", "inundacion", "medio", "Puebla", "Barrio de San Francisco",
        19.047, -98.189, 600,
        "El bulevar corre sobre el antiguo cauce del río San Francisco y se encharca con tormentas.",
        "Evita los pasos a desnivel durante la tormenta.\n"
            + "No estaciones tu auto en las zonas bajas del bulevar.");
    zona("Laderas inestables de la Sierra Norte", "deslave", "alto", "Huauchinango", "El Paraíso",
        20.178, -98.06, 2500,
        "Pendientes con riesgo de deslave en temporada de lluvias.",
        "Vigila grietas en muros y suelo, o árboles inclinados.\n"
            + "Si escuchas crujidos o ves lodo bajando, evacúa de inmediato.\n"
            + "Ubica el refugio más cercano antes de la temporada de lluvias.");
    zona("Inmuebles antiguos vulnerables a sismo", "sismo", "medio", "Izúcar de Matamoros", "Centro",
        18.601, -98.466, 1500,
        "Construcciones de adobe y templos antiguos; varias resultaron dañadas en el sismo de 2017.",
        "Identifica las zonas seguras de tu casa y tu trabajo.\n"
            + "Revisa grietas después de cada sismo y repórtalas.");
  }

  private void cargarPuntos() {
    punto("Zócalo de Puebla · Módulo de Protección Civil", "Puebla", "Centro Histórico",
        "Zócalo, frente a Catedral", 19.0436, -98.1981,
        "Preséntate en la carpa de Protección Civil con tu gafete digital; ahí se forman las brigadas.");
    punto("Polideportivo Xonaca · acceso principal", "Puebla", "Barrio de Xonaca",
        "Av. 42 Norte y Calle 22 Oriente", 19.0542, -98.1748,
        "Punto de reunión del oriente de la ciudad. Busca al coordinador de chaleco naranja.");
    punto("Explanada del Complejo Cultural Universitario", "Puebla", "Reserva Atlixcáyotl",
        "Vía Atlixcáyotl #2299", 19.0206, -98.2401,
        "Punto de reunión del sur de la ciudad, junto al estacionamiento principal.");
    punto("Zócalo de San Pedro Cholula", "San Pedro Cholula", "Centro",
        "Portal Guerrero, Centro", 19.0630, -98.3060,
        "Reúnete frente a la presidencia municipal.");
    punto("Presidencia auxiliar de Tlaxcalancingo", "San Andrés Cholula", "Tlaxcalancingo",
        "Centro de Tlaxcalancingo", 19.0330, -98.2800,
        "Reúnete en la explanada de la presidencia auxiliar.");
    punto("Presidencia municipal de San Nicolás de los Ranchos", "San Nicolás de los Ranchos", "Centro",
        "Centro de San Nicolás de los Ranchos", 19.0670, -98.4950,
        "Punto de reunión para apoyar la evacuación de las comunidades del volcán.");
    punto("Zócalo de Atlixco", "Atlixco", "Centro", "Plaza de Armas, Centro", 18.9080, -98.4330,
        "Reúnete junto al kiosco; Protección Civil Atlixco coordina las brigadas.");
    punto("Jardín Central de Huauchinango", "Huauchinango", "Centro", "Centro de Huauchinango", 20.1760, -98.0530,
        "Reúnete frente a la presidencia municipal; lleva botas y lámpara en temporada de lluvias.");
    punto("Zócalo de Izúcar de Matamoros", "Izúcar de Matamoros", "Centro", "Centro de Izúcar", 18.6010, -98.4660,
        "Reúnete frente a la presidencia municipal.");
    punto("Parque Juárez de Tehuacán", "Tehuacán", "Centro", "Centro de Tehuacán", 18.4620, -97.3930,
        "Reúnete en el kiosco del parque.");
  }

  private void refugio(String nombre, String municipio, String localidad, String direccion, double lat, double lng,
                       int capacidad, int ocupados, String estado, boolean mascotas, String telefono) {
    var r = new Refugio();
    r.nombre = nombre;
    r.municipio = municipio;
    r.localidad = localidad;
    r.direccion = direccion;
    r.lat = lat;
    r.lng = lng;
    r.capacidad = capacidad;
    r.ocupados = ocupados;
    r.estado = estado;
    r.mascotas = mascotas;
    r.telefono = telefono;
    refugios.save(r);
  }

  private void zona(String nombre, String tipo, String nivel, String municipio, String localidad, double lat,
                    double lng, int radioM, String descripcion, String recomendaciones) {
    var z = new ZonaRiesgo();
    z.nombre = nombre;
    z.tipo = tipo;
    z.nivel = nivel;
    z.municipio = municipio;
    z.localidad = localidad;
    z.lat = lat;
    z.lng = lng;
    z.radioM = radioM;
    z.descripcion = descripcion;
    z.recomendaciones = recomendaciones;
    zonas.save(z);
  }

  private void punto(String nombre, String municipio, String localidad, String direccion, double lat, double lng,
                     String indicaciones) {
    var p = new PuntoEncuentro();
    p.nombre = nombre;
    p.municipio = municipio;
    p.localidad = localidad;
    p.direccion = direccion;
    p.lat = lat;
    p.lng = lng;
    p.indicaciones = indicaciones;
    p.responsable = "Protección Civil " + municipio;
    puntos.save(p);
  }
}
