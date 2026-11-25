package com.sospuebla.demo.sos;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sospuebla.demo.alertas.service.ApiException;
import com.sospuebla.demo.auth.JwtService;
import com.sospuebla.demo.ciudadanos.Ciudadano;
import com.sospuebla.demo.ciudadanos.CiudadanoRepo;
import com.sospuebla.demo.sos.SosDtos.SosDto;
import com.sospuebla.demo.sos.SosDtos.SosRequest;

/**
 * SOS ciudadano. Canales WebSocket:
 *   /topic/sos              -> panel: { tipo: "sos:nuevo" | "sos:estado", sosId, estado }
 *   /topic/sos/{sosId}      -> quien envió el SOS: { tipo: "sos:estado", sosId, estado, nota }
 */
@Service
public class SosService {
  public static final List<String> TIPOS = List.of(
      "emergencia_medica", "atrapado", "incendio", "inundacion", "derrumbe", "violencia", "otro");
  public static final List<String> ORIGENES = List.of("app", "dije");
  public static final List<String> ESTADOS = List.of("activo", "en_atencion", "atendido", "cancelado");

  private final SosRepo repo;
  private final CiudadanoRepo ciudadanos;
  private final SimpMessagingTemplate ws;

  public SosService(SosRepo repo, CiudadanoRepo ciudadanos, SimpMessagingTemplate ws) {
    this.repo = repo;
    this.ciudadanos = ciudadanos;
    this.ws = ws;
  }

  @Transactional
  public SosDto crear(SosRequest r, JwtService.Identidad id) {
    var s = new SosReporte();
    s.tipo = valorValido(r.tipo(), TIPOS, "otro", "Tipo de SOS inválido");
    s.origen = valorValido(r.origen(), ORIGENES, "app", "Origen inválido");
    s.mensaje = r.mensaje();
    s.municipio = r.municipio();
    if (r.lat() != null && r.lng() != null) {
      if (r.lat() < -90 || r.lat() > 90 || r.lng() < -180 || r.lng() > 180)
        throw new ApiException(HttpStatus.BAD_REQUEST, "Coordenadas inválidas");
      s.lat = r.lat();
      s.lng = r.lng();
    }
    s.nombre = r.nombre();
    s.telefono = r.telefono();

    Ciudadano c = null;
    if (id != null) {
      s.usuarioId = id.usuarioId();
      c = ciudadanos.findByUsuarioId(id.usuarioId()).orElse(null);
      if (c != null) {
        s.ciudadanoId = c.id;
        if (blanco(s.nombre)) s.nombre = blanco(c.apellidos) ? c.nombre : c.nombre + " " + c.apellidos;
        if (blanco(s.telefono)) s.telefono = c.telefono;
        if (blanco(s.municipio)) s.municipio = c.municipio;
        if (s.lat == null && c.lat != null) {   // sin GPS: se usa el domicilio registrado
          s.lat = c.lat;
          s.lng = c.lng;
        }
      }
    }
    if (s.lat == null && blanco(s.municipio))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Se requiere ubicación (lat/lng) o municipio");
    if (blanco(s.nombre)) s.nombre = "Ciudadano sin registro";

    s = repo.save(s);
    avisar("sos:nuevo", s);
    return SosDto.de(s, c);
  }

  public List<SosDto> listar(String estado) {
    var lista = estado == null || estado.isBlank()
        ? repo.findAllByOrderByCreadoEnDesc()
        : repo.findByEstadoOrderByCreadoEnDesc(estado);
    return lista.stream().map(this::dto).toList();
  }

  public SosDto obtener(Long id) {
    return dto(buscar(id));
  }

  public List<SosDto> mios(JwtService.Identidad id) {
    if (id == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Token requerido");
    return repo.findByUsuarioIdOrderByCreadoEnDesc(id.usuarioId()).stream().map(this::dto).toList();
  }

  /** Operador: pasa el SOS a en_atencion / atendido / cancelado. */
  @Transactional
  public SosDto cambiarEstado(Long sosId, String estado, String nota, JwtService.Identidad id) {
    if (estado == null || !ESTADOS.contains(estado))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Estado inválido");
    var s = buscar(sosId);
    s.estado = estado;
    if (nota != null) s.nota = nota;
    if (id != null) s.atendidoPor = id.usuarioId();
    s.actualizadoEn = LocalDateTime.now();
    s = repo.save(s);
    avisar("sos:estado", s);
    return dto(s);
  }

  /** El propio ciudadano cancela su SOS (falsa alarma). */
  @Transactional
  public SosDto cancelar(Long sosId, JwtService.Identidad id) {
    if (id == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Token requerido");
    var s = buscar(sosId);
    if (!id.usuarioId().equals(s.usuarioId) && !id.esStaff())
      throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso para esta acción");
    if (!"activo".equals(s.estado) && !"en_atencion".equals(s.estado))
      throw new ApiException(HttpStatus.CONFLICT, "Este SOS ya fue cerrado");
    s.estado = "cancelado";
    s.nota = "Cancelado por quien lo envió";
    s.actualizadoEn = LocalDateTime.now();
    s = repo.save(s);
    avisar("sos:estado", s);
    return dto(s);
  }

  // ------------------------------------------------------------------

  private SosReporte buscar(Long id) {
    return repo.findById(id).orElseThrow(
        () -> new ApiException(HttpStatus.NOT_FOUND, "SOS " + id + " no encontrado"));
  }

  private SosDto dto(SosReporte s) {
    Ciudadano c = s.ciudadanoId == null ? null : ciudadanos.findById(s.ciudadanoId).orElse(null);
    return SosDto.de(s, c);
  }

  private void avisar(String tipo, SosReporte s) {
    var p = new LinkedHashMap<String, Object>();
    p.put("tipo", tipo);
    p.put("sosId", s.id);
    p.put("estado", s.estado);
    if (s.nota != null) p.put("nota", s.nota);
    ws.convertAndSend("/topic/sos", (Object) p);
    ws.convertAndSend("/topic/sos/" + s.id, (Object) p);
  }

  private static boolean blanco(String v) {
    return v == null || v.isBlank();
  }

  private static String valorValido(String v, List<String> validos, String defecto, String error) {
    if (blanco(v)) return defecto;
    if (!validos.contains(v)) throw new ApiException(HttpStatus.BAD_REQUEST, error);
    return v;
  }
}
