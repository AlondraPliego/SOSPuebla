package com.sospuebla.demo.operadores;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperadorRepo extends JpaRepository<Operador, Long> {
  Optional<Operador> findByUsuarioId(Long usuarioId);
  List<Operador> findAllByOrderByEstatusAscMunicipioAscNombreAsc();
}
