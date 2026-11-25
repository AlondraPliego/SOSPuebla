package com.sospuebla.demo.sos;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.sospuebla.demo.ciudadanos.IdentidadActual;
import com.sospuebla.demo.sos.SosDtos.EstadoRequest;
import com.sospuebla.demo.sos.SosDtos.SosDto;
import com.sospuebla.demo.sos.SosDtos.SosRequest;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/sos")
public class SosController {
  private final SosService svc;
  private final IdentidadActual identidad;

  public SosController(SosService svc, IdentidadActual identidad) {
    this.svc = svc;
    this.identidad = identidad;
  }

  /** Público: en una emergencia se puede pedir auxilio sin cuenta. Con token se liga al ciudadano. */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SosDto crear(HttpServletRequest req, @RequestBody(required = false) SosRequest r) {
    var body = r == null ? new SosRequest(null, null, null, null, null, null, null, null) : r;
    return svc.crear(body, identidad.de(req));
  }

  /** Panel (staff). */
  @GetMapping
  public List<SosDto> listar(@RequestParam(required = false) String estado) {
    return svc.listar(estado);
  }

  /** Historial del usuario con sesión. */
  @GetMapping("/mios")
  public List<SosDto> mios(HttpServletRequest req) {
    return svc.mios(identidad.de(req));
  }

  /** Panel (staff). */
  @GetMapping("/{id}")
  public SosDto uno(@PathVariable Long id) {
    return svc.obtener(id);
  }

  /** Panel (staff): en_atencion | atendido | cancelado. */
  @PatchMapping("/{id}/estado")
  public SosDto estado(HttpServletRequest req, @PathVariable Long id, @RequestBody EstadoRequest r) {
    return svc.cambiarEstado(id, r.estado(), r.nota(), identidad.de(req));
  }

  /** Quien envió el SOS lo cancela (falsa alarma). */
  @PostMapping("/{id}/cancelar")
  public SosDto cancelar(HttpServletRequest req, @PathVariable Long id) {
    return svc.cancelar(id, identidad.de(req));
  }
}
