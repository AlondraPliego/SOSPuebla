package com.sospuebla.demo.alertas.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Necesario para que SimuladorService.simularSismo corra en un hilo aparte. */
@Configuration
@EnableAsync
public class AsyncConfig {
}
