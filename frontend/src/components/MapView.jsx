import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

const createPinIcon = (selected, color) =>
  L.divIcon({
    className: "custom-pin",
    html: `<div style="
      width: ${selected ? "22px" : "16px"};
      height: ${selected ? "22px" : "16px"};
      background: ${color || (selected ? "#423b30" : "#691C32")};
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: selected ? [22, 22] : [16, 16],
    iconAnchor: selected ? [11, 11] : [8, 8],
  });

const valido = (n) => typeof n === "number" && Number.isFinite(n);

/**
 * Mueve el mapa: al lugar seleccionado (una zona se encuadra completa con su radio), a la
 * ubicación de la persona, o, si no hay ninguno, encuadra todos los lugares visibles.
 */
function MapController({ center, radioM, limites, claveLimites }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    if (valido(radioM) && radioM > 0) {
      map.flyToBounds(L.latLng(center[0], center[1]).toBounds(radioM * 2.4), { duration: 0.7, maxZoom: 15 });
    } else {
      map.flyTo(center, 13, { duration: 0.7 });
    }
  }, [center?.[0], center?.[1], radioM, map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (center || !limites.length) return;
    if (limites.length === 1) map.setView(limites[0], 13);
    else map.fitBounds(limites, { padding: [28, 28], maxZoom: 13 });
  }, [claveLimites, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Clic en el mapa -> coordenadas (para marcar la ubicación de un lugar en el panel). */
function ClicEnMapa({ onClic }) {
  useMapEvents({ click: (e) => onClic({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/**
 * Mapa de puntos (refugios, centros) con opción de:
 *  - zonas: círculos de riesgo [{ id, lat, lng, radioM, color, nombre }]
 *  - ubicacion: la posición de la persona (punto azul)
 *  - onMapClick: recibe { lat, lng } al hacer clic en el mapa
 */
export default function MapView({ puntos, seleccionado, onSelect, zonas = [], ubicacion, onMapClick, alto }) {
  const centroInicial = [19.0414, -98.2063];
  // sólo se dibuja lo que tiene coordenadas (y radio, en las zonas): un dato incompleto no tumba el mapa
  const puntosOk = puntos.filter((p) => valido(p.lat) && valido(p.lng));
  const zonasOk = zonas.filter((z) => valido(z.lat) && valido(z.lng) && valido(Number(z.radioM)) && Number(z.radioM) > 0);

  const centroActivo =
    seleccionado && valido(seleccionado.lat) && valido(seleccionado.lng)
      ? [seleccionado.lat, seleccionado.lng]
      : ubicacion?.lat != null
      ? [ubicacion.lat, ubicacion.lng]
      : null;
  const radioSeleccion = seleccionado ? Number(seleccionado.radioM) : undefined;
  const limites = [...puntosOk, ...zonasOk].map((x) => [x.lat, x.lng]);
  const claveLimites = [...puntosOk, ...zonasOk].map((x) => x.id).join(",");

  return (
    <div className={`w-full ${alto || "h-56 md:h-72 lg:h-96"} rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-10 ${onMapClick ? "cursor-crosshair" : ""}`}>
      <MapContainer
        center={centroInicial}
        zoom={11}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController
          center={centroActivo}
          radioM={radioSeleccion}
          limites={limites}
          claveLimites={claveLimites}
        />
        {onMapClick && <ClicEnMapa onClic={onMapClick} />}

        {zonasOk.map((z) => (
          <Circle
            key={z.id}
            center={[z.lat, z.lng]}
            radius={Number(z.radioM)}
            pathOptions={{
              color: z.color,
              fillColor: z.color,
              fillOpacity: seleccionado?.id === z.id ? 0.3 : 0.15,
              weight: seleccionado?.id === z.id ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(z) }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-guinda">{z.nombre}</p>
                <p className="text-gray-600 mt-0.5">{z.localidad}, {z.municipio}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {puntosOk.map((punto) => (
          <Marker
            key={punto.id}
            position={[punto.lat, punto.lng]}
            icon={createPinIcon(seleccionado?.id === punto.id, punto.color)}
            eventHandlers={{
              click: () => onSelect(punto),
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-guinda">{punto.nombre}</p>
                <p className="text-gray-600 mt-0.5">{punto.direccion}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {ubicacion?.lat != null && (
          <CircleMarker
            center={[ubicacion.lat, ubicacion.lng]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
          >
            <Popup>
              <p className="text-xs font-semibold">Tu ubicación</p>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
