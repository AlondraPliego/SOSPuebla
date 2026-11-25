package com.sospuebla.demo.core;

import java.util.List;

public final class Catalogos {
  private Catalogos() {}

  public static final List<String> TIPOS_ALERTA = List.of(
      "sismo", "volcan", "inundacion", "incendio", "deslave", "huracan", "otro");
  public static final List<String> SEVERIDADES = List.of(
      "informativa", "preventiva", "alta", "critica");
  public static final List<String> ESTADOS_ALERTA = List.of(
      "pendiente", "activa", "en_atencion", "controlada", "cerrada");
  public static final List<String> ESTADOS_VOLUNTARIO = List.of(
      "notificado", "confirmo", "en_camino", "en_zona", "rechazo");
  public static final List<String> FUENTES_ALERTA = List.of(
      "manual", "simulacion", "nasa_eonet");
  public static final List<String> ESTATUS_APROBACION = List.of(
      "pendiente", "aprobado", "rechazado");
  public static final List<String> CATEGORIAS = List.of(
      "primeros_auxilios", "busqueda_rescate", "logistica_acopio", "traslado",
      "apoyo_psicologico", "cocina", "medico_enfermeria", "comunicaciones",
      "traduccion", "otro");
  public static final List<String> ROLES = List.of(
      "ciudadano", "voluntario", "operador", "admin");
  public static final List<String> PRIORIDADES = List.of(
      "urgente", "normal", "suficiente");
  public static final List<String> DISPONIBILIDADES = List.of(
      "siempre", "fines_de_semana", "noches", "solo_criticas");
}