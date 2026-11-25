package com.sospuebla.demo.territorio;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Consumer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.sospuebla.demo.alertas.service.ApiException;
import com.sospuebla.demo.auth.Alcance;
import com.sospuebla.demo.auth.JwtService;
import com.sospuebla.demo.operadores.OperadorService;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Refugios, zonas de riesgo y puntos de encuentro.
 *  - GET: público (la app los muestra a toda la población)
 *  - POST/PUT/DELETE: operador de ESE municipio o administrador estatal
 */
@RestController
public class TerritorioController {
  private static final List<String> ESTADOS_REFUGIO = List.of("activo", "disponible", "lleno", "cerrado");
  private static final List<String> TIPOS_RIESGO = List.of("volcanico", "inundacion", "deslave", "sismo", "incendio");
  private static final List<String> NIVELES = List.of("alto", "medio", "bajo");

  private final RefugioRepo refugios;
  private final ZonaRiesgoRepo zonas;
  private final PuntoEncuentroRepo puntos;

  public TerritorioController(RefugioRepo refugios, ZonaRiesgoRepo zonas, PuntoEncuentroRepo puntos) {
    this.refugios = refugios;
    this.zonas = zonas;
    this.puntos = puntos;
  }

  // ---------------- Solicitudes ----------------
  public record RefugioRequest(String nombre, String municipio, String localidad, String direccion,
                               Double lat, Double lng, Integer capacidad, Integer ocupados, String estado,
                               Boolean mascotas, String telefono) {}

  public record ZonaRequest(String nombre, String tipo, String nivel, String municipio, String localidad,
                            Double lat, Double lng, Integer radioM, String descripcion, String recomendaciones) {}

  public record PuntoRequest(String nombre, String municipio, String localidad, String direccion,
                             Double lat, Double lng, String indicaciones, String responsable, String telefono,
                             Boolean activo) {}

  // ---------------- Refugios ----------------
  @GetMapping("/refugios")
  public List<Refugio> listarRefugios() {
    return refugios.findAllByOrderByMunicipioAscNombreAsc();
  }

  @PostMapping("/refugios")
  @ResponseStatus(HttpStatus.CREATED)
  public Refugio crearRefugio(HttpServletRequest req, @RequestBody RefugioRequest r) {
    return guardarRefugio(Alcance.de(req), new Refugio(), r);
  }

  @PutMapping("/refugios/{id}")
  public Refugio editarRefugio(HttpServletRequest req, @PathVariable Long id, @RequestBody RefugioRequest r) {
    var id_ = Alcance.de(req);
    var x = buscar(refugios, id, "Refugio");
    Alcance.exigir(id_, x.municipio);
    return guardarRefugio(id_, x, r);
  }

  @DeleteMapping("/refugios/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void borrarRefugio(HttpServletRequest req, @PathVariable Long id) {
    var x = buscar(refugios, id, "Refugio");
    Alcance.exigir(Alcance.de(req), x.municipio);
    refugios.delete(x);
  }

  private Refugio guardarRefugio(JwtService.Identidad yo, Refugio x, RefugioRequest r) {
    x.municipio = municipioPermitido(yo, r.municipio());
    x.nombre = obligatorio(r.nombre(), "nombre");
    x.localidad = r.localidad();
    x.direccion = r.direccion();
    coordenadas(r.lat(), r.lng(), v -> x.lat = v, v -> x.lng = v);
    x.capacidad = r.capacidad() == null ? 0 : Math.max(0, r.capacidad());
    x.ocupados = r.ocupados() == null ? 0 : Math.max(0, Math.min(r.ocupados(), x.capacidad));
    x.estado = deLista(r.estado(), ESTADOS_REFUGIO, "disponible", "Estado de refugio inválido");
    x.mascotas = Boolean.TRUE.equals(r.mascotas());
    x.telefono = r.telefono();
    x.actualizadoEn = LocalDateTime.now();
    return refugios.save(x);
  }

  // ---------------- Zonas de riesgo ----------------
  @GetMapping("/zonas-riesgo")
  public List<ZonaRiesgo> listarZonas() {
    return zonas.findAllByOrderByMunicipioAscNombreAsc();
  }

  @PostMapping("/zonas-riesgo")
  @ResponseStatus(HttpStatus.CREATED)
  public ZonaRiesgo crearZona(HttpServletRequest req, @RequestBody ZonaRequest r) {
    return guardarZona(Alcance.de(req), new ZonaRiesgo(), r);
  }

  @PutMapping("/zonas-riesgo/{id}")
  public ZonaRiesgo editarZona(HttpServletRequest req, @PathVariable Long id, @RequestBody ZonaRequest r) {
    var yo = Alcance.de(req);
    var x = buscar(zonas, id, "Zona de riesgo");
    Alcance.exigir(yo, x.municipio);
    return guardarZona(yo, x, r);
  }

