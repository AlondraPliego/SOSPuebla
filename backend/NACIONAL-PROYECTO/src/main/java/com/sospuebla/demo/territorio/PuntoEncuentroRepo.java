package com.sospuebla.demo.territorio;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PuntoEncuentroRepo extends JpaRepository<PuntoEncuentro, Long> {
  List<PuntoEncuentro> findAllByOrderByMunicipioAscNombreAsc();
}
