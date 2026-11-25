package com.sospuebla.demo.territorio;

import java.time.LocalDateTime;
import jakarta.persistence.*;

/** Refugio temporal para población evacuada. */
@Entity
@Table(name = "refugios")
public class Refugio {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id") public Long id;
  @Column(name = "nombre") public String nombre;
  @Column(name = "municipio") public String municipio;
  @Column(name = "localidad") public String localidad;
  @Column(name = "direccion") public String direccion;
  @Column(name = "lat") public Double lat;
  @Column(name = "lng") public Double lng;
  @Column(name = "capacidad") public Integer capacidad = 0;
  @Column(name = "ocupados") public Integer ocupados = 0;
  @Column(name = "estado") public String estado = "disponible";   // activo | disponible | lleno | cerrado
  @Column(name = "mascotas") public boolean mascotas;
  @Column(name = "telefono") public String telefono;
  @Column(name = "actualizado_en") public LocalDateTime actualizadoEn = LocalDateTime.now();
}
