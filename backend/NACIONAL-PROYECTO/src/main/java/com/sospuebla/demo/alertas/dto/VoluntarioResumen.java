package com.sospuebla.demo.alertas.dto;

public record VoluntarioResumen(
        Long id,
        String nombre,
        String municipio,
        Double lat,
        Double lng,
        String categorias,
        Boolean disponible,
        String estatusAprobacion
) {
}
