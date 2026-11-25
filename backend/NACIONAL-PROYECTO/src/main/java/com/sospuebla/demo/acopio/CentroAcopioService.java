package com.sospuebla.demo.acopio;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sospuebla.demo.alertas.service.ApiException;
import com.sospuebla.demo.core.Catalogos;

@Service
public class CentroAcopioService {
  private final CentroAcopioRepo repo;

  public CentroAcopioService(CentroAcopioRepo repo) {
    this.repo = repo;
  }

  public List<CentroAcopio> listar() {
    return repo.findAllByOrderByNombreAsc();
  }

  public CentroAcopio obtener(Long id) {
    return repo.findById(id).orElseThrow(
        () -> new ApiException(HttpStatus.NOT_FOUND, "Centro de acopio no encontrado"));
  }

  @Transactional
  public CentroAcopio crear(CentroRequest r) {
    validarCoordenadas(r.lat(), r.lng());
    var c = new CentroAcopio();
    copiarDatos(c, r);
    c.abierto = r.abierto() == null || r.abierto();
    if (r.necesidades() != null) {
      for (var n : r.necesidades()) c.necesidades.add(nuevaNecesidad(n));
    }
    return repo.save(c);
  }

  /** Edita los datos del centro. Las necesidades se gestionan por sus propios endpoints. */
  @Transactional
  public CentroAcopio actualizar(Long id, CentroRequest r) {
    validarCoordenadas(r.lat(), r.lng());
    var c = obtener(id);
    copiarDatos(c, r);
    if (r.abierto() != null) c.abierto = r.abierto();
    return repo.save(c);
  }

  @Transactional
  public CentroAcopio agregarNecesidad(Long id, NecesidadRequest r) {
    var c = obtener(id);
    c.necesidades.add(nuevaNecesidad(r));
    return repo.save(c);
  }

  @Transactional
  public CentroAcopio editarNecesidad(Long id, Long nid, NecesidadRequest r) {
    var c = obtener(id);
    var n = c.necesidades.stream().filter(x -> x.id.equals(nid)).findFirst()
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Necesidad no encontrada"));
    n.item = r.item().trim();
    n.prioridad = prioridadValida(r.prioridad());
    return repo.save(c);
  }

  @Transactional
  public CentroAcopio borrarNecesidad(Long id, Long nid) {
    var c = obtener(id);
    boolean existia = c.necesidades.removeIf(x -> x.id.equals(nid));
    if (!existia) throw new ApiException(HttpStatus.NOT_FOUND, "Necesidad no encontrada");
    return repo.save(c);
  }

  private void copiarDatos(CentroAcopio c, CentroRequest r) {
    c.nombre = r.nombre().trim();
    c.direccion = r.direccion();
    c.municipio = r.municipio();
    c.lat = r.lat();
    c.lng = r.lng();
    c.horario = r.horario();
    c.telefono = r.telefono();
    c.responsable = r.responsable();
  }

  private NecesidadAcopio nuevaNecesidad(NecesidadRequest r) {
    var n = new NecesidadAcopio();
    n.item = r.item().trim();
    n.prioridad = prioridadValida(r.prioridad());
    return n;
  }

  private String prioridadValida(String p) {
    if (p == null || p.isBlank()) return "normal";
    if (!Catalogos.PRIORIDADES.contains(p))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Prioridad inválida");
    return p;
  }

  private void validarCoordenadas(Double lat, Double lng) {
    if (lat != null && (lat < -90 || lat > 90) || lng != null && (lng < -180 || lng > 180))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Coordenadas inválidas");
  }
}