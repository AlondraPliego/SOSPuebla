package com.sospuebla.demo.alertas.model;

import jakarta.persistence.*;

/**
 * Entidad de solo lectura desde el modulo de alertas.
 * La entidad "oficial" (con mas campos: contacto, documentos, etc.)
 * la define Persona A en el paquete core; esta version minima se usa
 * mientras tanto. Avisar para no duplicar la clase cuando A suba la suya.
 */
@Entity
@Table(name = "voluntarios")
public class Voluntario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private String municipio;

    private Double lat;

    private Double lng;

    /** CSV de categorias: "primeros_auxilios,busqueda_rescate" */
    private String categorias;

    private Boolean disponible;

    @Column(name = "estatus_aprobacion")
    private String estatusAprobacion;

    protected Voluntario() {
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getMunicipio() { return municipio; }
    public Double getLat() { return lat; }
    public Double getLng() { return lng; }
    public String getCategorias() { return categorias; }
    public Boolean getDisponible() { return disponible; }
    public String getEstatusAprobacion() { return estatusAprobacion; }
}
