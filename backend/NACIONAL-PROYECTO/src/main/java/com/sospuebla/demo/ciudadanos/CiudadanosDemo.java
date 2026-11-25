package com.sospuebla.demo.ciudadanos;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.sospuebla.demo.auth.AuthService;
import com.sospuebla.demo.ciudadanos.CiudadanoDtos.RegistroRequest;

/** Ciudadano de prueba para la demo: ciudadano@test.com / 123456 */
@Component
public class CiudadanosDemo implements CommandLineRunner {
  private final CiudadanoService svc;
  private final AuthService auth;

  public CiudadanosDemo(CiudadanoService svc, AuthService auth) {
    this.svc = svc;
    this.auth = auth;
  }

  @Override
  public void run(String... args) {
    if (auth.existe("ciudadano@test.com")) return;
    svc.registrar(new RegistroRequest(
        "Rosa", "Hernández", "222 111 2233", "ciudadano@test.com", "123456",
        "Puebla", "Centro Histórico", 19.0436, -98.1981, "adulto_mayor",
        "Laura Hernández (hija)", "222 444 5566"));
  }
}
