package com.sospuebla.demo.sos;

import java.time.LocalDateTime;
import jakarta.persistence.*;

/** Solicitud de auxilio (botón SOS de la app o dije físico). */
@Entity
@Table(name = "sos_reportes")
public class SosReporte {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  public Long id;

  /** null si el SOS se envió sin sesión. */
  @Column(name = "ciudadano_id")
  public Long ciudadanoId;
  @Column(name = "usuario_id")
  public Long usuarioId;

  @Column(name = "nombre")
  public String nombre;
  @Column(name = "telefono")
  public String telefono;

  @Column(name = "lat")
  public Double lat;
  @Column(name = "lng")
  public Double lng;
  @Column(name = "municipio")
  public String municipio;

  @Column(name = "tipo")
  public String tipo = "otro";          // ver SosService.TIPOS
  @Column(name = "mensaje")
  public String mensaje;
  @Column(name = "origen")
  public String origen = "app";         // app | dije

  @Column(name = "estado")
  public String estado = "activo";      // activo | en_atencion | atendido | cancelado
  @Column(name = "nota")
  public String nota;                   // comentario del operador
  @Column(name = "atendido_por")
  public Long atendidoPor;              // usuario_id del operador

  @Column(name = "creado_en")
  public LocalDateTime creadoEn = LocalDateTime.now();
  @Column(name = "actualizado_en")
  public LocalDateTime actualizadoEn = LocalDateTime.now();
}
