package com.sospuebla.demo.operadores;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sospuebla.demo.alertas.service.ApiException;
import com.sospuebla.demo.auth.AuthService;
import com.sospuebla.demo.auth.UsuarioRepository;
import com.sospuebla.demo.core.Municipios;

@Service
public class OperadorService {
  public static final List<String> ESTATUS = List.of("pendiente", "aprobado", "rechazado", "suspendido");

  public record RegistroRequest(String nombre, String correo, String telefono, String cargo,
                                String municipio, String password) {}

  private final OperadorRepo repo;
  private final AuthService auth;
  private final UsuarioRepository usuarios;

  public OperadorService(OperadorRepo repo, AuthService auth, UsuarioRepository usuarios) {
    this.repo = repo;
    this.auth = auth;
    this.usuarios = usuarios;
  }

  /** Solicitud pública: crea la cuenta INACTIVA hasta que el administrador estatal la apruebe. */
  @Transactional
  public Operador solicitar(RegistroRequest r) {
    if (blanco(r.nombre()) || blanco(r.correo()) || blanco(r.password()) || blanco(r.municipio()))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Nombre, correo, municipio y contraseña son obligatorios");
    if (r.password().length() < 8)
      throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 8 caracteres");
    String municipio = municipioValido(r.municipio());
    String correo = r.correo().trim().toLowerCase();
    if (auth.existe(correo)) throw new ApiException(HttpStatus.CONFLICT, "El correo ya está registrado");

    var u = auth.crearUsuario(correo, r.nombre().trim(), r.password(), "operador", null);
    u.activo = false;
    usuarios.save(u);

    var o = new Operador();
    o.usuarioId = u.id;
    o.nombre = r.nombre().trim();
    o.correo = correo;
    o.telefono = r.telefono();
    o.cargo = r.cargo();
    o.municipio = municipio;
    o.estatus = "pendiente";
    return repo.save(o);
  }

  public List<Operador> listar() {
    return repo.findAllByOrderByEstatusAscMunicipioAscNombreAsc();
  }

  /** Aprobar activa la cuenta; rechazar o suspender la desactiva. */
  @Transactional
  public Operador cambiarEstatus(Long id, String estatus) {
    if (!ESTATUS.contains(estatus)) throw new ApiException(HttpStatus.BAD_REQUEST, "Estatus inválido");
    var o = repo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Operador no encontrado"));
    o.estatus = estatus;
    usuarios.findById(o.usuarioId).ifPresent(u -> {
      u.activo = "aprobado".equals(estatus);
      usuarios.save(u);
    });
    return repo.save(o);
  }

  public String municipioDe(Long usuarioId) {
    return repo.findByUsuarioId(usuarioId).map(o -> o.municipio).orElse(null);
  }

  public String estatusDe(Long usuarioId) {
    return repo.findByUsuarioId(usuarioId).map(o -> o.estatus).orElse(null);
  }

  /** Sólo municipios del catálogo (así el alcance coincide con los datos del mapa). */
  public static String municipioValido(String m) {
    return Municipios.LISTA.stream()
        .map(Municipios.Municipio::nombre)
        .filter(n -> com.sospuebla.demo.auth.Alcance.mismo(n, m))
        .findFirst()
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Municipio no reconocido: " + m));
  }

  private static boolean blanco(String s) {
    return s == null || s.isBlank();
  }
}
