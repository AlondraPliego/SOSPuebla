package com.sospuebla.demo.alertas.dto;

import java.time.LocalDateTime;

public record ApiError(
        int status,
        String mensaje,
        LocalDateTime timestamp
) {
    public static ApiError of(int status, String mensaje) {
        return new ApiError(status, mensaje, LocalDateTime.now());
    }
}
