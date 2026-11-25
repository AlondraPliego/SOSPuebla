package com.sospuebla.demo.alertas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertas")
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TipoAlerta tipo;

    @Enumerated(EnumType.STRING)
    private SeveridadAlerta severidad;

    @Enumerated(EnumType.STRING)
    private EstadoAlerta estado = EstadoAlerta.pendiente;

    private String municipio;
    private Double lat;
    private Double lng;

    @Column(name = "radio_km")
    private Double radioKm;

    private String mensaje;

    @Column(name = "categorias_requeridas")
    private String categoriasRequeridas;

    @Enumerated(EnumType.STRING)
    private FuenteAlerta fuente = FuenteAlerta.manual;

    @Column(name = "fuente_externa_id")
    private String fuenteExternaId;

    @Column(name = "creada_en")
    private LocalDateTime creadaEn = LocalDateTime.now();

    @Column(name = "actualizada_en")
    private LocalDateTime actualizadaEn = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TipoAlerta getTipo() { return tipo; }
    public void setTipo(TipoAlerta tipo) { this.tipo = tipo; }

    public SeveridadAlerta getSeveridad() { return severidad; }
    public void setSeveridad(SeveridadAlerta severidad) { this.severidad = severidad; }

    public EstadoAlerta getEstado() { return estado; }
    public void setEstado(EstadoAlerta estado) { this.estado = estado; }

    public String getMunicipio() { return municipio; }
    public void setMunicipio(String municipio) { this.municipio = municipio; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getRadioKm() { return radioKm; }
    public void setRadioKm(Double radioKm) { this.radioKm = radioKm; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getCategoriasRequeridas() { return categoriasRequeridas; }
    public void setCategoriasRequeridas(String categoriasRequeridas) { this.categoriasRequeridas = categoriasRequeridas; }

    public FuenteAlerta getFuente() { return fuente; }
    public void setFuente(FuenteAlerta fuente) { this.fuente = fuente; }

    public String getFuenteExternaId() { return fuenteExternaId; }
    public void setFuenteExternaId(String fuenteExternaId) { this.fuenteExternaId = fuenteExternaId; }

    public LocalDateTime getCreadaEn() { return creadaEn; }
    public LocalDateTime getActualizadaEn() { return actualizadaEn; }
    public void setActualizadaEn(LocalDateTime actualizadaEn) { this.actualizadaEn = actualizadaEn; }
}
