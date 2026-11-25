package com.sospuebla.demo.reportes;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.sospuebla.demo.acopio.CentroAcopioRepo;
import com.sospuebla.demo.voluntarios.VoluntarioPerfilRepo;

@RestController
public class ReportesController {
  private final JdbcTemplate jdbc;
  private final VoluntarioPerfilRepo voluntarios;
  private final CentroAcopioRepo centros;

  public ReportesController(JdbcTemplate jdbc, VoluntarioPerfilRepo voluntarios,
                            CentroAcopioRepo centros) {
    this.jdbc = jdbc;
    this.voluntarios = voluntarios;
    this.centros = centros;
  }

  @GetMapping("/reportes/resumen")
  public Map<String, Object> resumen() {
    // Voluntarios aprobados por categoría
    var porCategoria = new LinkedHashMap<String, Long>();
    voluntarios.findAllByOrderByNombreAsc().stream()
        .filter(v -> "aprobado".equals(v.estatusAprobacion))
        .forEach(v -> v.listaCategorias().forEach(c -> porCategoria.merge(c, 1L, Long::sum)));

    var m = new LinkedHashMap<String, Object>();
    m.put("alertas_activas", contar(
        "SELECT COUNT(*) FROM alertas WHERE estado IN ('activa', 'en_atencion')"));
    m.put("alertas_pendientes_autorizacion", contar(
        "SELECT COUNT(*) FROM alertas WHERE estado = 'pendiente'"));
    m.put("voluntarios_registrados", voluntarios.countByEstatusAprobacion("aprobado"));
    m.put("voluntarios_confirmados_ahora", contar(
        "SELECT COUNT(DISTINCT av.voluntario_id) FROM alerta_voluntario av "
            + "JOIN alertas a ON a.id = av.alerta_id "
            + "WHERE a.estado IN ('activa', 'en_atencion') "
            + "AND av.estado IN ('confirmo', 'en_camino', 'en_zona')"));
    m.put("centros_abiertos", centros.countByAbiertoTrue());
    m.put("alertas_por_tipo", agrupar("SELECT tipo AS clave, COUNT(*) AS total FROM alertas GROUP BY tipo"));
    m.put("voluntarios_por_categoria", porCategoria);
    return m;
  }

  private long contar(String sql) {
    Long n = jdbc.queryForObject(sql, Long.class);
    return n == null ? 0 : n;
  }

  private Map<String, Long> agrupar(String sql) {
    var r = new LinkedHashMap<String, Long>();
    jdbc.query(sql, rs -> {
      r.put(rs.getString("clave"), rs.getLong("total"));
    });
    return r;
  }
}