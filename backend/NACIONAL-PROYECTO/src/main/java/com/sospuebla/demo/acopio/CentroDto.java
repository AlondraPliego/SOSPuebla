package com.sospuebla.demo.acopio;

import java.util.List;

public record CentroDto(
    Long id, String nombre, String direccion, String municipio,
    Double lat, Double lng, String horario, String telefono,
    String responsable, boolean abierto, List<NecesidadDto> necesidades) {

  public record NecesidadDto(Long id, String item, String prioridad) {}

  public static CentroDto de(CentroAcopio c) {
    var nec = c.necesidades.stream()
        .map(n -> new NecesidadDto(n.id, n.item, n.prioridad)).toList();
    return new CentroDto(c.id, c.nombre, c.direccion, c.municipio, c.lat, c.lng,
        c.horario, c.telefono, c.responsable, c.abierto, nec);
  }
}