package com.sospuebla.demo.ciudadanos;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** DTOs del módulo de ciudadanos (JSON en snake_case por la configuración global). */
public final class CiudadanoDtos {
  private CiudadanoDtos() {}

  public record RegistroRequest(
      @NotBlank String nombre,
      String apellidos,
      String telefono,
      @NotBlank @Email String correo,
      @NotBlank @Size(min = 6) String password,
      String municipio,
      String colonia,
      Double lat,
      Double lng,
      String condicionVulnerable,
      String contactoNombre,
      String contactoTelefono) {}

  public record ActualizarRequest(
      String nombre,
      String apellidos,
      String telefono,
      String municipio,
      String colonia,
      Double lat,
      Double lng,
      String condicionVulnerable,
      String contactoNombre,
      String contactoTelefono) {}

  public record CiudadanoDto(
      Long id, Long usuarioId, String nombre, String apellidos, String telefono, String correo,
      String municipio, String colonia, Double lat, Double lng, String condicionVulnerable,
      String contactoNombre, String contactoTelefono, LocalDateTime creadoEn) {

    public static CiudadanoDto de(Ciudadano c) {
      return new CiudadanoDto(c.id, c.usuarioId, c.nombre, c.apellidos, c.telefono, c.correo,
          c.municipio, c.colonia, c.lat, c.lng, c.condicionVulnerable,
          c.contactoNombre, c.contactoTelefono, c.creadoEn);
    }
  }
}
