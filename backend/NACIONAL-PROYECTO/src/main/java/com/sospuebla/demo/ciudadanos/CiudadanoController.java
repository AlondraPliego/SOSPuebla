package com.sospuebla.demo.ciudadanos;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.sospuebla.demo.ciudadanos.CiudadanoDtos.ActualizarRequest;
import com.sospuebla.demo.ciudadanos.CiudadanoDtos.CiudadanoDto;
import com.sospuebla.demo.ciudadanos.CiudadanoDtos.RegistroRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/ciudadanos")
public class CiudadanoController {
  private final CiudadanoService svc;
  private final IdentidadActual identidad;

  public CiudadanoController(CiudadanoService svc, IdentidadActual identidad) {
    this.svc = svc;
    this.identidad = identidad;
  }

  /** Registro público. Después se inicia sesión con POST /auth/login (rol "ciudadano"). */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CiudadanoDto registrar(@Valid @RequestBody RegistroRequest r) {
    return CiudadanoDto.de(svc.registrar(r));
  }

  @GetMapping("/me")
  public CiudadanoDto yo(HttpServletRequest req) {
    return CiudadanoDto.de(svc.delUsuario(identidad.de(req)));
  }

  @PutMapping("/me")
  public CiudadanoDto actualizar(HttpServletRequest req, @RequestBody ActualizarRequest r) {
    return CiudadanoDto.de(svc.actualizar(identidad.de(req), r));
  }
}
