package com.sospuebla.demo.alertas.repo;

import com.sospuebla.demo.alertas.model.Alerta;
import com.sospuebla.demo.alertas.model.EstadoAlerta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertaRepo extends JpaRepository<Alerta, Long> {

    List<Alerta> findAllByOrderByCreadaEnDesc();

    List<Alerta> findByEstadoOrderByCreadaEnDesc(EstadoAlerta estado);

    boolean existsByFuenteExternaId(String fuenteExternaId);
}
