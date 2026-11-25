package com.sospuebla.demo.auth;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.sospuebla.demo.alertas.service.ApiException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

  /** Quién hace la petición, según su token. */
  public record Identidad(Long usuarioId, String rol, Long voluntarioId) {
    public boolean esStaff() {
      return "operador".equals(rol) || "admin".equals(rol);
    }
  }

  private final SecretKey key;
  private final long duracionMs;

  public JwtService(
      @Value("${jwt.secret:sos-puebla-clave-de-desarrollo-cambiar-antes-de-produccion}") String secreto,
      @Value("${jwt.horas:12}") long horas) {
    this.key = Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
    this.duracionMs = horas * 3_600_000L;
  }

  public String crear(Usuario u, String rol) {
    long ahora = System.currentTimeMillis();
    JwtBuilder b = Jwts.builder()
        .subject(String.valueOf(u.id))
        .claim("rol", rol)
        .issuedAt(new Date(ahora))
        .expiration(new Date(ahora + duracionMs));
    if (u.voluntarioId != null) b.claim("voluntario_id", u.voluntarioId);
    return b.signWith(key).compact();
  }

  private static byte[] sha256(String texto) {
    try {
      return MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public Identidad leer(String token) {
    try {
      Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      Object vid = c.get("voluntario_id");
      return new Identidad(
          Long.valueOf(c.getSubject()),
          c.get("rol", String.class),
          vid instanceof Number n ? n.longValue() : null);
    } catch (JwtException | IllegalArgumentException e) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Token inválido o vencido");
    }
  }
}