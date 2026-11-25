package com.sospuebla.demo.alertas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerta_voluntario")
public class AlertaVoluntario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alerta_id")
    private Long alertaId;

    @Column(name = "voluntario_id")
    private Long voluntarioId;

    @Column(name = "distancia_km")
    private Double distanciaKm;

    @Enumerated(EnumType.STRING)
    private EstadoConfirmacion estado = EstadoConfirmacion.notificado;

    @Column(name = "notificado_en")
    private LocalDateTime notificadoEn = LocalDateTime.now();

    @Column(name = "respondido_en")
    private LocalDateTime respondidoEn;

    protected AlertaVoluntario() {
    }

    public AlertaVoluntario(Long alertaId, Long voluntarioId, Double distanciaKm) {
        this.alertaId = alertaId;
        this.voluntarioId = voluntarioId;
        this.distanciaKm = distanciaKm;
    }

    public Long getId() { return id; }
    public Long getAlertaId() { return alertaId; }
    public Long getVoluntarioId() { return voluntarioId; }
    public Double getDistanciaKm() { return distanciaKm; }
    public EstadoConfirmacion getEstado() { return estado; }
    public void setEstado(EstadoConfirmacion estado) { this.estado = estado; }
    public LocalDateTime getNotificadoEn() { return notificadoEn; }
    public LocalDateTime getRespondidoEn() { return respondidoEn; }
    public void setRespondidoEn(LocalDateTime respondidoEn) { this.respondidoEn = respondidoEn; }
}
