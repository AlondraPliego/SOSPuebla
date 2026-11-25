package com.sospuebla.demo.territorio;

import java.time.LocalDateTime;
import jakarta.persistence.*;

/** Zona de riesgo (círculo en el mapa). */
@Entity
@Table(name = "zonas_riesgo")
public class ZonaRiesgo {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id") public Long id;
  @Column(name = "nombre") public String nombre;
  @Column(name = "tipo") public String tipo;     // volcanico | inundacion | deslave | sismo | incendio
  @Column(name = "nivel") public String nivel;   // alto | medio | bajo
  @Column(name = "municipio") public String municipio;
  @Column(name = "localidad") public String localidad;
  @Column(name = "lat") public Double lat;
  @Column(name = "lng") public Double lng;
  @Column(name = "radio_m") public Integer radioM = 500;
  @Column(name = "descripcion") public String descripcion;
  @Column(name = "recomendaciones") public String recomendaciones;   // una por línea
  @Column(name = "actualizado_en") public LocalDateTime actualizadoEn = LocalDateTime.now();
}
