package com.sospuebla.demo.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
  Optional<Usuario> findByUsername(String username);

  @Query(value = "SELECT u.* FROM usuarios u JOIN voluntarios v ON v.id = u.voluntario_id "
      + "WHERE v.curp = :curp", nativeQuery = true)
  Optional<Usuario> findByCurpDeVoluntario(@Param("curp") String curp);
}