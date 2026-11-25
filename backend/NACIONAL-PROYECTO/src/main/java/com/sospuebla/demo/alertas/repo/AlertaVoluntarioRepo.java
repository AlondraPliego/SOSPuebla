package com.sospuebla.demo.alertas.repo;

import com.sospuebla.demo.alertas.model.AlertaVoluntario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertaVoluntarioRepo extends JpaRepository<AlertaVoluntario, Long> {

    List<AlertaVoluntario> findByAlertaId(Long alertaId);

    Optional<AlertaVoluntario> findByAlertaIdAndVoluntarioId(Long alertaId, Long voluntarioId);
}
