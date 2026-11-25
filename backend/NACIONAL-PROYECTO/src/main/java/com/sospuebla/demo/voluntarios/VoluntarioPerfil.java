package com.sospuebla.demo.voluntarios;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "voluntarios")
public class VoluntarioPerfil {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  public Long id;

  @Column(name = "nombre")
  public String nombre;
  @Column(name = "apellidos")
  public String apellidos;
  @Column(name = "telefono")
  public String telefono;
  @Column(name = "correo")
  public String correo;
  @Column(name = "fecha_nacimiento")
  public LocalDate fechaNacimiento;
  @Column(name = "extranjero")
  public boolean extranjero;
  @Column(name = "curp")
  public String curp;
  @Column(name = "tipo_documento")
  public String tipoDocumento;
  @Column(name = "numero_documento")
  public String numeroDocumento;
  @Column(name = "pais_origen")
  public String paisOrigen;
  @Column(name = "municipio")
  public String municipio;
  @Column(name = "colonia")
  public String colonia;
  @Column(name = "lat")
  public Double lat;
  @Column(name = "lng")
  public Double lng;
  @Column(name = "ubicacion_segundo_plano")
  public boolean ubicacionSegundoPlano;

  // En la BD es un texto con comas: "primeros_auxilios,cocina"
  @Column(name = "categorias")
  public String categoriasCsv = "";

  @Column(name = "experiencia")
  public String experiencia;
  @Column(name = "disponibilidad")
  public String disponibilidad = "siempre";   // horario: siempre, noches, etc.
  @Column(name = "tiene_vehiculo")
  public boolean tieneVehiculo;
  @Column(name = "disponible")
  public boolean disponible = true;           // "disponible ahora" (lo que lee B)
  @Column(name = "estatus_aprobacion")
  public String estatusAprobacion = "pendiente";
  @Column(name = "ultima_participacion")
  public LocalDateTime ultimaParticipacion;

  // La llena MySQL sola (DEFAULT CURRENT_TIMESTAMP); Java solo la lee
  @Column(name = "creado_en", insertable = false, updatable = false)
  public LocalDateTime creadoEn;

  public List<String> listaCategorias() {
    if (categoriasCsv == null || categoriasCsv.isBlank()) return List.of();
    return Arrays.stream(categoriasCsv.split(",")).map(String::trim).toList();
  }

  public void asignarCategorias(Collection<String> c) {
    this.categoriasCsv = String.join(",", c);
  }
}