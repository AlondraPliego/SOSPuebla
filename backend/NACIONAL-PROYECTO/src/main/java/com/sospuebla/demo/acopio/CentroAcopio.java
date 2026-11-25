package com.sospuebla.demo.acopio;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "centros_acopio")
public class CentroAcopio {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  public Long id;

  @Column(name = "nombre")
  public String nombre;
  @Column(name = "direccion")
  public String direccion;
  @Column(name = "municipio")
  public String municipio;
  @Column(name = "lat")
  public Double lat;
  @Column(name = "lng")
  public Double lng;
  @Column(name = "horario")
  public String horario;
  @Column(name = "telefono")
  public String telefono;
  @Column(name = "responsable")
  public String responsable;
  @Column(name = "abierto")
  public boolean abierto = true;

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JoinColumn(name = "centro_id", nullable = false)
  public List<NecesidadAcopio> necesidades = new ArrayList<>();
}