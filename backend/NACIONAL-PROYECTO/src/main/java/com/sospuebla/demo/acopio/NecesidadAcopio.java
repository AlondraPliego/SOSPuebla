package com.sospuebla.demo.acopio;

import jakarta.persistence.*;

@Entity
@Table(name = "necesidades_acopio")
public class NecesidadAcopio {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  public Long id;

  @Column(name = "item")
  public String item;

  @Column(name = "prioridad")
  public String prioridad = "normal";
}