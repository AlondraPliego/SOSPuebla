package com.sospuebla.demo.ciudadanos;

import org.springframework.stereotype.Component;
import com.sospuebla.demo.auth.JwtService;
import com.sospuebla.demo.auth.SeguridadInterceptor;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Obtiene quién hace la petición. Usa lo que dejó el SeguridadInterceptor y, si no hay
 * (rutas públicas o seguridad desactivada), intenta leer el token del header. Devuelve null
 * si la petición es anónima o el token no es válido.
 */
@Component
public class IdentidadActual {
  private final JwtService jwt;

  public IdentidadActual(JwtService jwt) {
    this.jwt = jwt;
  }

  public JwtService.Identidad de(HttpServletRequest req) {
    Object attr = req.getAttribute(SeguridadInterceptor.ATRIBUTO);
    if (attr instanceof JwtService.Identidad id) return id;
    String h = req.getHeader("Authorization");
    if (h == null || !h.startsWith("Bearer ")) return null;
    try {
      return jwt.leer(h.substring(7).trim());
    } catch (RuntimeException e) {
      return null;
    }
  }
}
