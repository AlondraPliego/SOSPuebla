package com.sospuebla.demo.core;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogosController {

  @GetMapping("/catalogos")
  public Map<String, List<String>> catalogos() {
    var m = new LinkedHashMap<String, List<String>>();
    m.put("tipos_alerta", Catalogos.TIPOS_ALERTA);
    m.put("severidades", Catalogos.SEVERIDADES);
    m.put("estados_alerta", Catalogos.ESTADOS_ALERTA);
    m.put("estados_voluntario", Catalogos.ESTADOS_VOLUNTARIO);
    m.put("fuentes_alerta", Catalogos.FUENTES_ALERTA);
    m.put("estatus_aprobacion", Catalogos.ESTATUS_APROBACION);
    m.put("categorias", Catalogos.CATEGORIAS);
    m.put("roles", Catalogos.ROLES);
    m.put("prioridades_necesidad", Catalogos.PRIORIDADES);
    m.put("disponibilidades", Catalogos.DISPONIBILIDADES);
    return m;
  }
}