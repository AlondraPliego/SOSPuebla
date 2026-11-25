-- Seed de prueba para Persona B mientras Persona A entrega el suyo
-- (ejecutar solo en ambiente local/demo)

INSERT INTO voluntarios (nombre, municipio, lat, lng, categorias, disponible, estatus_aprobacion) VALUES
('Ana Ramirez',   'Puebla',               19.0430, -98.1980, 'primeros_auxilios,medico_enfermeria', true, 'aprobado'),
('Luis Torres',   'Puebla',               19.0500, -98.2100, 'busqueda_rescate,traslado',           true, 'aprobado'),
('Maria Lopez',   'San Pedro Cholula',    19.0636, -98.3059, 'logistica_acopio,cocina',             true, 'aprobado'),
('Carlos Mendez', 'Atlixco',              18.9005, -98.4326, 'primeros_auxilios',                   true, 'aprobado'),
('Sofia Herrera', 'Tehuacan',             18.4618, -97.3927, 'apoyo_psicologico',                   true, 'aprobado'),
('Pedro Gomez',   'Puebla',               19.0300, -98.2200, 'comunicaciones',                      false,'aprobado');

-- Plan B de NASA: alerta de demo lista para autorizar en el pitch
INSERT INTO alertas (tipo, severidad, municipio, lat, lng, radio_km, estado, fuente, fuente_externa_id, mensaje)
VALUES ('incendio','preventiva','Puebla',19.05,-98.20,20,'pendiente','nasa_eonet','DEMO_001','Incendio de prueba (demo)');
