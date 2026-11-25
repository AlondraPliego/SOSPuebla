package com.sospuebla.demo.auth;

import com.sospuebla.demo.operadores.OperadorService;
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
  private final OperadorService operadores;

  public AuthController(AuthService svc, JwtService jwt, OperadorService operadores) {
    this.svc = svc;
    this.jwt = jwt;
    this.operadores = operadores;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
    String ident = body.getOrDefault("usuario", body.get("correo"));
    var u = svc.validar(ident, body.get("password"));
    if (u == null) {
      var inactiva = svc.validarInactiva(ident, body.get("password"));
      if (inactiva != null) {
        String estatus = operadores.estatusDe(inactiva.id);
        String msg = "pendiente".equals(estatus)
            ? "Tu solicitud de operador municipal está pendiente de aprobación por el administrador estatal"
            : "Tu cuenta está desactivada. Contacta al administrador estatal";
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", 403, "mensaje", msg));
      }
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(Map.of("status", 401, "mensaje", "Credenciales incorrectas"));
    }
    var nombres = u.roles.stream().map(r -> r.nombre.toLowerCase()).toList();
    String rol = PRIORIDAD.stream().filter(nombres::contains).findFirst().orElse("ciudadano");

    // el operador municipal lleva su municipio en el token: define qué puede administrar
    String municipio = "operador".equals(rol) ? operadores.municipioDe(u.id) : null;

    var r = new LinkedHashMap<String, Object>();
    r.put("token", jwt.crear(u, rol, municipio));
    r.put("rol", rol);
    r.put("usuario_id", u.id);
    r.put("voluntario_id", u.voluntarioId);
    r.put("municipio", municipio);
    r.put("nombre", u.nombre);
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
    r.put("municipio", id.municipio());
    return r;
  }
}