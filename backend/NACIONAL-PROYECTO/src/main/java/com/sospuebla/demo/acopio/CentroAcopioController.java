package com.sospuebla.demo.acopio;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import com.sospuebla.demo.auth.Alcance;
import com.sospuebla.demo.operadores.OperadorService;

@RestController
@RequestMapping("/centros-acopio")
public class CentroAcopioController {
  private final CentroAcopioService svc;

  public CentroAcopioController(CentroAcopioService svc) {
    this.svc = svc;
  }

  @GetMapping
  public List<CentroDto> listar() {
    return svc.listar().stream().map(CentroDto::de).toList();
  }

  @GetMapping("/{id}")
  public CentroDto uno(@PathVariable Long id) {
    return CentroDto.de(svc.obtener(id));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CentroDto crear(HttpServletRequest req, @Valid @RequestBody CentroRequest r) {
    // el operador municipal sólo da de alta centros en su municipio
    Alcance.exigir(Alcance.de(req), OperadorService.municipioValido(r.municipio()));
    return CentroDto.de(svc.crear(conMunicipioValido(r)));
  }

  @PutMapping("/{id}")
  public CentroDto actualizar(HttpServletRequest req, @PathVariable Long id, @Valid @RequestBody CentroRequest r) {
    var yo = Alcance.de(req);
    Alcance.exigir(yo, svc.obtener(id).municipio);
    Alcance.exigir(yo, OperadorService.municipioValido(r.municipio()));
    return CentroDto.de(svc.actualizar(id, conMunicipioValido(r)));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void borrar(HttpServletRequest req, @PathVariable Long id) {
    Alcance.exigir(Alcance.de(req), svc.obtener(id).municipio);
    svc.borrar(id);
  }

  @PostMapping("/{id}/necesidades")
  @ResponseStatus(HttpStatus.CREATED)
  public CentroDto agregarNecesidad(HttpServletRequest req, @PathVariable Long id, @Valid @RequestBody NecesidadRequest r) {
    Alcance.exigir(Alcance.de(req), svc.obtener(id).municipio);
    return CentroDto.de(svc.agregarNecesidad(id, r));
  }

  @PutMapping("/{id}/necesidades/{nid}")
  public CentroDto editarNecesidad(HttpServletRequest req, @PathVariable Long id, @PathVariable Long nid,
                                   @Valid @RequestBody NecesidadRequest r) {
    Alcance.exigir(Alcance.de(req), svc.obtener(id).municipio);
    return CentroDto.de(svc.editarNecesidad(id, nid, r));
  }

  @DeleteMapping("/{id}/necesidades/{nid}")
  public CentroDto borrarNecesidad(HttpServletRequest req, @PathVariable Long id, @PathVariable Long nid) {
    Alcance.exigir(Alcance.de(req), svc.obtener(id).municipio);
    return CentroDto.de(svc.borrarNecesidad(id, nid));
  }

  /** Guarda el municipio con su nombre del catálogo (así coincide con el alcance de los operadores). */
  private static CentroRequest conMunicipioValido(CentroRequest r) {
    return new CentroRequest(r.nombre(), r.direccion(), OperadorService.municipioValido(r.municipio()),
        r.localidad(), r.lat(), r.lng(), r.horario(), r.telefono(), r.responsable(), r.abierto(), r.necesidades());
  }
}
