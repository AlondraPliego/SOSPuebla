package com.sospuebla.demo.ciudadanos;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sospuebla.demo.alertas.service.ApiException;
import com.sospuebla.demo.auth.AuthService;
import com.sospuebla.demo.auth.JwtService;
import com.sospuebla.demo.ciudadanos.CiudadanoDtos.ActualizarRequest;
import com.sospuebla.demo.ciudadanos.CiudadanoDtos.RegistroRequest;

@Service
public class CiudadanoService {
  private final CiudadanoRepo repo;
  private final AuthService auth;

  public CiudadanoService(CiudadanoRepo repo, AuthService auth) {
    this.repo = repo;
    this.auth = auth;
  }

  @Transactional
  public Ciudadano registrar(RegistroRequest r) {
    String correo = r.correo().trim().toLowerCase();
    if (repo.existsByCorreo(correo) || auth.existe(correo))
      throw new ApiException(HttpStatus.CONFLICT, "El correo ya está registrado");
    validarCoordenadas(r.lat(), r.lng());

    var c = new Ciudadano();
    c.nombre = r.nombre().trim();
    c.apellidos = r.apellidos() == null ? null : r.apellidos().trim();
    c.telefono = r.telefono();
    c.correo = correo;
    c.municipio = (r.municipio() == null || r.municipio().isBlank()) ? "Puebla" : r.municipio();
    c.colonia = r.colonia();
    c.lat = r.lat();
    c.lng = r.lng();
    c.condicionVulnerable = r.condicionVulnerable();
    c.contactoNombre = r.contactoNombre();
    c.contactoTelefono = r.contactoTelefono();

    String completo = c.apellidos == null || c.apellidos.isBlank() ? c.nombre : c.nombre + " " + c.apellidos;
    var u = auth.crearUsuario(correo, completo, r.password(), "ciudadano", null);
    c.usuarioId = u.id;
    return repo.save(c);
  }

  /** Perfil del ciudadano dueño del token. */
  public Ciudadano delUsuario(JwtService.Identidad id) {
    if (id == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Token requerido");
    return repo.findByUsuarioId(id.usuarioId()).orElseThrow(
        () -> new ApiException(HttpStatus.NOT_FOUND, "Esta cuenta no tiene perfil de ciudadano"));
  }

  @Transactional
  public Ciudadano actualizar(JwtService.Identidad id, ActualizarRequest r) {
    var c = delUsuario(id);
    validarCoordenadas(r.lat(), r.lng());
    if (r.nombre() != null && !r.nombre().isBlank()) c.nombre = r.nombre().trim();
    if (r.apellidos() != null) c.apellidos = r.apellidos().trim();
    if (r.telefono() != null) c.telefono = r.telefono();
    if (r.municipio() != null) c.municipio = r.municipio();
    if (r.colonia() != null) c.colonia = r.colonia();
    if (r.lat() != null && r.lng() != null) {
      c.lat = r.lat();
      c.lng = r.lng();
    }
    if (r.condicionVulnerable() != null) c.condicionVulnerable = r.condicionVulnerable();
    if (r.contactoNombre() != null) c.contactoNombre = r.contactoNombre();
    if (r.contactoTelefono() != null) c.contactoTelefono = r.contactoTelefono();
    return repo.save(c);
  }

  private void validarCoordenadas(Double lat, Double lng) {
    if ((lat == null) != (lng == null)
        || (lat != null && (lat < -90 || lat > 90 || lng < -180 || lng > 180)))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Coordenadas inválidas");
  }
}
