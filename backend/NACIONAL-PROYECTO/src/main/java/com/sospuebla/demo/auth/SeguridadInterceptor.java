package com.sospuebla.demo.auth;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.PathContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;
import com.sospuebla.demo.alertas.service.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class SeguridadInterceptor implements HandlerInterceptor {
  public static final String ATRIBUTO = "identidad";

  enum Acceso { PUBLICO, AUTENTICADO, STAFF, PROPIO_O_STAFF }

  private record Regla(String metodo, PathPattern patron, Acceso acceso) {}

  private static Regla regla(String metodo, String ruta, Acceso acceso) {
    return new Regla(metodo, PathPatternParser.defaultInstance.parse(ruta), acceso);
  }

  // Gana la PRIMERA regla que coincida. Lo que no aparezca aquí exige sesión.
  private static final List<Regla> REGLAS = List.of(
      regla("POST", "/auth/login", Acceso.PUBLICO),
      regla("POST", "/voluntarios", Acceso.PUBLICO),
      regla("GET", "/catalogos", Acceso.PUBLICO),
      regla("GET", "/centros-acopio", Acceso.PUBLICO),
      regla("GET", "/centros-acopio/{id}", Acceso.PUBLICO),
      // Módulo ciudadano y SOS
      regla("POST", "/ciudadanos", Acceso.PUBLICO),
      regla("POST", "/sos", Acceso.PUBLICO),
      regla("GET", "/ciudadanos/me", Acceso.AUTENTICADO),
      regla("PUT", "/ciudadanos/me", Acceso.AUTENTICADO),
      regla("GET", "/sos/mios", Acceso.AUTENTICADO),
      regla("POST", "/sos/{id}/cancelar", Acceso.AUTENTICADO),
      regla("GET", "/sos", Acceso.STAFF),
      regla("*", "/sos/**", Acceso.STAFF),

      regla("GET", "/auth/me", Acceso.AUTENTICADO),

      regla("GET", "/voluntarios", Acceso.STAFF),
      regla("PATCH", "/voluntarios/{id}/aprobacion", Acceso.STAFF),
      regla("GET", "/voluntarios/{id}", Acceso.PROPIO_O_STAFF),
      regla("PUT", "/voluntarios/{id}", Acceso.PROPIO_O_STAFF),
      regla("PATCH", "/voluntarios/{id}/ubicacion", Acceso.PROPIO_O_STAFF),
      regla("PATCH", "/voluntarios/{id}/disponibilidad", Acceso.PROPIO_O_STAFF),

      regla("*", "/centros-acopio/**", Acceso.STAFF),
      regla("*", "/reportes/**", Acceso.STAFF),

      regla("GET", "/alertas", Acceso.AUTENTICADO),
      regla("GET", "/alertas/{id}", Acceso.AUTENTICADO),
      regla("POST", "/alertas/{id}/confirmar", Acceso.AUTENTICADO),
      regla("*", "/alertas/**", Acceso.STAFF));

  private final JwtService jwt;
  private final boolean activa;

  public SeguridadInterceptor(JwtService jwt, @Value("${seguridad.activa:true}") boolean activa) {
    this.jwt = jwt;
    this.activa = activa;
  }

  @Override
  public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
    if (!activa || "OPTIONS".equals(req.getMethod())) return true;   // OPTIONS = preflight de CORS

    PathContainer ruta = PathContainer.parsePath(req.getRequestURI());
    Regla encontrada = null;
    for (Regla r : REGLAS) {
      boolean metodoOk = r.metodo().equals("*") || r.metodo().equals(req.getMethod());
      if (metodoOk && r.patron().matches(ruta)) {
        encontrada = r;
        break;
      }
    }
    Acceso acceso = encontrada == null ? Acceso.AUTENTICADO : encontrada.acceso();
    if (acceso == Acceso.PUBLICO) return true;

    JwtService.Identidad identidad = jwt.leer(extraerToken(req));
    req.setAttribute(ATRIBUTO, identidad);

    if (acceso == Acceso.STAFF && !identidad.esStaff()) throw prohibido();

    if (acceso == Acceso.PROPIO_O_STAFF && !identidad.esStaff()) {
      var info = encontrada.patron().matchAndExtract(ruta);
      String id = info == null ? null : info.getUriVariables().get("id");
      boolean esElMismo = identidad.voluntarioId() != null && id != null
          && id.equals(identidad.voluntarioId().toString());
      if (!esElMismo) throw prohibido();
    }
    return true;
  }

  private String extraerToken(HttpServletRequest req) {
    String h = req.getHeader("Authorization");
    if (h == null || !h.startsWith("Bearer "))
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Token requerido");
    return h.substring(7).trim();
  }

  private ApiException prohibido() {
    return new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso para esta acción");
  }
}