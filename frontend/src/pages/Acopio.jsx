import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Clock,
  Navigation,
  Utensils,
  Package,
  Coins,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { catalogoAportaciones } from "../data/pueblaData";
import MapView from "../components/MapView";
import ListaPorLocalidad, { textoDistancia } from "../components/ListaPorLocalidad";
import { ubicarLugar, aplicarFiltro, distanciaKm } from "../data/localidades";
import { api } from "../api/client";
import { PRIORIDADES } from "../api/mapeos";

const estiloPrioridad = {
  urgente: "bg-red-50 text-red-800 border-red-200",
  normal: "bg-fondo text-gray-700 border-gray-200",
  suficiente: "bg-green-50 text-green-800 border-green-200",
};

export default function Acopio({ filtro, ubicacion, onVerTodo }) {
  const [centrosAcopioPuebla, setCentros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [centroSeleccionado, setCentroSeleccionado] = useState(null);

  useEffect(() => {
    api
      .centros()
      .then((lista) => {
        // cada centro se ubica en su municipio y su localidad (la más cercana a sus coordenadas)
        const ubicados = lista.map((c) =>
          ubicarLugar({ ...c, necesidadesTexto: c.necesidades.map((n) => n.item).join(" ") })
        );
        setCentros(ubicados);
        setCentroSeleccionado(ubicados.find((c) => c.abierto) || ubicados[0] || null);
      })
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, []);
  const centrosFiltrados = useMemo(
    () => aplicarFiltro(centrosAcopioPuebla, filtro, ["necesidadesTexto"]),
    [centrosAcopioPuebla, filtro]
  );
  // centro activo: el elegido si sigue en el filtro; si no, el más cercano de los filtrados
  const cercanoFiltrado =
    ubicacion?.estado === "ok"
      ? [...centrosFiltrados].sort((a, b) => distanciaKm(ubicacion, a) - distanciaKm(ubicacion, b))[0]
      : centrosFiltrados[0];
  const centroActivo =
    centrosFiltrados.find((c) => c.id === centroSeleccionado?.id) || cercanoFiltrado || centroSeleccionado;
  const [tipoAporte, setTipoAporte] = useState("comida");
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
  const [monto, setMonto] = useState("200");
  const [nombreDonante, setNombreDonante] = useState("");
  const [confirmacion, setConfirmacion] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const clabeOficial = "0126 5000 1192 8473 05";

  const toggleItem = (item) => {
    setItemsSeleccionados((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const copiarClabe = () => {
    navigator.clipboard?.writeText(clabeOficial.replace(/\s/g, ""));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const registrarAportacion = (e) => {
    e.preventDefault();
    const folio = `PUE-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmacion({
      folio,
      tipo: tipoAporte,
      centro: centroActivo.nombre,
      detalle:
        tipoAporte === "monetario"
          ? `$${monto} MXN (Fondo de Contingencia Puebla)`
          : itemsSeleccionados.join(", "),
    });
    setItemsSeleccionados([]);
    setNombreDonante("");
  };

  if (cargando || errorCarga || !centroSeleccionado) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-xs text-gray-600">
        {cargando
          ? "Cargando centros de acopio..."
          : errorCarga
          ? `No se pudieron cargar los centros de acopio: ${errorCarga}`
          : "Aún no hay centros de acopio registrados."}
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
      <div className="space-y-5">
      <MapView
        puntos={centrosFiltrados}
        seleccionado={centrosFiltrados.length ? centroActivo : null}
        onSelect={setCentroSeleccionado}
        ubicacion={ubicacion}
      />

      <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">¿Cómo deseas aportar?</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Selecciona el tipo de apoyo y el centro de acopio donde entregarás.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setTipoAporte("comida");
              setItemsSeleccionados([]);
              setConfirmacion(null);
            }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition ${
              tipoAporte === "comida"
                ? "bg-guinda text-white border-guinda"
                : "bg-fondo text-gray-700 border-gray-200"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Comida</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipoAporte("materiales");
              setItemsSeleccionados([]);
              setConfirmacion(null);
            }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition ${
              tipoAporte === "materiales"
                ? "bg-guinda text-white border-guinda"
                : "bg-fondo text-gray-700 border-gray-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Materiales</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipoAporte("monetario");
              setConfirmacion(null);
            }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition ${
              tipoAporte === "monetario"
                ? "bg-guinda text-white border-guinda"
                : "bg-fondo text-gray-700 border-gray-200"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Monetario</span>
          </button>
        </div>

        {confirmacion ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Aportación registrada · Folio {confirmacion.folio}</span>
            </div>
            <p className="text-xs text-green-900">
              <strong>Destino:</strong> {confirmacion.centro}
            </p>
            <p className="text-xs text-green-900">
              <strong>Detalle:</strong> {confirmacion.detalle}
            </p>
            <button
              onClick={() => setConfirmacion(null)}
              className="text-xs font-bold text-guinda underline pt-1"
            >
              Registrar otra aportación
            </button>
          </div>
        ) : (
          <form onSubmit={registrarAportacion} className="space-y-3">
            {tipoAporte !== "monetario" ? (
              <>
                <div className="bg-fondo rounded-lg p-2.5 border border-gray-200 text-xs">
                  <span className="text-gray-500">Entregar en: </span>
                  <strong className="text-guinda">{centroActivo.nombre}</strong>
                </div>

                <div className="flex flex-wrap gap-2">
                  {catalogoAportaciones[tipoAporte].map((item) => {
                    const activo = itemsSeleccionados.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleItem(item)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition text-left ${
                          activo
                            ? "bg-guinda/10 border-guinda text-guinda font-semibold"
                            : "bg-white border-gray-200 text-gray-700"
                        }`}
                      >
                        {activo ? "✓ " : "+ "}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {["100", "200", "500", "1000"].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setMonto(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition ${
                        monto === val
                          ? "bg-guinda text-white border-guinda"
                          : "bg-white text-gray-700 border-gray-200"
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="10"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Otro monto (MXN)"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />

                <div className="bg-fondo border border-gray-200 rounded-lg p-3 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase text-gray-600">
                    Cuenta Oficial · Cruz Roja / DIF Puebla
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-gray-900">
                      CLABE: {clabeOficial}
                    </span>
                    <button
                      type="button"
                      onClick={copiarClabe}
                      className="flex items-center gap-1 text-[11px] font-semibold text-guinda bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiado ? "Copiada" : "Copiar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              type="text"
              required
              value={nombreDonante}
              onChange={(e) => setNombreDonante(e.target.value)}
              placeholder="Tu nombre (para control de entrega)"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />

            <button
              type="submit"
              disabled={tipoAporte !== "monetario" && itemsSeleccionados.length === 0}
              className="w-full bg-guinda hover:bg-guindaDark disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              {tipoAporte === "monetario"
                ? `Registrar Donativo de $${monto || 0} MXN`
                : `Confirmar Entrega (${itemsSeleccionados.length} seleccionados)`}
            </button>
          </form>
        )}
      </section>

      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
          Centros de acopio ({centrosFiltrados.length})
        </h2>

        <ListaPorLocalidad
          items={centrosFiltrados}
          ubicacion={ubicacion}
          vacio={
            <>
              No hay centros de acopio con este filtro.{" "}
              <button onClick={onVerTodo} className="font-bold text-guinda underline">
                Ver todo el estado
              </button>
            </>
          }
          render={(centro) => {
            const esActivo = centroActivo.id === centro.id;
            return (
              <div
                key={centro.id}
                onClick={() => setCentroSeleccionado(centro)}
                className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition ${
                  esActivo ? "border-guinda ring-1 ring-guinda/30" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                  {centro.distanciaKm != null && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-dorado">
                      {textoDistancia(centro.distanciaKm)} de ti
                    </span>
                  )}
                  <h3 className="font-bold text-gray-900 text-sm">{centro.nombre}</h3>
                </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      centro.abierto
                        ? "bg-green-50 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {centro.abierto ? "Abierto" : "Cerrado"}
                  </span>
                </div>
  
                <p className="text-xs text-gray-600 mt-1 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-guinda shrink-0 mt-0.5" />
                  <span>{centro.direccion}</span>
                </p>
  
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-dorado" />
                  <span>Horario: {centro.horario}</span>
                </p>
  
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {centro.necesidades.map((nec) => (
                    <span
                      key={nec.id}
                      title={PRIORIDADES[nec.prioridad] || nec.prioridad}
                      className={`text-[10px] border px-2 py-0.5 rounded-md ${
                        estiloPrioridad[nec.prioridad] || estiloPrioridad.normal
                      }`}
                    >
                      {nec.item}
                      {nec.prioridad === "urgente" && " · Urgente"}
                    </span>
                  ))}
                </div>
  
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-end">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${centro.lat},${centro.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 bg-guinda hover:bg-guindaDark text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Ir al centro</span>
                  </a>
                </div>
              </div>
  
            );
          }}
        />
      </section>
    </div>
  );
}