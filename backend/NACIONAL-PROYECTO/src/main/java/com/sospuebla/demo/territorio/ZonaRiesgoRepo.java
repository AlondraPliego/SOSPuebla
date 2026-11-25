package com.sospuebla.demo.territorio;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZonaRiesgoRepo extends JpaRepository<ZonaRiesgo, Long> {
  List<ZonaRiesgo> findAllByOrderByMunicipioAscNombreAsc();
}
