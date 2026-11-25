package com.sospuebla.demo.operadores;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.sospuebla.demo.auth.Alcance;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/operadores")
public class OperadorController {
  private final OperadorService svc;

  public OperadorController(OperadorService svc) {
    this.svc = svc;
  }

  /** Público: un funcionario municipal solicita acceso; queda pendiente de aprobación. */
  @PostMapping("/registro")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> solicitar(@RequestBody OperadorService.RegistroRequest r) {
    var o = svc.solicitar(r);
    return Map.of("id", o.id, "estatus", o.estatus, "municipio", o.municipio);
  }

  /** Administrador estatal. */
  @GetMapping
  public List<Operador> listar(HttpServletRequest req) {
    Alcance.soloAdmin(Alcance.de(req));
    return svc.listar();
  }

  public record EstatusRequest(String estatus) {}

  /** Administrador estatal: aprobado | rechazado | suspendido. */
  @PatchMapping("/{id}/estatus")
  public Operador estatus(HttpServletRequest req, @PathVariable Long id, @RequestBody EstatusRequest r) {
    Alcance.soloAdmin(Alcance.de(req));
    return svc.cambiarEstatus(id, r.estatus());
  }
}
