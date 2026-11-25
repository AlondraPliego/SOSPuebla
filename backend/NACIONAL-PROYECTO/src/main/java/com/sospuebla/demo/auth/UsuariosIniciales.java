package com.sospuebla.demo.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class UsuariosIniciales implements CommandLineRunner {
  private final AuthService auth;

  public UsuariosIniciales(AuthService auth) {
    this.auth = auth;
  }

  @Override
  public void run(String... args) {
    crear("operador@puebla.gob.mx", "Operador Secretaría", "operador123", "operador");
    crear("admin@puebla.gob.mx", "Administrador", "admin123", "admin");
  }

  private void crear(String username, String nombre, String password, String rol) {
    if (!auth.existe(username)) auth.crearUsuario(username, nombre, password, rol, null);
  }
}