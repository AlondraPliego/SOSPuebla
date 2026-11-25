package com.sospuebla.demo.auth;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Rol {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public String nombre;
}