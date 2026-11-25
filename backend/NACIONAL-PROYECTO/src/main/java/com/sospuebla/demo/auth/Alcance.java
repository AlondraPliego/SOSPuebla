package com.sospuebla.demo.auth;

import java.text.Normalizer;
import org.springframework.http.HttpStatus;
import com.sospuebla.demo.alertas.service.ApiException;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Alcance territorial del personal de Protección Civil:
 *  - admin (autoridad estatal): administra todo el estado
 *  - operador (autoridad municipal): sólo su municipio; puede VER el resto, no modificarlo
 * Si la seguridad está desactivada (seguridad.activa=false) no hay identidad y no se restringe.
 */
public final class Alcance {
  private Alcance() {}

  public static JwtService.Identidad de(HttpServletRequest req) {
    return req.getAttribute(SeguridadInterceptor.ATRIBUTO) instanceof JwtService.Identidad id ? id : null;
  }

  /** Lanza 403 si la identidad no puede administrar ese municipio. */
  public static void exigir(JwtService.Identidad id, String municipio) {
    if (id == null || id.esAdmin()) return;
    if (!"operador".equals(id.rol()))
      throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso para esta acción");
    if (id.municipio() == null || id.municipio().isBlank())
      throw new ApiException(HttpStatus.FORBIDDEN, "Tu cuenta de operador no tiene municipio asignado");
    if (!mismo(id.municipio(), municipio))
      throw new ApiException(HttpStatus.FORBIDDEN,
          "Como operador de " + id.municipio() + " solo puedes administrar ese municipio");
  }

  public static void soloAdmin(JwtService.Identidad id) {
    if (id != null && !id.esAdmin())
      throw new ApiException(HttpStatus.FORBIDDEN, "Solo el administrador estatal puede hacer esto");
  }

  /** Compara municipios sin importar acentos, mayúsculas ni "Puebla Capital" vs "Puebla". */
  public static boolean mismo(String a, String b) {
    return normal(a).equals(normal(b));
  }

  public static String normal(String m) {
    if (m == null) return "";
    String s = Normalizer.normalize(m, Normalizer.Form.NFD).replaceAll("\\p{M}", "").trim().toLowerCase();
    return s.equals("puebla capital") ? "puebla" : s;
  }
}
