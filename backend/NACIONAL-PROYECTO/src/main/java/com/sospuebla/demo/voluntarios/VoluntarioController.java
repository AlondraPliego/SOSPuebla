package com.sospuebla.demo.voluntarios;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/voluntarios")
public class VoluntarioController {
  private final VoluntarioService svc;

  public VoluntarioController(VoluntarioService svc) {
    this.svc = svc;
  }

  public record AprobacionRequest(String estatus) {}
  public record UbicacionRequest(Double lat, Double lng) {}
  public record DisponibilidadRequest(Boolean disponible, Boolean disponibleAhora, String disponibilidad) {}

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public VoluntarioDto registrar(@Valid @RequestBody RegistroRequest r) {
    return VoluntarioDto.de(svc.registrar(r));
  }

  @GetMapping
  public List<VoluntarioDto> listar(@RequestParam(required = false) String categoria,
                                    @RequestParam(required = false) String municipio,
                                    @RequestParam(required = false) Boolean extranjero,
                                    @RequestParam(required = false) String estatus,
                                    @RequestParam(required = false) Boolean disponible,
                                    @RequestParam(required = false) String q) {
    return svc.listar(categoria, municipio, extranjero, estatus, disponible, q)
        .stream().map(VoluntarioDto::de).toList();
  }

  @GetMapping("/{id}")
  public VoluntarioDto uno(@PathVariable Long id) {
    return VoluntarioDto.de(svc.obtener(id));
  }

  @PutMapping("/{id}")
  public VoluntarioDto actualizar(@PathVariable Long id, @RequestBody ActualizarRequest r) {
    return VoluntarioDto.de(svc.actualizar(id, r));
  }

  @PatchMapping("/{id}/aprobacion")
  public VoluntarioDto aprobacion(@PathVariable Long id, @RequestBody AprobacionRequest r) {
    return VoluntarioDto.de(svc.cambiarAprobacion(id, r.estatus()));
  }

  @PatchMapping("/{id}/ubicacion")
  public VoluntarioDto ubicacion(@PathVariable Long id, @RequestBody UbicacionRequest r) {
    return VoluntarioDto.de(svc.actualizarUbicacion(id, r.lat(), r.lng()));
  }

  @PatchMapping("/{id}/disponibilidad")
  public VoluntarioDto disponibilidad(@PathVariable Long id, @RequestBody DisponibilidadRequest r) {
    Boolean disp = r.disponible() != null ? r.disponible() : r.disponibleAhora();
    return VoluntarioDto.de(svc.actualizarDisponibilidad(id, disp, r.disponibilidad()));
  }
}