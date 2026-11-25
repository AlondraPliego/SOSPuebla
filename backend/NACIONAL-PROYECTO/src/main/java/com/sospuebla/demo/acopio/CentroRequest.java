package com.sospuebla.demo.acopio;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public record CentroRequest(
    @NotBlank String nombre,
    String direccion,
    String municipio,
    Double lat,
    Double lng,
    String horario,
    String telefono,
    String responsable,
    Boolean abierto,
    @Valid List<NecesidadRequest> necesidades) {}