package com.sospuebla.demo.operadores;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.sospuebla.demo.auth.AuthService;
import com.sospuebla.demo.auth.UsuarioRepository;

/**
 * Operadores municipales de prueba (aprobados):
 *   operador@puebla.gob.mx / operador123          -> Puebla
 *   operador.atlixco@puebla.gob.mx / operador123  -> Atlixco
 * El administrador estatal (admin@puebla.gob.mx) lo crea UsuariosIniciales.
 */
@Component
public class OperadoresIniciales implements CommandLineRunner {
  private final AuthService auth;
  private final UsuarioRepository usuarios;
  private final OperadorRepo repo;

  public OperadoresIniciales(AuthService auth, UsuarioRepository usuarios, OperadorRepo repo) {
    this.auth = auth;
    this.usuarios = usuarios;
    this.repo = repo;
  }

  @Override
  public void run(String... args) {
    operador("operador@puebla.gob.mx", "Operador Secretaría", "Puebla", "Coordinación municipal de Protección Civil");
    operador("operador.atlixco@puebla.gob.mx", "Operadora Atlixco", "Atlixco", "Protección Civil Atlixco");
  }

  private void operador(String correo, String nombre, String municipio, String cargo) {
    // se crea aquí si aún no existe (así no depende del orden de los demás inicializadores)
    if (!auth.existe(correo)) auth.crearUsuario(correo, nombre, "operador123", "operador", null);
    var u = usuarios.findByUsername(correo).orElseThrow();
    if (repo.findByUsuarioId(u.id).isPresent()) return;
    var o = new Operador();
    o.usuarioId = u.id;
    o.nombre = nombre;
    o.correo = correo;
    o.cargo = cargo;
    o.municipio = municipio;
    o.estatus = "aprobado";
    repo.save(o);
  }
}
