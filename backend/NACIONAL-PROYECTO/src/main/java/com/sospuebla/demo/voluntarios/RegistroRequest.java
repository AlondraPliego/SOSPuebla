package com.sospuebla.demo.voluntarios;

import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.*;

public record RegistroRequest(
    @NotBlank String nombre,
    @NotBlank String apellidos,
    LocalDate fechaNacimiento,
    String telefono,
    @NotBlank @Email String correo,
    @NotBlank @Size(min = 6) String password,
    Boolean extranjero,
    String curp,
    String tipoDocumento,
    String numeroDocumento,
    String paisOrigen,
    String municipio,
    String colonia,
    Double lat,
    Double lng,
    Boolean ubicacionSegundoPlano,
    @NotEmpty List<String> categorias,
    String experiencia,
    String disponibilidad,
    Boolean tieneVehiculo) {}