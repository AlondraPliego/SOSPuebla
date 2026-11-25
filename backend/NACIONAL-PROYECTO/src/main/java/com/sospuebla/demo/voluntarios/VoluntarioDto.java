package com.sospuebla.demo.voluntarios;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record VoluntarioDto(
    Long id, String nombre, String apellidos, String correo, String telefono,
    LocalDate fechaNacimiento, boolean extranjero, String curp,
    String tipoDocumento, String numeroDocumento, String paisOrigen,
    String municipio, String colonia, Double lat, Double lng,
    boolean ubicacionSegundoPlano, List<String> categorias, String experiencia,
    String disponibilidad, boolean tieneVehiculo, boolean disponible,
    String estatusAprobacion, LocalDateTime ultimaParticipacion, LocalDateTime creadoEn) {

  public static VoluntarioDto de(VoluntarioPerfil v) {
    return new VoluntarioDto(v.id, v.nombre, v.apellidos, v.correo, v.telefono,
        v.fechaNacimiento, v.extranjero, v.curp, v.tipoDocumento, v.numeroDocumento,
        v.paisOrigen, v.municipio, v.colonia, v.lat, v.lng, v.ubicacionSegundoPlano,
        v.listaCategorias(), v.experiencia, v.disponibilidad, v.tieneVehiculo,
        v.disponible, v.estatusAprobacion, v.ultimaParticipacion, v.creadoEn);
  }
}