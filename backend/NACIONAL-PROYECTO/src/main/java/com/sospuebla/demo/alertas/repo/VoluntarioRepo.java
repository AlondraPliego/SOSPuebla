package com.sospuebla.demo.alertas.repo;

import com.sospuebla.demo.alertas.model.Voluntario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Solo lectura: el alta/edicion de voluntarios la maneja el core (Persona A). */
public interface VoluntarioRepo extends JpaRepository<Voluntario, Long> {

    List<Voluntario> findByDisponibleTrueAndEstatusAprobacion(String estatusAprobacion);

    List<Voluntario> findAllByOrderByNombreAsc();
}
