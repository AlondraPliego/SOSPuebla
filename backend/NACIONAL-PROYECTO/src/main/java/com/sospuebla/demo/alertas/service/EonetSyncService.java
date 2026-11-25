package com.sospuebla.demo.alertas.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sospuebla.demo.alertas.model.*;
import com.sospuebla.demo.alertas.repo.AlertaRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Sincroniza eventos abiertos de la NASA (EONET: Earth Observatory
 * Natural Event Tracker) y los crea como alertas "pendiente" para que
 * un operador humano las autorice (Fase 3/4 del plan).
 *
 * Doc: https://eonet.gsfc.nasa.gov/docs/v3
 */
@Service
public class EonetSyncService {

    private final AlertaRepo alertaRepo;
    private final AlertaService alertaService;
    private final RestClient restClient;

    public EonetSyncService(AlertaRepo alertaRepo,
                             AlertaService alertaService,
                             @Value("${eonet.base-url}") String baseUrl) {
        this.alertaRepo = alertaRepo;
        this.alertaService = alertaService;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    // --- DTOs minimos para deserializar la respuesta de EONET ---

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EonetResponse(List<EonetEvent> events) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EonetEvent(String id, String title, List<EonetCategory> categories, List<EonetGeometry> geometry) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EonetCategory(String id, String title) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EonetGeometry(String date, String type, List<Double> coordinates) {}

    /**
     * Llama a EONET, filtra eventos abiertos, y crea una alerta
     * "pendiente" por cada uno que todavia no exista (evita duplicados
     * via fuenteExternaId). No notifica voluntarios hasta que un
     * operador autorice la alerta (POST /alertas/{id}/autorizar).
     */
    public int sincronizar(double radioKmDefault) {
        EonetResponse resp = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/events").queryParam("status", "open").build())
                .retrieve()
                .body(EonetResponse.class);

        if (resp == null || resp.events() == null) return 0;

        int creadas = 0;
        for (EonetEvent ev : resp.events()) {
            if (alertaRepo.existsByFuenteExternaId(ev.id())) continue;
            if (ev.geometry() == null || ev.geometry().isEmpty()) continue;

            EonetGeometry geo = ev.geometry().get(ev.geometry().size() - 1); // la mas reciente
            if (geo.coordinates() == null || geo.coordinates().size() < 2) continue;

            // EONET entrega [lng, lat]
            double lng = geo.coordinates().get(0);
            double lat = geo.coordinates().get(1);

            Alerta a = new Alerta();
            a.setTipo(mapearTipo(ev));
            a.setSeveridad(SeveridadAlerta.moderada);
            a.setMunicipio(ev.title() == null ? "Desconocido" : ev.title());
            a.setLat(lat);
            a.setLng(lng);
            a.setRadioKm(radioKmDefault);
            a.setMensaje(ev.title());
            a.setFuente(FuenteAlerta.nasa_eonet);
            a.setFuenteExternaId(ev.id());
            a.setEstado(EstadoAlerta.pendiente); // requiere autorizacion humana

            alertaService.guardar(a);
            creadas++;
        }
        return creadas;
    }

    private TipoAlerta mapearTipo(EonetEvent ev) {
        if (ev.categories() == null) return TipoAlerta.incendio;
        return ev.categories().stream()
                .map(EonetCategory::id)
                .filter(id -> id != null)
                .map(String::toLowerCase)
                .findFirst()
                .map(id -> switch (id) {
                    case "wildfires" -> TipoAlerta.incendio;
                    case "floods" -> TipoAlerta.inundacion;
                    case "severestorms" -> TipoAlerta.huracan;
                    default -> TipoAlerta.incendio;
                })
                .orElse(TipoAlerta.incendio);
    }

    /** Sincronizacion automatica cada 30 minutos (ademas del endpoint manual). */
    @Scheduled(fixedRate = 30 * 60 * 1000)
    public void sincronizarProgramado() {
        try {
            sincronizar(20.0);
        } catch (Exception e) {
            // no tumbar la app si NASA esta caida; el endpoint manual y el
            // INSERT de DEMO_001 son el plan B
            System.err.println("EonetSyncService: fallo la sincronizacion programada -> " + e.getMessage());
        }
    }
}
