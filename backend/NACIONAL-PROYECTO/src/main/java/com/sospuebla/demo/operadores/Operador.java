package com.sospuebla.demo.operadores;

import java.time.LocalDateTime;
import jakarta.persistence.*;

/** Perfil de un operador municipal (autoridad del municipio). Su usuario tiene el rol OPERADOR. */
@Entity
@Table(name = "operadores")
public class Operador {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  public Long id;

  @Column(name = "usuario_id")
  public Long usuarioId;

  @Column(name = "nombre")
  public String nombre;
  @Column(name = "correo")
  public String correo;
  @Column(name = "telefono")
  public String telefono;
  @Column(name = "cargo")
  public String cargo;              // p. ej. "Coordinación municipal de Protección Civil"
  @Column(name = "municipio")
  public String municipio;

  @Column(name = "estatus")
  public String estatus = "pendiente";   // pendiente | aprobado | rechazado | suspendido

  @Column(name = "creado_en")
  public LocalDateTime creadoEn = LocalDateTime.now();
}