  @DeleteMapping("/zonas-riesgo/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void borrarZona(HttpServletRequest req, @PathVariable Long id) {
    var x = buscar(zonas, id, "Zona de riesgo");
    Alcance.exigir(Alcance.de(req), x.municipio);
    zonas.delete(x);
  }

  private ZonaRiesgo guardarZona(JwtService.Identidad yo, ZonaRiesgo x, ZonaRequest r) {
    x.municipio = municipioPermitido(yo, r.municipio());
    x.nombre = obligatorio(r.nombre(), "nombre");
    x.tipo = deLista(r.tipo(), TIPOS_RIESGO, null, "Tipo de riesgo inválido");
    x.nivel = deLista(r.nivel(), NIVELES, "medio", "Nivel de riesgo inválido");
    x.localidad = r.localidad();
    coordenadas(r.lat(), r.lng(), v -> x.lat = v, v -> x.lng = v);
    if (r.radioM() == null || r.radioM() < 50 || r.radioM() > 50000)
      throw new ApiException(HttpStatus.BAD_REQUEST, "El radio debe estar entre 50 m y 50 km");
    x.radioM = r.radioM();
    x.descripcion = r.descripcion();
    x.recomendaciones = r.recomendaciones();
    x.actualizadoEn = LocalDateTime.now();
    return zonas.save(x);
  }

  // ---------------- Puntos de encuentro ----------------
  @GetMapping("/puntos-encuentro")
  public List<PuntoEncuentro> listarPuntos() {
    return puntos.findAllByOrderByMunicipioAscNombreAsc();
  }

  @PostMapping("/puntos-encuentro")
  @ResponseStatus(HttpStatus.CREATED)
  public PuntoEncuentro crearPunto(HttpServletRequest req, @RequestBody PuntoRequest r) {
    return guardarPunto(Alcance.de(req), new PuntoEncuentro(), r);
  }

  @PutMapping("/puntos-encuentro/{id}")
  public PuntoEncuentro editarPunto(HttpServletRequest req, @PathVariable Long id, @RequestBody PuntoRequest r) {
    var yo = Alcance.de(req);
    var x = buscar(puntos, id, "Punto de encuentro");
    Alcance.exigir(yo, x.municipio);
    return guardarPunto(yo, x, r);
  }

  @DeleteMapping("/puntos-encuentro/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void borrarPunto(HttpServletRequest req, @PathVariable Long id) {
    var x = buscar(puntos, id, "Punto de encuentro");
    Alcance.exigir(Alcance.de(req), x.municipio);
    puntos.delete(x);
  }

  private PuntoEncuentro guardarPunto(JwtService.Identidad yo, PuntoEncuentro x, PuntoRequest r) {
    x.municipio = municipioPermitido(yo, r.municipio());
    x.nombre = obligatorio(r.nombre(), "nombre");
    x.localidad = r.localidad();
    x.direccion = r.direccion();
    coordenadas(r.lat(), r.lng(), v -> x.lat = v, v -> x.lng = v);
    x.indicaciones = r.indicaciones();
    x.responsable = r.responsable();
    x.telefono = r.telefono();
    x.activo = r.activo() == null || r.activo();
    x.actualizadoEn = LocalDateTime.now();
    return puntos.save(x);
  }

  // ---------------- Utilidades ----------------
  /** El municipio debe ser del catálogo y, para un operador, el suyo. */
  private static String municipioPermitido(JwtService.Identidad yo, String municipio) {
    if (municipio == null || municipio.isBlank())
      throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el municipio");
    String m = OperadorService.municipioValido(municipio);
    Alcance.exigir(yo, m);
    return m;
  }

  private static <T> T buscar(JpaRepository<T, Long> repo, Long id, String que) {
    return repo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, que + " no encontrado"));
  }

  private static String obligatorio(String v, String campo) {
    if (v == null || v.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el " + campo);
    return v.trim();
  }

  private static String deLista(String v, List<String> validos, String defecto, String error) {
    if (v == null || v.isBlank()) {
      if (defecto == null) throw new ApiException(HttpStatus.BAD_REQUEST, error);
      return defecto;
    }
    if (!validos.contains(v)) throw new ApiException(HttpStatus.BAD_REQUEST, error);
    return v;
  }

  private static void coordenadas(Double lat, Double lng, Consumer<Double> fijarLat, Consumer<Double> fijarLng) {
    if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180)
      throw new ApiException(HttpStatus.BAD_REQUEST, "Ubicación inválida: marca el punto en el mapa");
    fijarLat.accept(lat);
    fijarLng.accept(lng);
  }
}
