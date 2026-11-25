import { useEffect, useState } from "react";
import { Flag, Navigation, Phone } from "lucide-react";
import { api } from "../api/client";
import { distanciaKm } from "../data/localidades";
import { mismoMunicipio } from "../panel/alcance";
import { textoDistancia } from "./ListaPorLocalidad";

/**
 * Punto de encuentro designado por Protección Civil de su municipio. Se muestra en el panel del
 * voluntario ANTES de cualquier emergencia, para que ya sepa a dónde ir si recibe una alerta.
 */
export default function PuntoEncuentroVoluntario({ municipio, lat, lng }) {
  const [puntos, setPuntos] = useState(null);

  useEffect(() => {
    api
      .puntosEncuentro()
      .then(setPuntos)
      .catch(() => setPuntos([]));
  }, []);

  if (puntos === null) return null;

  const yo = lat != null && lng != null ? { lat, lng } : null;
  const conDistancia = puntos
    .filter((p) => p.activo)
    .map((p) => ({ ...p, km: yo ? distanciaKm(yo, p) : null }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  const deMiMunicipio = conDistancia.filter((p) => mismoMunicipio(p.municipio, municipio));
  const lista = deMiMunicipio.length ? deMiMunicipio : conDistancia.slice(0, 1);
  const [principal, ...otros] = lista;

  if (!principal) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-4 text-[11px] text-gray-500">
        Protección Civil de {municipio} aún no designa un punto de encuentro para voluntarios.
      </div>
    );
  }

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          <Flag className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-dorado">
            Tu punto de encuentro {deMiMunicipio.length ? `· ${principal.municipio}` : "más cercano"}
          </p>
          <p className="text-sm font-bold text-gray-900 leading-snug">{principal.nombre}</p>
          <p className="text-[11px] text-gray-500">
            {[principal.localidad, principal.direccion].filter(Boolean).join(" · ")}
            {principal.km != null && ` · ${textoDistancia(principal.km)} de tu ubicación registrada`}
          </p>
        </div>
      </div>

      {principal.indicaciones && (
        <p className="text-xs text-gray-700 bg-fondo rounded-xl px-3 py-2 leading-relaxed">{principal.indicaciones}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${principal.lat},${principal.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 bg-guinda hover:bg-guindaDark text-white text-xs font-bold px-3 py-2 rounded-lg transition"
        >
          <Navigation className="w-3.5 h-3.5" /> Cómo llegar
        </a>
        {principal.telefono && (
          <a
            href={`tel:${principal.telefono.replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-guinda"
          >
            <Phone className="w-3.5 h-3.5" /> {principal.responsable || "Responsable"} · {principal.telefono}
          </a>
        )}
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Si recibes una alerta, preséntate aquí con tu gafete digital. Ubícalo desde ahora para llegar rápido.
      </p>

      {otros.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-1">
          <p className="text-[11px] font-bold uppercase text-gray-600">Otros puntos en {principal.municipio}</p>
          {otros.slice(0, 3).map((p) => (
            <p key={p.id} className="text-[11px] text-gray-600">
              {p.nombre}
              {p.km != null && <span className="text-gray-400"> · {textoDistancia(p.km)}</span>}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
