package com.sospuebla.demo.alertas.dto;

import java.time.LocalDateTime;

public record BitacoraItem(
        String evento,
        String detalle,
        LocalDateTime creadoEn
) {
}
