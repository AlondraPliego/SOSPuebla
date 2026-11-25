package com.sospuebla.demo.alertas.dto;

import com.sospuebla.demo.alertas.model.EstadoAlerta;
import com.sospuebla.demo.alertas.model.FuenteAlerta;
import com.sospuebla.demo.alertas.model.SeveridadAlerta;
import com.sospuebla.demo.alertas.model.TipoAlerta;

import java.time.LocalDateTime;
import java.util.List;

public record AlertaDetalle(
        Long id,
        TipoAlerta tipo,
        SeveridadAlerta severidad,
        EstadoAlerta estado,
        String municipio,
        Double lat,
        Double lng,
        Double radioKm,
        String mensaje,
        FuenteAlerta fuente,
        String fuenteExternaId,
        LocalDateTime creadaEn,
        List<VoluntarioNotificado> voluntariosNotificados
) {
}
