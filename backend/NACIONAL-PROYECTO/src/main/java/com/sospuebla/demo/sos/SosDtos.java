package com.sospuebla.demo.sos;

import java.time.LocalDateTime;
import com.sospuebla.demo.ciudadanos.Ciudadano;

public final class SosDtos {
  private SosDtos() {}

  /** Todos opcionales: si hay sesión de ciudadano se completan nombre/teléfono con su perfil. */
  public record SosRequest(
      String tipo, String mensaje, Double lat, Double lng, String municipio,
      String nombre, String telefono, String origen) {}

  public record EstadoRequest(String estado, String nota) {}

  public record SosDto(
      Long id, Long ciudadanoId, String nombre, String telefono,
      Double lat, Double lng, String municipio, String tipo, String mensaje, String origen,
      String estado, String nota, Long atendidoPor,
      String condicionVulnerable, String contactoNombre, String contactoTelefono,
      LocalDateTime creadoEn, LocalDateTime actualizadoEn) {

    public static SosDto de(SosReporte s, Ciudadano c) {
      return new SosDto(s.id, s.ciudadanoId, s.nombre, s.telefono, s.lat, s.lng, s.municipio,
          s.tipo, s.mensaje, s.origen, s.estado, s.nota, s.atendidoPor,
          c == null ? null : c.condicionVulnerable,
          c == null ? null : c.contactoNombre,
          c == null ? null : c.contactoTelefono,
          s.creadoEn, s.actualizadoEn);
    }
  }
}
