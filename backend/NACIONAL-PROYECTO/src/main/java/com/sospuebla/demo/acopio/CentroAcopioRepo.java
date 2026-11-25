package com.sospuebla.demo.acopio;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CentroAcopioRepo extends JpaRepository<CentroAcopio, Long> {
  List<CentroAcopio> findAllByOrderByNombreAsc();
  long countByAbiertoTrue();   // lo usará /reportes/resumen
}