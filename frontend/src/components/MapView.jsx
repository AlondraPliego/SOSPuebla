import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const createPinIcon = (selected) =>
  L.divIcon({
    className: "custom-pin",
    html: `<div style="
      width: ${selected ? "22px" : "16px"};
      height: ${selected ? "22px" : "16px"};
      background: ${selected ? "#423b30" : "#691C32"};
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: selected ? [22, 22] : [16, 16],
    iconAnchor: selected ? [11, 11] : [8, 8],
  });

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 0.7 });
    }
  }, [center, map]);
  return null;
}

export default function MapView({ puntos, seleccionado, onSelect }) {
  const centroInicial = [19.0414, -98.2063];
  const centroActivo = seleccionado ? [seleccionado.lat, seleccionado.lng] : null;

  return (
    <div className="w-full h-56 md:h-72 lg:h-96 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-10">
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
        <MapController center={centroActivo} />
        {puntos.map((punto) => (
          <Marker
            key={punto.id}
            position={[punto.lat, punto.lng]}
            icon={createPinIcon(seleccionado?.id === punto.id)}
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
      </MapContainer>
    </div>
  );
}