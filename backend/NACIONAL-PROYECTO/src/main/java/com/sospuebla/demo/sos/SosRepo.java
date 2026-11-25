package com.sospuebla.demo.sos;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SosRepo extends JpaRepository<SosReporte, Long> {
  List<SosReporte> findAllByOrderByCreadoEnDesc();
  List<SosReporte> findByEstadoOrderByCreadoEnDesc(String estado);
  List<SosReporte> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);
}
