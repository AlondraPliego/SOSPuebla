package com.sospuebla.demo.auth;

import java.util.Optional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UsuarioRepository usuarios;
  private final RolRepository roles;
  private final BCryptPasswordEncoder enc = new BCryptPasswordEncoder();

  public AuthService(UsuarioRepository usuarios, RolRepository roles) {
    this.usuarios = usuarios;
    this.roles = roles;
  }

  @Transactional
  public Usuario crearUsuario(String username, String nombre, String password,
                              String rol, Long voluntarioId) {
    var u = new Usuario();
    u.username = username;
    u.nombre = nombre;
    u.voluntarioId = voluntarioId;
    u.passwordHash = enc.encode(password);
    u.roles.add(roles.findByNombre(rol.toUpperCase()).orElseThrow(
        () -> new IllegalStateException("Falta el rol " + rol + " en la tabla roles")));
    return usuarios.save(u);
  }

  public boolean existe(String username) {
    return usuarios.findByUsername(username).isPresent();
  }

  /** Acepta correo (username) o CURP. Devuelve null si las credenciales son incorrectas. */
  public Usuario validar(String identificador, String password) {
    String id = identificador == null ? "" : identificador.trim();
    if (id.isEmpty() || password == null) return null;
    Optional<Usuario> u = usuarios.findByUsername(id.toLowerCase());
    if (u.isEmpty()) u = usuarios.findByCurpDeVoluntario(id.toUpperCase());
    return u.filter(x -> x.activo && enc.matches(password, x.passwordHash)).orElse(null);
  }
}