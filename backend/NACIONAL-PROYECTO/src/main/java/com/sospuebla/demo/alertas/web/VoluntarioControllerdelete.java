/*package com.sospuebla.demo.alertas.web;

import com.sospuebla.demo.alertas.dto.VoluntarioResumen;
import com.sospuebla.demo.alertas.model.Voluntario;
import com.sospuebla.demo.alertas.repo.VoluntarioRepo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoint de SOLO LECTURA para que el panel web (mapa de monitoreo) pueda
 * pintar a los voluntarios. El alta/edicion real de voluntarios la expone
 * Persona A en su propio modulo; esto es nada mas para consulta.
 */
/* 
@RestController
@RequestMapping("/voluntarios")
public class VoluntarioControllerdelete {

    private final VoluntarioRepo voluntarioRepo;

    public VoluntarioController(VoluntarioRepo voluntarioRepo) {
        this.voluntarioRepo = voluntarioRepo;
    }

    @GetMapping
    public List<VoluntarioResumen> listar(@RequestParam(required = false) Boolean disponible) {
        List<Voluntario> lista = voluntarioRepo.findAllByOrderByNombreAsc();
        return lista.stream()
                .filter(v -> disponible == null || disponible.equals(v.getDisponible()))
                .map(v -> new VoluntarioResumen(
                        v.getId(), v.getNombre(), v.getMunicipio(), v.getLat(), v.getLng(),
                        v.getCategorias(), v.getDisponible(), v.getEstatusAprobacion()
                ))
                .toList();
    }
}*/