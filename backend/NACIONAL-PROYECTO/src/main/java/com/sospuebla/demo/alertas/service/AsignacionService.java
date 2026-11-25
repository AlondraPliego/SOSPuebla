package com.sospuebla.demo.alertas.service;

import com.sospuebla.demo.alertas.model.Alerta;
import com.sospuebla.demo.alertas.model.Voluntario;
import com.sospuebla.demo.alertas.repo.VoluntarioRepo;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AsignacionService {

    private final VoluntarioRepo voluntarioRepo;

    public AsignacionService(VoluntarioRepo voluntarioRepo) {
        this.voluntarioRepo = voluntarioRepo;
    }

    /**
     * Formula de Haversine: distancia (en km) entre dos puntos
     * dados por su latitud/longitud, sobre la superficie terrestre.
     */
    public static double haversine(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0; // radio de la Tierra en km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public record Candidato(Voluntario voluntario, double distanciaKm) {
    }

    /**
     * Devuelve los voluntarios disponibles y aprobados que estan dentro
     * del radio de la alerta y que cubren al menos una de las categorias
     * requeridas (si se especificaron), ordenados por cercania.
     */
    public List<Candidato> cercanos(Alerta alerta, List<String> categoriasRequeridas) {
        List<Voluntario> disponibles = voluntarioRepo.findByDisponibleTrueAndEstatusAprobacion("aprobado");

        Set<String> requeridas = (categoriasRequeridas == null || categoriasRequeridas.isEmpty())
                ? Set.of()
                : categoriasRequeridas.stream().map(String::trim).collect(Collectors.toSet());

        return disponibles.stream()
                .map(v -> new Candidato(v, haversine(alerta.getLat(), alerta.getLng(), v.getLat(), v.getLng())))
                .filter(c -> c.distanciaKm() <= alerta.getRadioKm())
                .filter(c -> requeridas.isEmpty() || tieneAlguna(c.voluntario(), requeridas))
                .sorted(Comparator.comparingDouble(Candidato::distanciaKm))
                .toList();
    }

    private boolean tieneAlguna(Voluntario v, Set<String> requeridas) {
        if (v.getCategorias() == null) return false;
        return Arrays.stream(v.getCategorias().split(","))
                .map(String::trim)
                .anyMatch(requeridas::contains);
    }
}
