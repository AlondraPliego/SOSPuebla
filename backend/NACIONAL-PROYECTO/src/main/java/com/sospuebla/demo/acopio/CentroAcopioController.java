package com.sospuebla.demo.acopio;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
  public CentroDto crear(@Valid @RequestBody CentroRequest r) {
    return CentroDto.de(svc.crear(r));
  }

  @PutMapping("/{id}")
  public CentroDto actualizar(@PathVariable Long id, @Valid @RequestBody CentroRequest r) {
    return CentroDto.de(svc.actualizar(id, r));
  }

  @PostMapping("/{id}/necesidades")
  @ResponseStatus(HttpStatus.CREATED)
  public CentroDto agregarNecesidad(@PathVariable Long id, @Valid @RequestBody NecesidadRequest r) {
    return CentroDto.de(svc.agregarNecesidad(id, r));
  }

  @PutMapping("/{id}/necesidades/{nid}")
  public CentroDto editarNecesidad(@PathVariable Long id, @PathVariable Long nid,
                                   @Valid @RequestBody NecesidadRequest r) {
    return CentroDto.de(svc.editarNecesidad(id, nid, r));
  }

  @DeleteMapping("/{id}/necesidades/{nid}")
  public CentroDto borrarNecesidad(@PathVariable Long id, @PathVariable Long nid) {
    return CentroDto.de(svc.borrarNecesidad(id, nid));
  }
}