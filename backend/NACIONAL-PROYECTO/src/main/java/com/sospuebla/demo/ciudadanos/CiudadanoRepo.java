package com.sospuebla.demo.ciudadanos;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CiudadanoRepo extends JpaRepository<Ciudadano, Long> {
  boolean existsByCorreo(String correo);
  Optional<Ciudadano> findByUsuarioId(Long usuarioId);
}
