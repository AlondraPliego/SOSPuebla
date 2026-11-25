package com.sospuebla.demo.territorio;

import java.time.LocalDateTime;
import jakarta.persistence.*;

/** Punto de encuentro donde se reúnen los voluntarios de la zona ante una emergencia. */
@Entity
@Table(name = "puntos_encuentro")
public class PuntoEncuentro {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id") public Long id;
  @Column(name = "nombre") public String nombre;
  @Column(name = "municipio") public String municipio;
  @Column(name = "localidad") public String localidad;
  @Column(name = "direccion") public String direccion;
  @Column(name = "lat") public Double lat;
  @Column(name = "lng") public Double lng;
  @Column(name = "indicaciones") public String indicaciones;   // qué hacer al llegar, a quién buscar
  @Column(name = "responsable") public String responsable;
  @Column(name = "telefono") public String telefono;
  @Column(name = "activo") public boolean activo = true;
  @Column(name = "actualizado_en") public LocalDateTime actualizadoEn = LocalDateTime.now();
}
