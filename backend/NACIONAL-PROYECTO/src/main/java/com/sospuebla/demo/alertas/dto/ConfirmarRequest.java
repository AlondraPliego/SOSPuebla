package com.sospuebla.demo.alertas.dto;

import jakarta.validation.constraints.NotNull;

public record ConfirmarRequest(
        @NotNull Long voluntarioId,
        @NotNull String estado   // "confirmo" | "declino"
) {
}
