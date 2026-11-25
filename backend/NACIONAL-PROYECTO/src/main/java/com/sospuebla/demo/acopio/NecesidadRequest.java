package com.sospuebla.demo.acopio;

import jakarta.validation.constraints.NotBlank;

public record NecesidadRequest(
    @NotBlank String item,
    String prioridad) {}