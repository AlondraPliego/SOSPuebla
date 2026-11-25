package com.sospuebla.demo.voluntarios;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sospuebla.demo.alertas.service.ApiException;
import com.sospuebla.demo.auth.AuthService;
import com.sospuebla.demo.core.Catalogos;

@Service
public class VoluntarioService {
  private static final Pattern CURP =
      Pattern.compile("^[A-Z]{4}\\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\\d$");
  // La tabla exige lat/lng; si no mandan ubicación se usa el centro de Puebla
  private static final double LAT_DEFECTO = 19.0414;
  private static final double LNG_DEFECTO = -98.2063;

  private final VoluntarioPerfilRepo repo;
  private final AuthService auth;

  public VoluntarioService(VoluntarioPerfilRepo repo, AuthService auth) {
    this.repo = repo;
    this.auth = auth;
  }

   @Transactional
  public VoluntarioPerfil registrar(RegistroRequest r) {
    String correo = r.correo().trim().toLowerCase();
    if (repo.existsByCorreo(correo))
      throw new ApiException(HttpStatus.CONFLICT, "El correo ya está registrado");
    validarCategorias(r.categorias());

    var v = new VoluntarioPerfil();
    v.nombre = r.nombre().trim();
    v.apellidos = r.apellidos().trim();
    v.fechaNacimiento = r.fechaNacimiento();
    v.telefono = r.telefono();
    v.correo = correo;
    v.extranjero = Boolean.TRUE.equals(r.extranjero());

    if (v.extranjero) {
      if (r.numeroDocumento() == null || r.numeroDocumento().isBlank())
        throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el número de documento");
      v.tipoDocumento = r.tipoDocumento();
      v.numeroDocumento = r.numeroDocumento().trim();
      v.paisOrigen = r.paisOrigen();
    } else {
      String curp = r.curp() == null ? "" : r.curp().trim().toUpperCase();
      if (!CURP.matcher(curp).matches())
        throw new ApiException(HttpStatus.BAD_REQUEST, "CURP con formato inválido");
      if (repo.existsByCurp(curp))
        throw new ApiException(HttpStatus.CONFLICT, "La CURP ya está registrada");
      v.curp = curp;
    }

    v.municipio = (r.municipio() == null || r.municipio().isBlank()) ? "Puebla" : r.municipio();
    v.colonia = r.colonia();
    v.lat = r.lat() != null ? r.lat() : LAT_DEFECTO;
    v.lng = r.lng() != null ? r.lng() : LNG_DEFECTO;
    v.ubicacionSegundoPlano = Boolean.TRUE.equals(r.ubicacionSegundoPlano());
    v.asignarCategorias(r.categorias());
    v.experiencia = r.experiencia();
    if (r.disponibilidad() != null) v.disponibilidad = validarDisponibilidad(r.disponibilidad());
    v.tieneVehiculo = Boolean.TRUE.equals(r.tieneVehiculo());

    v = repo.save(v);
    auth.crearUsuario(correo, v.nombre + " " + v.apellidos, r.password(), "voluntario", v.id);
    return v;
  }

  public List<VoluntarioPerfil> listar(String categoria, String municipio, Boolean extranjero,
                                       String estatus, Boolean disponible, String q) {
    String busca = q == null ? "" : q.trim().toLowerCase();
    return repo.findAllByOrderByNombreAsc().stream()
        .filter(v -> categoria == null || v.listaCategorias().contains(categoria))
        .filter(v -> municipio == null || municipio.equalsIgnoreCase(v.municipio))
        .filter(v -> extranjero == null || v.extranjero == extranjero)
        .filter(v -> estatus == null || estatus.equals(v.estatusAprobacion))
        .filter(v -> disponible == null || v.disponible == disponible)
        .filter(v -> busca.isEmpty() || contiene(busca, v))
        .toList();
  }

  public VoluntarioPerfil obtener(Long id) {
    return repo.findById(id).orElseThrow(
        () -> new ApiException(HttpStatus.NOT_FOUND, "Voluntario no encontrado"));
  }

  @Transactional
  public VoluntarioPerfil actualizar(Long id, ActualizarRequest r) {
    var v = obtener(id);
    if (r.nombre() != null) v.nombre = r.nombre();
    if (r.apellidos() != null) v.apellidos = r.apellidos();
    if (r.telefono() != null) v.telefono = r.telefono();
    if (r.municipio() != null) v.municipio = r.municipio();
    if (r.colonia() != null) v.colonia = r.colonia();
    if (r.experiencia() != null) v.experiencia = r.experiencia();
    if (r.categorias() != null && !r.categorias().isEmpty()) {
      validarCategorias(r.categorias());
      v.asignarCategorias(r.categorias());
    }
    if (r.disponibilidad() != null) v.disponibilidad = validarDisponibilidad(r.disponibilidad());
    if (r.tieneVehiculo() != null) v.tieneVehiculo = r.tieneVehiculo();
    return repo.save(v);
  }

  public VoluntarioPerfil cambiarAprobacion(Long id, String estatus) {
    if (estatus == null || !Catalogos.ESTATUS_APROBACION.contains(estatus))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Estatus inválido");
    var v = obtener(id);
    v.estatusAprobacion = estatus;
    return repo.save(v);
  }

  public VoluntarioPerfil actualizarUbicacion(Long id, Double lat, Double lng) {
    if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180)
      throw new ApiException(HttpStatus.BAD_REQUEST, "Coordenadas inválidas");
    var v = obtener(id);
    v.lat = lat;
    v.lng = lng;
    return repo.save(v);
  }

  public VoluntarioPerfil actualizarDisponibilidad(Long id, Boolean disponible, String disponibilidad) {
    var v = obtener(id);
    if (disponible != null) v.disponible = disponible;
    if (disponibilidad != null) v.disponibilidad = validarDisponibilidad(disponibilidad);
    return repo.save(v);
  }

  private boolean contiene(String busca, VoluntarioPerfil v) {
    return Stream.of(v.nombre, v.apellidos, v.correo, v.curp, v.numeroDocumento)
        .anyMatch(s -> s != null && s.toLowerCase().contains(busca));
  }

  private void validarCategorias(List<String> cats) {
    if (cats != null && !Catalogos.CATEGORIAS.containsAll(cats))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Categoría inválida");
  }

  private String validarDisponibilidad(String d) {
    if (!Catalogos.DISPONIBILIDADES.contains(d))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Disponibilidad inválida");
    return d;
  }
}