import { useState, useEffect } from "react";
import {
  ShieldAlert,
  LayoutDashboard,
  BellPlus,
  Users,
  Package,
  Smartphone,
  CheckCircle2,
  XCircle,
  Zap,
  MapPin,
  Search,
  LogOut,
} from "lucide-react";
import MapView from "../components/MapView";
import { centrosAcopioPuebla, refugiosPuebla } from "../data/pueblaData";

const solicitudesIniciales = [
  {
    id: 101,
    nombre: "Valeria Sánchez Gómez",
    documento: "SAGV990314MPLRZN02",
    nacionalidad: "Mexicano",
    categoria: "Primeros auxilios",
    municipio: "Puebla Capital",
    estatus: "Pendiente",
  },
  {
    id: 102,
    nombre: "Lucas Fernández",
    documento: "PAS-AR-884920",
    nacionalidad: "Extranjero",
    categoria: "Tecnológico",
    municipio: "San Pedro Cholula",
    estatus: "Pendiente",
  },
  {
    id: 103,
    nombre: "Roberto Castillo Díaz",
    documento: "CADR951102HPLRZN08",
    nacionalidad: "Mexicano",
    categoria: "Brigadista",
    municipio: "Atlixco",
    estatus: "Activo",
  },
  {
    id: 104,
    nombre: "Dra. Elena Morales Ruiz",
    documento: "MORE880721MPLRZN01",
    nacionalidad: "Mexicano",
    categoria: "Primeros auxilios",
    municipio: "Puebla Capital",
    estatus: "Activo",
  },
];

const alertasFeedInicial = [
  {
    id: 1,
    tipo: "Volcán (Popocatépetl)",
    severidad: "Preventiva",
    zona: "San Pedro Benito Juárez / Cholula",
    hora: "Hace 15 min",
    estado: "Activa",
  },
  {
    id: 2,
    tipo: "Inundación / lluvias",
    severidad: "Alta",
    zona: "Río Atoyac y Sierra Norte",
    hora: "Hace 32 min",
    estado: "En atención",
  },
];

