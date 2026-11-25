package com.sospuebla.demo.alertas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bitacora")
public class Bitacora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alerta_id")
    private Long alertaId;

    private String evento;

    private String detalle;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn = LocalDateTime.now();

    protected Bitacora() {
    }

    public Bitacora(Long alertaId, String evento, String detalle) {
        this.alertaId = alertaId;
        this.evento = evento;
        this.detalle = detalle;
    }

    public Long getId() { return id; }
    public Long getAlertaId() { return alertaId; }
    public String getEvento() { return evento; }
    public String getDetalle() { return detalle; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
