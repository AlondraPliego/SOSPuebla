package com.sospuebla.demo.core;

import java.util.List;
import com.sospuebla.demo.alertas.service.AsignacionService;

/**
 * Municipios cubiertos y su centro aproximado. Sirve para asignar un municipio a lo que llega
 * sólo con coordenadas (p. ej. un SOS anónimo con GPS) y así enrutarlo al operador municipal.
 * Debe coincidir con el catálogo del frontend (src/data/localidades.js).
 */
public final class Municipios {
  private Municipios() {}

  public record Municipio(String nombre, double lat, double lng) {}

  public static final List<Municipio> LISTA = List.of(
      new Municipio("Puebla", 19.0436, -98.1981),
      new Municipio("San Pedro Cholula", 19.0630, -98.3060),
      new Municipio("San Andrés Cholula", 19.0540, -98.2970),
      new Municipio("Cuautlancingo", 19.0950, -98.2580),
      new Municipio("Amozoc", 19.0310, -98.0490),
      new Municipio("San Nicolás de los Ranchos", 19.0670, -98.4950),
      new Municipio("Atlixco", 18.9080, -98.4330),
      new Municipio("Huauchinango", 20.1760, -98.0530),
      new Municipio("Izúcar de Matamoros", 18.6010, -98.4660),
      new Municipio("Tehuacán", 18.4620, -97.3930));

  public static String masCercano(double lat, double lng) {
    Municipio mejor = LISTA.get(0);
    double dMejor = Double.MAX_VALUE;
    for (Municipio m : LISTA) {
      double d = AsignacionService.haversine(lat, lng, m.lat(), m.lng());
      if (d < dMejor) {
        dMejor = d;
        mejor = m;
      }
    }
    return mejor.nombre();
  }
}
