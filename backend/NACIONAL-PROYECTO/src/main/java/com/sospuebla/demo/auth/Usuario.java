package com.sospuebla.demo.auth;

import java.util.HashSet;
import java.util.Set;
import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public String username;
  public String passwordHash;
  public String nombre;
  public Long voluntarioId;
  public boolean activo = true;

  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(name = "usuario_roles",
      joinColumns = @JoinColumn(name = "usuario_id"),
      inverseJoinColumns = @JoinColumn(name = "rol_id"))
  public Set<Rol> roles = new HashSet<>();
}