export default function PanelSecretaria({ onVolverMovil, onEmitirAlerta }) {
  const [autenticado, setAutenticado] = useState(false);
  const [correo, setCorreo] = useState("operador@proteccioncivil.puebla.gob.mx");
  const [password, setPassword] = useState("••••••••");
  const [rol, setRol] = useState("Administrador");

  const [vista, setVista] = useState("dashboard");
  const [voluntarios, setVoluntarios] = useState(solicitudesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [centros, setCentros] = useState(
    centrosAcopioPuebla.map((c) => ({ ...c, abierto: true }))
  );
  const [alertasFeed, setAlertasFeed] = useState(alertasFeedInicial);

  const [tipoAlerta, setTipoAlerta] = useState("Sismo");
  const [severidad, setSeveridad] = useState("critica");
  const [zona, setZona] = useState("Puebla Centro, Col. Centro Histórico");
  const [radioKm, setRadioKm] = useState(5);
  const [mensaje, setMensaje] = useState(
    "Mantén la calma. Si estás en zona de riesgo, resguárdate y evacúa al terminar el movimiento."
  );
  const [cuentaRegresiva, setCuentaRegresiva] = useState(null);

  useEffect(() => {
    if (cuentaRegresiva === null) return;
    if (cuentaRegresiva === 0) {
      setCuentaRegresiva(null);
      dispararAlerta({
        id: Date.now(),
        tipo: "Sismo",
        titulo: "ALERTA DE SISMO",
        severidad: "critica",
        estadoIncidente: "Activa",
        zona: "Puebla Centro, Col. Centro Histórico",
        puntoEncuentro: "Zócalo de Puebla · Módulo PC",
        lat: 19.0436,
        lng: -98.1981,
        distancia: "1.8 km",
        hora: "Justo ahora",
        instrucciones:
          "Simulación sísmica oficial. Mantén la calma, repliega en zona segura y confirma tu disponibilidad.",
        categoriasRequeridas: ["Primeros auxilios", "Evacuación", "Brigadista"],
        voluntariosConfirmados: 19,
      });
      return;
    }
    const timer = setTimeout(() => setCuentaRegresiva((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cuentaRegresiva]);

  const dispararAlerta = (nuevaAlerta) => {
    setAlertasFeed((prev) => [
      {
        id: nuevaAlerta.id,
        tipo: nuevaAlerta.tipo,
        severidad: nuevaAlerta.severidad.toUpperCase(),
        zona: nuevaAlerta.zona,
        hora: "Ahora",
        estado: "Activa",
      },
      ...prev,
    ]);
    onEmitirAlerta(nuevaAlerta);
  };

  const handleEmitirManual = (e) => {
    e.preventDefault();
    dispararAlerta({
      id: Date.now(),
      tipo: tipoAlerta,
      titulo: `ALERTA DE ${tipoAlerta.toUpperCase()}`,
      severidad,
      estadoIncidente: "Activa",
      zona,
      puntoEncuentro: `Módulo PC · ${zona}`,
      lat: 19.0436,
      lng: -98.1981,
      distancia: `${radioKm} km`,
      hora: "Justo ahora",
      instrucciones: mensaje,
      categoriasRequeridas: ["Primeros auxilios", "Evacuación", "Comunicación"],
      voluntariosConfirmados: 12,
    });
  };

  const cambiarEstatusVoluntario = (id, nuevoEstatus) => {
    setVoluntarios((prev) =>
      prev.map((v) => (v.id === id ? { ...v, estatus: nuevoEstatus } : v))
    );
  };

  const toggleCentro = (id) => {
    setCentros((prev) =>
      prev.map((c) => (c.id === id ? { ...c, abierto: !c.abierto } : c))
    );
  };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-guinda">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  SECIHTI · Protección Civil Puebla
                </p>
                <h1 className="text-lg font-bold text-gray-900">Panel Web Secretaría</h1>
              </div>
            </div>
            <button
              onClick={onVolverMovil}
              className="text-xs font-bold text-gray-500 hover:text-guinda flex items-center gap-1"
            >
              <Smartphone className="w-4 h-4" />
              <span>App Móvil</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAutenticado(true);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo institucional
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rol de acceso
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-guinda"
              >
                <option value="Operador">Operador de Monitoreo</option>
                <option value="Administrador">Administrador Estatal</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-guinda hover:bg-guindaDark text-white font-bold py-3 rounded-xl text-xs transition mt-2"
            >
              Ingresar al Centro de Mando
            </button>
          </form>
        </div>
      </div>
    );
  }

  const voluntariosFiltrados = voluntarios.filter(
    (v) =>
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.municipio.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const activosCount = voluntarios.filter((v) => v.estatus === "Activo").length;
  const pendientesCount = voluntarios.filter((v) => v.estatus === "Pendiente").length;
  const centrosAbiertos = centros.filter((c) => c.abierto).length;

  return (
    <div className="min-h-screen bg-fondo flex flex-col">
      <header className="bg-guinda text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-white" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold">
              Centro de Mando · Estado de Puebla ({rol})
            </p>
            <h1 className="text-base font-bold leading-tight">
              Sistema Web de Emergencias
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onVolverMovil}
            className="flex items-center gap-1.5 bg-white text-guinda hover:bg-gray-100 text-xs font-bold px-3 py-2 rounded-lg transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Ver App Móvil</span>
          </button>
          <button
            onClick={() => setAutenticado(false)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        <nav className="flex flex-wrap gap-2">
          {[
            { id: "dashboard", label: "Dashboard y Mapa", icon: LayoutDashboard },
            { id: "emitir", label: "Emitir / Simular Alerta", icon: BellPlus },
            {
              id: "voluntarios",
              label: `Voluntarios (${pendientesCount} pendientes)`,
              icon: Users,
            },
            { id: "centros", label: "Centros de Acopio", icon: Package },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setVista(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                  vista === item.id
                    ? "bg-guinda text-white border-guinda shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {vista === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Alertas Activas</p>
                <p className="text-2xl font-black text-red-700 mt-1">{alertasFeed.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Voluntarios Activos</p>
                <p className="text-2xl font-black text-guinda mt-1">{activosCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Solicitudes Pendientes</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{pendientesCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold">Centros Abiertos</p>
                <p className="text-2xl font-black text-green-700 mt-1">
                  {centrosAbiertos} / {centros.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900">
                    Mapa Operativo · Refugios y Centros en Puebla
                  </h2>
                  <span className="text-xs text-gray-500">En tiempo real</span>
                </div>
                <MapView
                  puntos={[...refugiosPuebla, ...centrosAcopioPuebla]}
                  seleccionado={refugiosPuebla[0]}
                  onSelect={() => {}}
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900">Feed de Alertas</h2>
                  <button
                    onClick={() => setVista("emitir")}
                    className="text-xs font-bold text-red-700 hover:underline"
                  >
                    + Nueva
                  </button>
                </div>

                <div className="space-y-2.5">
                  {alertasFeed.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="p-3 rounded-lg bg-fondo border border-gray-200 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900">{alerta.tipo}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {alerta.severidad}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-guinda" />
                        {alerta.zona}
                      </p>
                      <div className="flex justify-between text-[10px] text-gray-500 pt-1">
                        <span>Estado: {alerta.estado}</span>
                        <span>{alerta.hora}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "emitir" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleEmitirManual}
              className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4"
            >
              <h2 className="text-sm font-bold text-gray-900">
                Emitir Alerta Oficial a Voluntarios
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de alerta
                  </label>
                  <select
                    value={tipoAlerta}
                    onChange={(e) => setTipoAlerta(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="Sismo">Sismo</option>
                    <option value="Volcán (Popocatépetl)">Volcán (Popocatépetl)</option>
                    <option value="Inundación / lluvias">Inundación / lluvias</option>
                    <option value="Incendio forestal">Incendio forestal</option>
                    <option value="Deslave">Deslave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Severidad
                  </label>
                  <select
                    value={severidad}
                    onChange={(e) => setSeveridad(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="critica">Crítica (Rojo)</option>
                    <option value="alta">Alta (Naranja)</option>
                    <option value="preventiva">Preventiva (Amarillo)</option>
                    <option value="informativa">Informativa (Verde)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Municipio y colonia
                  </label>
                  <input
                    type="text"
                    required
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Radio de afectación: {radioKm} km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={radioKm}
                    onChange={(e) => setRadioKm(Number(e.target.value))}
                    className="w-full accent-guinda mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Instrucciones para voluntarios
                </label>
                <textarea
                  rows={3}
                  required
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                Emitir Alerta y Enviar a App Móvil
              </button>
            </form>

            <div className="bg-guinda text-white rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">
                  Modo Demostración · Hackathon
                </span>
                <h3 className="text-base font-bold">Simulador de Sismo</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Inicia una cuenta regresiva de 10 segundos y dispara automáticamente la pantalla de alerta crítica en la App Móvil.
                </p>
              </div>

              {cuentaRegresiva !== null ? (
                <div className="bg-red-700 rounded-xl p-6 text-center space-y-1 animate-pulse">
                  <p className="text-xs uppercase font-bold">Emitiendo alerta en</p>
                  <p className="text-5xl font-black font-mono">{cuentaRegresiva}s</p>
                </div>
              ) : (
                <button
                  onClick={() => setCuentaRegresiva(10)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-guinda hover:bg-gray-100 font-black py-3.5 rounded-xl text-xs transition"
                >
                  <Zap className="w-4 h-4 text-red-700" />
                  <span>Simular Sismo (10 s)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {vista === "voluntarios" && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gray-900">
                Padrón y Solicitudes de Voluntariado
              </h2>
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, municipio..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">CURP / Documento</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Municipio</th>
                    <th className="py-2.5 px-3">Estatus</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {voluntariosFiltrados.map((v) => (
                    <tr key={v.id} className="hover:bg-fondo/60">
                      <td className="py-3 px-3 font-bold text-gray-900">{v.nombre}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                        {v.documento}
                        <span className="block text-[10px] font-sans text-gray-400">
                          {v.nacionalidad}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-700">{v.categoria}</td>
                      <td className="py-3 px-3 text-gray-700">{v.municipio}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            v.estatus === "Activo"
                              ? "bg-green-50 text-green-800 border border-green-200"
                              : v.estatus === "Rechazado"
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {v.estatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {v.estatus === "Pendiente" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => cambiarEstatusVoluntario(v.id, "Activo")}
                              className="inline-flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => cambiarEstatusVoluntario(v.id, "Rechazado")}
                              className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">Gestionado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {vista === "centros" && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">
              Control de Centros de Acopio · Puebla
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {centros.map((centro) => (
                <div
                  key={centro.id}
                  className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{centro.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{centro.direccion}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Horario: {centro.horario} · Tel: {centro.telefono}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleCentro(centro.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                      centro.abierto
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {centro.abierto ? "Abierto" : "Cerrado"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}