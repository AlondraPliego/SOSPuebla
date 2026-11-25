package com.sospuebla.demo.core;

import java.text.Normalizer;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.sospuebla.demo.acopio.CentroAcopio;
import com.sospuebla.demo.acopio.CentroAcopioRepo;
import com.sospuebla.demo.acopio.NecesidadAcopio;
import com.sospuebla.demo.auth.AuthService;
import com.sospuebla.demo.voluntarios.VoluntarioPerfil;
import com.sospuebla.demo.voluntarios.VoluntarioPerfilRepo;

@Component
public class DatosDemo implements CommandLineRunner {
  private static final String PASSWORD = "123456";

  private final VoluntarioPerfilRepo voluntarios;
  private final CentroAcopioRepo centros;
  private final AuthService auth;

  public DatosDemo(VoluntarioPerfilRepo voluntarios, CentroAcopioRepo centros, AuthService auth) {
    this.voluntarios = voluntarios;
    this.centros = centros;
    this.auth = auth;
  }

  @Override
  public void run(String... args) {
    completarVoluntariosDeDataSql();
    crearVoluntariosExtra();
    crearCentros();
  }

  // Los 6 de data.sql no traen correo, apellidos ni usuario
  private void completarVoluntariosDeDataSql() {
    for (VoluntarioPerfil v : voluntarios.findAll()) {
      if (v.correo != null && !v.correo.isBlank()) continue;

      if ((v.apellidos == null || v.apellidos.isBlank()) && v.nombre != null && v.nombre.contains(" ")) {
        int i = v.nombre.indexOf(' ');
        v.apellidos = v.nombre.substring(i + 1).trim();
        v.nombre = v.nombre.substring(0, i).trim();
      }
      v.correo = correoLibre(v.nombre);
      voluntarios.save(v);
      crearUsuario(v);
    }
  }

  private void crearVoluntariosExtra() {
    voluntario("Diego", "García", "Tehuacán", 18.4620, -97.3930, "comunicaciones", "aprobado", false, null);
    voluntario("Paola", "Ruiz", "Amozoc", 19.0310, -98.0490, "cocina", "aprobado", false, null);
    voluntario("Jorge", "Vázquez", "Cuautlancingo", 19.0950, -98.2580, "apoyo_psicologico", "aprobado", false, null);
    voluntario("Lucía", "Flores", "Puebla", 19.0350, -98.2150, "primeros_auxilios", "aprobado", false, null);
    voluntario("Andrés", "Morales", "Puebla", 19.0450, -98.1980, "busqueda_rescate", "aprobado", false, null);
    voluntario("John", "Smith", "Puebla", 19.0400, -98.2000, "traduccion", "aprobado", true, null);
    // Pendiente: sirve para demostrar el flujo de aprobación del operador
    voluntario("Valeria", "Núñez", "San Andrés Cholula", 19.0540, -98.2970,
        "medico_enfermeria", "pendiente", false, "NUVA950315MPLNXX01");
  }

  private void voluntario(String nombre, String apellidos, String municipio, double lat, double lng,
                          String categoria, String estatus, boolean extranjero, String curp) {
    String correo = correoDe(nombre);
    if (voluntarios.existsByCorreo(correo)) return;

    var v = new VoluntarioPerfil();
    v.nombre = nombre;
    v.apellidos = apellidos;
    v.correo = correo;
    v.municipio = municipio;
    v.lat = lat;
    v.lng = lng;
    v.asignarCategorias(List.of(categoria));
    v.estatusAprobacion = estatus;
    v.extranjero = extranjero;
    if (extranjero) {
      v.tipoDocumento = "Pasaporte";
      v.numeroDocumento = "X1234567";
      v.paisOrigen = "Estados Unidos";
    } else {
      v.curp = curp;
    }
    v = voluntarios.save(v);
    crearUsuario(v);
  }

  private void crearUsuario(VoluntarioPerfil v) {
    if (auth.existe(v.correo)) return;
    String completo = v.apellidos == null ? v.nombre : v.nombre + " " + v.apellidos;
    auth.crearUsuario(v.correo, completo, PASSWORD, "voluntario", v.id);
  }

  private void crearCentros() {
    if (centros.count() > 0) return;
    centro("Centro de acopio Zócalo", "Av. Reforma 123, Centro", "Puebla", 19.0434, -98.1982,
        new String[][]{{"Agua embotellada", "urgente"}, {"Cobijas", "normal"}, {"Alimentos no perecederos", "normal"}});
    centro("Acopio Cholula", "Portal Guerrero, San Pedro Cholula", "San Pedro Cholula", 19.0630, -98.3060,
        new String[][]{{"Medicamentos", "urgente"}, {"Ropa", "suficiente"}});
    centro("Acopio Atlixco", "Zócalo de Atlixco", "Atlixco", 18.9080, -98.4330,
        new String[][]{{"Agua embotellada", "normal"}, {"Productos de higiene", "urgente"}});
  }

  private void centro(String nombre, String direccion, String municipio, double lat, double lng,
                      String[][] necesidades) {
    var c = new CentroAcopio();
    c.nombre = nombre;
    c.direccion = direccion;
    c.municipio = municipio;
    c.lat = lat;
    c.lng = lng;
    c.horario = "9:00 - 18:00";
    c.telefono = "222 000 0000";
    c.responsable = "Protección Civil";
    for (String[] n : necesidades) {
      var nec = new NecesidadAcopio();
      nec.item = n[0];
      nec.prioridad = n[1];
      c.necesidades.add(nec);
    }
    centros.save(c);
  }

  private String correoDe(String nombre) {
    String base = nombre.trim().split("\\s+")[0].toLowerCase();
    return Normalizer.normalize(base, Normalizer.Form.NFD).replaceAll("\\p{M}", "") + "@test.com";
  }

  private String correoLibre(String nombre) {
    String correo = correoDe(nombre);
    int n = 2;
    while (voluntarios.existsByCorreo(correo)) {
      correo = correoDe(nombre).replace("@", n++ + "@");
    }
    return correo;
  }
}