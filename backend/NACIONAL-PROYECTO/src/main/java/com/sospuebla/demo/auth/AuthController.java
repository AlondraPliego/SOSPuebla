package com.sospuebla.demo.auth;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private static final List<String> PRIORIDAD = List.of("admin", "operador", "voluntario", "ciudadano");
  private final AuthService svc;
  private final JwtService jwt;

  public AuthController(AuthService svc, JwtService jwt) {
    this.svc = svc;
    this.jwt = jwt;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
    String ident = body.getOrDefault("usuario", body.get("correo"));
    var u = svc.validar(ident, body.get("password"));
    if (u == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(Map.of("status", 401, "mensaje", "Credenciales incorrectas"));
    }
    var nombres = u.roles.stream().map(r -> r.nombre.toLowerCase()).toList();
    String rol = PRIORIDAD.stream().filter(nombres::contains).findFirst().orElse("ciudadano");

    var r = new LinkedHashMap<String, Object>();
    r.put("token", jwt.crear(u, rol));
    r.put("rol", rol);
    r.put("usuario_id", u.id);
    r.put("voluntario_id", u.voluntarioId);
    return ResponseEntity.ok(r);
  }

  /** Devuelve quién es el dueño del token (el front lo usa al recargar la página). */
  @GetMapping("/me")
  public Map<String, Object> me(HttpServletRequest req) {
    var id = (JwtService.Identidad) req.getAttribute(SeguridadInterceptor.ATRIBUTO);
    var r = new LinkedHashMap<String, Object>();
    r.put("usuario_id", id.usuarioId());
    r.put("rol", id.rol());
    r.put("voluntario_id", id.voluntarioId());
    return r;
  }
}