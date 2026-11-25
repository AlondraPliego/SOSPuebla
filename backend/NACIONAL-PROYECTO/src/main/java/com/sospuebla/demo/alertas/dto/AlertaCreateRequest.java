package com.sospuebla.demo.alertas.dto;

import com.sospuebla.demo.alertas.model.SeveridadAlerta;
import com.sospuebla.demo.alertas.model.TipoAlerta;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record AlertaCreateRequest(
        @NotNull TipoAlerta tipo,
        @NotNull SeveridadAlerta severidad,
        @NotBlank String municipio,
        @NotNull Double lat,
        @NotNull Double lng,
        @NotNull @Positive Double radioKm,
        String mensaje,
        List<String> categoriasRequeridas
) {
}
