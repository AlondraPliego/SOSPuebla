package com.sospuebla.demo.ciudadanos;

import java.time.LocalDateTime;
import jakarta.persistence.*;

/** Perfil de un ciudadano registrado (rol CIUDADANO). Se liga a su usuario por usuario_id. */
@Entity
@Table(name = "ciudadanos")
public class Ciudadano {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  public Long id;

  @Column(name = "usuario_id")
  public Long usuarioId;

  @Column(name = "nombre")
  public String nombre;
  @Column(name = "apellidos")
  public String apellidos;
  @Column(name = "telefono")
  public String telefono;
  @Column(name = "correo")
  public String correo;
  @Column(name = "municipio")
  public String municipio;
  @Column(name = "colonia")
  public String colonia;
  @Column(name = "lat")
  public Double lat;
  @Column(name = "lng")
  public Double lng;

  /** Ej. adulto_mayor, discapacidad, embarazo, enfermedad_cronica (texto libre). */
  @Column(name = "condicion_vulnerable")
  public String condicionVulnerable;

  /** Contacto de emergencia (grupo familiar) al que se avisa cuando emite un SOS. */
  @Column(name = "contacto_nombre")
  public String contactoNombre;
  @Column(name = "contacto_telefono")
  public String contactoTelefono;

  @Column(name = "creado_en")
  public LocalDateTime creadoEn = LocalDateTime.now();
}
