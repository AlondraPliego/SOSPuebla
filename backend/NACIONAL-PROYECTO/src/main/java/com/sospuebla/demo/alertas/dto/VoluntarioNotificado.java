package com.sospuebla.demo.alertas.dto;

public record VoluntarioNotificado(
        Long voluntarioId,
        String nombre,
        Double lat,
        Double lng,
        Double distanciaKm,
        String estado
) {
}
