package com.sospuebla.demo.alertas.dto;

public record SimularSismoRequest(
        String municipio,
        Double lat,
        Double lng,
        Double radioKm,
        Integer segundosCountdown   // opcional, default 10
) {
}
