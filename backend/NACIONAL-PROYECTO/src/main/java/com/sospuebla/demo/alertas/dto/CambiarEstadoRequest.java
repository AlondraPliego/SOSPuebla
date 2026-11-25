package com.sospuebla.demo.alertas.dto;

import jakarta.validation.constraints.NotNull;

public record CambiarEstadoRequest(
        @NotNull String estado   // activa | en_atencion | cerrada
) {
}
