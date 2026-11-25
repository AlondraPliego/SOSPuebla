package com.sospuebla.demo.alertas.service;

import com.sospuebla.demo.alertas.dto.*;
import com.sospuebla.demo.alertas.model.*;
import com.sospuebla.demo.alertas.repo.AlertaRepo;
import com.sospuebla.demo.alertas.repo.AlertaVoluntarioRepo;
import com.sospuebla.demo.alertas.repo.BitacoraRepo;
import com.sospuebla.demo.alertas.repo.VoluntarioRepo;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class AlertaService {

    private final AlertaRepo alertaRepo;
    private final AlertaVoluntarioRepo alertaVoluntarioRepo;
    private final BitacoraRepo bitacoraRepo;
    private final VoluntarioRepo voluntarioRepo;
    private final AsignacionService asignacionService;
    private final SimpMessagingTemplate ws;

    public AlertaService(AlertaRepo alertaRepo,
                          AlertaVoluntarioRepo alertaVoluntarioRepo,
                          BitacoraRepo bitacoraRepo,
                          VoluntarioRepo voluntarioRepo,
                          AsignacionService asignacionService,
                          SimpMessagingTemplate ws) {
        this.alertaRepo = alertaRepo;
        this.alertaVoluntarioRepo = alertaVoluntarioRepo;
        this.bitacoraRepo = bitacoraRepo;
        this.voluntarioRepo = voluntarioRepo;
        this.asignacionService = asignacionService;
        this.ws = ws;
    }

    // --------------------------------------------------------------
    // Listado / detalle
    // --------------------------------------------------------------

    public List<AlertaDetalle> listar(EstadoAlerta estado) {
        var lista = estado == null
                ? alertaRepo.findAllByOrderByCreadaEnDesc()
                : alertaRepo.findByEstadoOrderByCreadaEnDesc(estado);
        return lista.stream().map(this::detalle).toList();
    }

    public AlertaDetalle obtener(Long id) {
        return detalle(buscarOFallar(id));
    }

    private Alerta buscarOFallar(Long id) {
        return alertaRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Alerta " + id + " no encontrada"));
    }

    private AlertaDetalle detalle(Alerta a) {
        var voluntarios = alertaVoluntarioRepo.findByAlertaId(a.getId()).stream()
                .map(av -> {
                    Voluntario v = voluntarioRepo.findById(av.getVoluntarioId()).orElse(null);
                    String nombre = v == null ? "Desconocido" : v.getNombre();
                    Double lat = v == null ? null : v.getLat();
                    Double lng = v == null ? null : v.getLng();
                    return new VoluntarioNotificado(av.getVoluntarioId(), nombre, lat, lng, av.getDistanciaKm(), av.getEstado().name());
                })
                .toList();

        return new AlertaDetalle(
                a.getId(), a.getTipo(), a.getSeveridad(), a.getEstado(), a.getMunicipio(),
                a.getLat(), a.getLng(), a.getRadioKm(), a.getMensaje(), a.getFuente(),
                a.getFuenteExternaId(), a.getCreadaEn(), voluntarios
        );
    }

    // --------------------------------------------------------------
    // Crear / guardar (Parte I del esqueleto)
    // --------------------------------------------------------------

    @Transactional
    public Alerta guardar(Alerta alerta) {
        Alerta guardada = alertaRepo.save(alerta);
        bitacoraRepo.save(new Bitacora(guardada.getId(), "creada", "Alerta registrada (" + guardada.getFuente() + ")"));
        return guardada;
    }

    /** Crea una alerta manual (POST /alertas) y la deja activa de inmediato. */
    @Transactional
    public AlertaDetalle crear(AlertaCreateRequest req) {
        Alerta a = new Alerta();
        a.setTipo(req.tipo());
        a.setSeveridad(req.severidad());
        a.setMunicipio(req.municipio());
        a.setLat(req.lat());
        a.setLng(req.lng());
        a.setRadioKm(req.radioKm());
        a.setMensaje(req.mensaje());
        a.setCategoriasRequeridas(req.categoriasRequeridas() == null ? null : String.join(",", req.categoriasRequeridas()));
        a.setFuente(FuenteAlerta.manual);
        a.setEstado(EstadoAlerta.activa);

        Alerta guardada = guardar(a);
        notificar(guardada);
        return detalle(guardada);
    }

    // --------------------------------------------------------------
    // Notificacion / asignacion por cercania (Fase 2)
    // --------------------------------------------------------------

    @Transactional
    public void notificar(Alerta alerta) {
        List<String> categorias = alerta.getCategoriasRequeridas() == null
                ? List.of()
                : Arrays.asList(alerta.getCategoriasRequeridas().split(","));

        var candidatos = asignacionService.cercanos(alerta, categorias);

        for (var c : candidatos) {
            var av = new AlertaVoluntario(alerta.getId(), c.voluntario().getId(), c.distanciaKm());
            alertaVoluntarioRepo.save(av);
            bitacoraRepo.save(new Bitacora(alerta.getId(), "voluntario_notificado",
                    c.voluntario().getNombre() + " (" + String.format("%.1f", c.distanciaKm()) + " km)"));

            Map<String, Object> payloadVoluntario = Map.of(
                    "tipo", "alerta:nueva",
                    "alertaId", alerta.getId(),
                    "mensaje", alerta.getMensaje() == null ? "" : alerta.getMensaje(),
                    "distanciaKm", c.distanciaKm()
            );
            ws.convertAndSend("/topic/voluntarios/" + c.voluntario().getId(), (Object) payloadVoluntario);
        }

        Map<String, Object> payloadPanel = Map.of(
                "tipo", "alerta:nueva",
                "alertaId", alerta.getId(),
                "estado", alerta.getEstado().name(),
                "voluntariosNotificados", candidatos.size()
        );
        ws.convertAndSend("/topic/alertas", (Object) payloadPanel);
    }

    // --------------------------------------------------------------
    // Confirmacion de voluntarios (Fase 2)
    // --------------------------------------------------------------

    @Transactional
    public void confirmar(Long alertaId, ConfirmarRequest req) {
        buscarOFallar(alertaId);

        var av = alertaVoluntarioRepo.findByAlertaIdAndVoluntarioId(alertaId, req.voluntarioId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "El voluntario " + req.voluntarioId() + " no fue notificado para esta alerta"));

        EstadoConfirmacion nuevoEstado = EstadoConfirmacion.valueOf(req.estado());
        av.setEstado(nuevoEstado);
        av.setRespondidoEn(LocalDateTime.now());
        alertaVoluntarioRepo.save(av);

        bitacoraRepo.save(new Bitacora(alertaId, "voluntario_" + nuevoEstado.name(), "Voluntario " + req.voluntarioId()));

        Map<String, Object> payloadConfirmacion = Map.of(
                "tipo", "voluntario:" + nuevoEstado.name(),
                "alertaId", alertaId,
                "voluntarioId", req.voluntarioId()
        );
        ws.convertAndSend("/topic/alertas", (Object)payloadConfirmacion);
    }

    // --------------------------------------------------------------
    // Cambio de estado (Fase 2) y autorizacion (Fase 3)
    // --------------------------------------------------------------

    @Transactional
    public void cambiarEstado(Long alertaId, EstadoAlerta nuevoEstado) {
        Alerta a = buscarOFallar(alertaId);
        a.setEstado(nuevoEstado);
        a.setActualizadaEn(LocalDateTime.now());
        alertaRepo.save(a);

        bitacoraRepo.save(new Bitacora(alertaId, "estado_cambiado", "Nuevo estado: " + nuevoEstado.name()));

        Map<String, Object> payloadEstado = Map.of(
                "tipo", "alerta:estado",
                "alertaId", alertaId,
                "estado", nuevoEstado.name()
        );
        ws.convertAndSend("/topic/alertas", (Object)payloadEstado);
    }

    @Transactional
    public AlertaDetalle autorizar(Long alertaId) {
        Alerta a = buscarOFallar(alertaId);
        if (a.getEstado() != EstadoAlerta.pendiente) {
            throw new ApiException(HttpStatus.CONFLICT, "Solo se puede autorizar una alerta en estado 'pendiente'");
        }
        a.setEstado(EstadoAlerta.activa);
        a.setActualizadaEn(LocalDateTime.now());
        alertaRepo.save(a);

        bitacoraRepo.save(new Bitacora(alertaId, "autorizada", "Autorizada por un operador"));
        notificar(a);

        return detalle(a);
    }

    // --------------------------------------------------------------
    // Bitacora
    // --------------------------------------------------------------

    public List<BitacoraItem> bitacora(Long alertaId) {
        buscarOFallar(alertaId);
        return bitacoraRepo.findByAlertaIdOrderByCreadoEnAsc(alertaId).stream()
                .map(b -> new BitacoraItem(b.getEvento(), b.getDetalle(), b.getCreadoEn()))
                .toList();
    }
}
