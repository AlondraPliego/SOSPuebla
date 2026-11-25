package com.sospuebla.demo.voluntarios;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoluntarioPerfilRepo extends JpaRepository<VoluntarioPerfil, Long> {
  boolean existsByCorreo(String correo);
  boolean existsByCurp(String curp);
  Optional<VoluntarioPerfil> findByCurp(String curp);
  long countByEstatusAprobacion(String estatus);   // lo usará /reportes/resumen
  List<VoluntarioPerfil> findAllByOrderByNombreAsc();
}