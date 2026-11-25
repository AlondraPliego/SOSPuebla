package com.sospuebla.demo.voluntarios;

import java.util.List;

public record ActualizarRequest(
    String nombre,
    String apellidos,
    String telefono,
    String municipio,
    String colonia,
    List<String> categorias,
    String experiencia,
    String disponibilidad,
    Boolean tieneVehiculo) {}