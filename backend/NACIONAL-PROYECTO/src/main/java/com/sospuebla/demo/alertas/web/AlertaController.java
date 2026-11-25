package com.sospuebla.demo.alertas.web;

import com.sospuebla.demo.alertas.dto.*;
import com.sospuebla.demo.alertas.model.EstadoAlerta;
import com.sospuebla.demo.alertas.service.AlertaService;
import com.sospuebla.demo.alertas.service.ApiException;
import com.sospuebla.demo.auth.Alcance;
import com.sospuebla.demo.auth.JwtService;
import com.sospuebla.demo.auth.SeguridadInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import com.sospuebla.demo.alertas.service.EonetSyncService;
import com.sospuebla.demo.alertas.service.SimuladorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alertas")
public class AlertaController {

    private final AlertaService service;
    private final SimuladorService simuladorService;
    private final EonetSyncService eonetSyncService;

    public AlertaController(AlertaService service, SimuladorService simuladorService, EonetSyncService eonetSyncService) {
        this.service = service;
        this.simuladorService = simuladorService;
        this.eonetSyncService = eonetSyncService;
    }

    // Paso 7 / Paso 8: listar, crear, obtener ------------------------

    @GetMapping
    public List<AlertaDetalle> listar(@RequestParam(required = false) EstadoAlerta estado) {
        return service.listar(estado);
    }

    @GetMapping("/{id}")
    public AlertaDetalle obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AlertaDetalle crear(@Valid @RequestBody AlertaCreateRequest req, HttpServletRequest http) {
        // operador municipal: sólo alerta a su municipio; el admin estatal, a cualquiera
        Alcance.exigir(Alcance.de(http), req.municipio());
        return service.crear(req);
    }

    // Paso 14: confirmacion y cambio de estado ------------------------

    @PostMapping("/{id}/confirmar")
    public ResponseEntity<Void> confirmar(@PathVariable Long id, @Valid @RequestBody ConfirmarRequest req,
                                          HttpServletRequest http) {
        // Sólo el propio voluntario (o el personal de Protección Civil) puede responder por él:
        // un ciudadano u otro voluntario no puede confirmar a nombre de alguien más.
        if (http.getAttribute(SeguridadInterceptor.ATRIBUTO) instanceof JwtService.Identidad yo
                && !yo.esStaff() && !req.voluntarioId().equals(yo.voluntarioId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo el voluntario notificado puede responder a esta alerta");
        }
        service.confirmar(id, req);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<Void> cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambiarEstadoRequest req,
                                              HttpServletRequest http) {
        Alcance.exigir(Alcance.de(http), service.obtener(id).municipio());
        service.cambiarEstado(id, EstadoAlerta.valueOf(req.estado()));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/bitacora")
    public List<BitacoraItem> bitacora(@PathVariable Long id) {
        return service.bitacora(id);
    }

    // Paso 15: simulador de sismo --------------------------------------

    @PostMapping("/simular-sismo")
    public ResponseEntity<Map<String, String>> simularSismo(@RequestBody(required = false) SimularSismoRequest req,
                                                            HttpServletRequest http) {
        SimularSismoRequest r = req == null ? new SimularSismoRequest(null, null, null, null, null) : req;
        String municipio = r.municipio() == null ? "Puebla" : r.municipio();
        double lat = r.lat() == null ? 19.0414 : r.lat();
        double lng = r.lng() == null ? -98.2063 : r.lng();
        double radioKm = r.radioKm() == null ? 15.0 : r.radioKm();
        int segundos = r.segundosCountdown() == null ? 10 : r.segundosCountdown();
        Alcance.exigir(Alcance.de(http), municipio);

        simuladorService.simularSismo(municipio, lat, lng, radioKm, segundos);
        return ResponseEntity.accepted().body(Map.of("mensaje", "Simulacion iniciada, countdown por /topic/sismo/countdown"));
    }

    // Paso 16: autorizacion de alertas pendientes (NASA / otras fuentes) --

    @PostMapping("/{id}/autorizar")
    public AlertaDetalle autorizar(@PathVariable Long id, HttpServletRequest http) {
        // las alertas de la NASA no son de un municipio del catálogo: sólo el admin estatal las autoriza
        Alcance.exigir(Alcance.de(http), service.obtener(id).municipio());
        return service.autorizar(id);
    }

    // Paso 18/19: sincronizacion con NASA EONET --------------------------

    @PostMapping("/fuentes/sincronizar")
    public ResponseEntity<Map<String, Object>> sincronizarFuentes(
            @RequestParam(defaultValue = "20") double radioKm) {
        int creadas = eonetSyncService.sincronizar(radioKm);
        return ResponseEntity.ok(Map.of("alertasCreadas", creadas));
    }
}
