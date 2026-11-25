import { MapPin } from "lucide-react";
import { distanciaKm } from "../data/localidades";

/** Texto corto de distancia: "a 850 m" / "a 3.2 km". */
export const textoDistancia = (km) =>
  km == null ? "" : km < 1 ? `a ${Math.round(km * 1000)} m` : `a ${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

/**
 * Agrupa los lugares por "Municipio · Localidad".
 * Con ubicación: las secciones y los lugares van del más cercano al más lejano, y la localidad de
 * la persona se marca como "Tu localidad". Sin ubicación: orden alfabético.
 */
export default function ListaPorLocalidad({ items, ubicacion, vacio, render }) {
  const conGps = ubicacion?.estado === "ok";
  const conDistancia = items.map((it) => ({
    ...it,
    distanciaKm: conGps && it.lat != null ? distanciaKm(ubicacion, it) : null,
  }));

  const grupos = new Map();
  for (const it of conDistancia) {
    const clave = `${it.municipio}|${it.localidad}`;
    if (!grupos.has(clave)) grupos.set(clave, { municipio: it.municipio, localidad: it.localidad, items: [] });
    grupos.get(clave).items.push(it);
  }
  const lista = [...grupos.values()].map((g) => ({
    ...g,
    items: conGps ? g.items.sort((a, b) => a.distanciaKm - b.distanciaKm) : g.items,
    cerca: conGps ? Math.min(...g.items.map((i) => i.distanciaKm)) : 0,
    mia: conGps && g.municipio === ubicacion.municipio && g.localidad === ubicacion.localidad,
  }));
  lista.sort((a, b) =>
    conGps
      ? Number(b.mia) - Number(a.mia) || a.cerca - b.cerca
      : a.municipio.localeCompare(b.municipio, "es") || a.localidad.localeCompare(b.localidad, "es")
  );

  if (lista.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-5 text-center text-xs text-gray-500">
        {vacio}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {lista.map((g) => (
        <section key={`${g.municipio}|${g.localidad}`} className="space-y-2.5">
          <header className="flex items-end justify-between gap-2 border-b border-gray-200 pb-1.5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dorado">{g.municipio}</p>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <MapPin className="w-3.5 h-3.5 text-guinda shrink-0" />
                <span className="truncate">{g.localidad}</span>
                {g.mia && (
                  <span className="text-[10px] font-bold bg-guinda text-white px-2 py-0.5 rounded-full shrink-0">
                    Tu localidad
                  </span>
                )}
              </h3>
            </div>
            <span className="text-[11px] text-gray-500 shrink-0">
              {g.items.length} {g.items.length === 1 ? "lugar" : "lugares"}
              {conGps && ` · ${textoDistancia(g.cerca)}`}
            </span>
          </header>
          <div className="space-y-3">{g.items.map((it) => render(it))}</div>
        </section>
      ))}
    </div>
  );
}
