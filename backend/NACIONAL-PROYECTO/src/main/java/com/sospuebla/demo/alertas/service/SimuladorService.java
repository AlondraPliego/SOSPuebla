package com.sospuebla.demo.alertas.service;

import com.sospuebla.demo.alertas.model.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class SimuladorService {

    private final AlertaService alertaService;
    private final SimpMessagingTemplate ws;

    public SimuladorService(AlertaService alertaService, SimpMessagingTemplate ws) {
        this.alertaService = alertaService;
        this.ws = ws;
    }

    /**
     * Cuenta regresiva (por defecto 10s) por websocket y, al terminar,
     * crea y notifica una alerta de tipo sismo con fuente "simulador".
     * Se ejecuta en un hilo aparte para no bloquear la respuesta HTTP.
     */
    @Async
    public void simularSismo(String municipio, double lat, double lng, double radioKm, int segundos) {
        for (int i = segundos; i >= 1; i--) {
            ws.convertAndSend("/topic/sismo/countdown", (Object) Map.of("segundos", i));
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        ws.convertAndSend("/topic/sismo/countdown", (Object) Map.of("segundos", 0, "estado", "disparado"));

        Alerta a = new Alerta();
        a.setTipo(TipoAlerta.sismo);
        a.setSeveridad(SeveridadAlerta.critica);
        a.setMunicipio(municipio);
        a.setLat(lat);
        a.setLng(lng);
        a.setRadioKm(radioKm);
        a.setMensaje("Sismo simulado en " + municipio);
        a.setFuente(FuenteAlerta.simulador);
        a.setEstado(EstadoAlerta.activa);

        Alerta guardada = alertaService.guardar(a);
        alertaService.notificar(guardada);
    }
}
