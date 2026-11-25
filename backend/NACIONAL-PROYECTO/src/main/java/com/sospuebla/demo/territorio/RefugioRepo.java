package com.sospuebla.demo.territorio;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefugioRepo extends JpaRepository<Refugio, Long> {
  List<Refugio> findAllByOrderByMunicipioAscNombreAsc();
}
