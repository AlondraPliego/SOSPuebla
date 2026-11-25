-- =====================================================================
-- Esquema MySQL para el sistema de emergencias (SOS Puebla)
-- 7 tablas: usuarios, roles, usuario_roles, voluntarios, alertas,
--           alerta_voluntario, bitacora
-- ddl-auto: none -> este script se ejecuta solo si spring.sql.init
-- esta habilitado (ver application.yml)
-- =====================================================================

DROP TABLE IF EXISTS sos_reportes;
DROP TABLE IF EXISTS ciudadanos;
DROP TABLE IF EXISTS bitacora;
DROP TABLE IF EXISTS alerta_voluntario;
DROP TABLE IF EXISTS alertas;
DROP TABLE IF EXISTS usuario_roles;
DROP TABLE IF EXISTS voluntarios;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

-- ---------------------------------------------------------------------
-- Autenticacion (la define/ajusta Persona A; se deja lista para JWT)
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(40)  NOT NULL UNIQUE          -- OPERADOR, VOLUNTARIO
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    voluntario_id   BIGINT NULL,                          -- FK logica a voluntarios.id si aplica
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuario_roles (
    usuario_id      BIGINT NOT NULL,
    rol_id          BIGINT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_ur_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Voluntarios (solo lectura desde el modulo de alertas)
-- ---------------------------------------------------------------------
CREATE TABLE voluntarios (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre               VARCHAR(150) NOT NULL,
    municipio            VARCHAR(120) NOT NULL,
    lat                  DOUBLE NOT NULL,
    lng                  DOUBLE NOT NULL,
    categorias           VARCHAR(500) NOT NULL,           -- CSV: primeros_auxilios,busqueda_rescate,...
    disponible           BOOLEAN NOT NULL DEFAULT TRUE,
    estatus_aprobacion   VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente | aprobado | rechazado
    creado_en            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Alertas
-- ---------------------------------------------------------------------
CREATE TABLE alertas (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo                 VARCHAR(30)  NOT NULL,           -- sismo | incendio | inundacion | huracan
    severidad            VARCHAR(20)  NOT NULL,           -- preventiva | moderada | alta | critica
    estado               VARCHAR(20)  NOT NULL DEFAULT 'pendiente', -- pendiente | activa | en_atencion | cerrada
    municipio            VARCHAR(120) NOT NULL,
    lat                  DOUBLE NOT NULL,
    lng                  DOUBLE NOT NULL,
    radio_km             DOUBLE NOT NULL,
    mensaje              VARCHAR(500),
    categorias_requeridas VARCHAR(500),                   -- CSV opcional
    fuente               VARCHAR(30)  NOT NULL DEFAULT 'manual', -- manual | simulador | nasa_eonet
    fuente_externa_id    VARCHAR(100) NULL,                -- id en EONET, evita duplicados
    creada_en            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizada_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_alertas_fuente_externa UNIQUE (fuente_externa_id)
) ENGINE=InnoDB;

CREATE INDEX idx_alertas_estado ON alertas(estado);
CREATE INDEX idx_alertas_fuente ON alertas(fuente);

-- ---------------------------------------------------------------------
-- Relacion alerta <-> voluntario notificado
-- ---------------------------------------------------------------------
CREATE TABLE alerta_voluntario (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    alerta_id       BIGINT NOT NULL,
    voluntario_id   BIGINT NOT NULL,
    distancia_km    DOUBLE NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'notificado', -- notificado | confirmo | declino
    notificado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    respondido_en   DATETIME NULL,
    CONSTRAINT fk_av_alerta FOREIGN KEY (alerta_id) REFERENCES alertas(id) ON DELETE CASCADE,
    CONSTRAINT fk_av_voluntario FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id) ON DELETE CASCADE,
    CONSTRAINT uq_av_alerta_voluntario UNIQUE (alerta_id, voluntario_id)
) ENGINE=InnoDB;

CREATE INDEX idx_av_alerta ON alerta_voluntario(alerta_id);
CREATE INDEX idx_av_voluntario ON alerta_voluntario(voluntario_id);

-- ---------------------------------------------------------------------
-- Bitacora (linea de tiempo de cada alerta)
-- ---------------------------------------------------------------------
CREATE TABLE bitacora (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    alerta_id       BIGINT NOT NULL,
    evento          VARCHAR(60)  NOT NULL,     -- creada | autorizada | voluntario_notificado | voluntario_confirmo | estado_cambiado | ...
    detalle         VARCHAR(500),
    creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bit_alerta FOREIGN KEY (alerta_id) REFERENCES alertas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_bitacora_alerta ON bitacora(alerta_id);

-- =====================================================================
-- Ajustes Backend A (voluntarios, acopio, roles)
-- =====================================================================
INSERT IGNORE INTO roles (nombre) VALUES ('ADMIN'),('OPERADOR'),('VOLUNTARIO'),('CIUDADANO');

ALTER TABLE voluntarios
  ADD COLUMN apellidos VARCHAR(150) NULL,
  ADD COLUMN fecha_nacimiento DATE NULL,
  ADD COLUMN telefono VARCHAR(30) NULL,
  ADD COLUMN correo VARCHAR(150) NULL UNIQUE,
  ADD COLUMN extranjero BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN curp VARCHAR(18) NULL UNIQUE,
  ADD COLUMN tipo_documento VARCHAR(50) NULL,
  ADD COLUMN numero_documento VARCHAR(50) NULL,
  ADD COLUMN pais_origen VARCHAR(80) NULL,
  ADD COLUMN colonia VARCHAR(120) NULL,
  ADD COLUMN ubicacion_segundo_plano BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN experiencia VARCHAR(500) NULL,
  ADD COLUMN disponibilidad VARCHAR(30) NOT NULL DEFAULT 'siempre',
  ADD COLUMN tiene_vehiculo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN ultima_participacion DATETIME NULL;

CREATE TABLE IF NOT EXISTS centros_acopio (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(250), municipio VARCHAR(120),
  lat DOUBLE, lng DOUBLE,
  horario VARCHAR(100), telefono VARCHAR(30), responsable VARCHAR(150),
  abierto BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS necesidades_acopio (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  centro_id BIGINT NOT NULL,
  item VARCHAR(150) NOT NULL,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'normal',
  CONSTRAINT fk_nec_centro FOREIGN KEY (centro_id) REFERENCES centros_acopio(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- Modulo ciudadano y SOS
-- =====================================================================
CREATE TABLE IF NOT EXISTS ciudadanos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  apellidos VARCHAR(150) NULL,
  telefono VARCHAR(30) NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  municipio VARCHAR(120) NULL,
  colonia VARCHAR(120) NULL,
  lat DOUBLE NULL,
  lng DOUBLE NULL,
  condicion_vulnerable VARCHAR(150) NULL,         -- adulto_mayor, discapacidad, ...
  contacto_nombre VARCHAR(150) NULL,              -- contacto de emergencia (grupo familiar)
  contacto_telefono VARCHAR(30) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ciu_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sos_reportes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ciudadano_id BIGINT NULL,                       -- null si se envio sin sesion
  usuario_id BIGINT NULL,
  nombre VARCHAR(150) NULL,
  telefono VARCHAR(30) NULL,
  lat DOUBLE NULL,
  lng DOUBLE NULL,
  municipio VARCHAR(120) NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'otro',        -- emergencia_medica | atrapado | incendio | inundacion | derrumbe | violencia | otro
  mensaje VARCHAR(500) NULL,
  origen VARCHAR(20) NOT NULL DEFAULT 'app',       -- app | dije
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',    -- activo | en_atencion | atendido | cancelado
  nota VARCHAR(500) NULL,
  atendido_por BIGINT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sos_ciudadano FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_sos_estado ON sos_reportes(estado);