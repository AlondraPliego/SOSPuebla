package com.sospuebla.demo.alertas.repo;

import com.sospuebla.demo.alertas.model.Bitacora;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BitacoraRepo extends JpaRepository<Bitacora, Long> {

    List<Bitacora> findByAlertaIdOrderByCreadoEnAsc(Long alertaId);
}
