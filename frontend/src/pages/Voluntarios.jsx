import { useState, useEffect } from "react";
import { api } from "../api/client";
import { iniciarSesionApp } from "../components/MiCuenta";
import RadarDijes from "../components/RadarDijes";
import PuntoEncuentroVoluntario from "../components/PuntoEncuentroVoluntario";
import { MUNICIPIOS, etiquetaCategoria } from "../api/mapeos";
import {
  Flame,
  Shield,
  Eye,
  Stethoscope,
  Package,
  Users,
  Radio,
  Cpu,
  PawPrint,
  Sprout,
  CheckCircle2,
  ShieldCheck,
  Award,
  Trophy,
  FileBadge,
  X,
  LogOut,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

const categorias = [
  {
    id: "brigadista",
    titulo: "Brigadista",
    actividad: "Combate especializado del fuego",
    descripcion:
      "Apoyo en control de incendios urbanos o forestales, enfriamiento de zonas y soporte logístico a cuerpos de bomberos.",
    opcionesAporte: [
      "Soy bombero / brigadista capacitado",
      "Sé cómo actuar en caso de fuego",
      "Aporto mangueras, cubetas o palas",
      "Aporto extintores o equipo de protección",
    ],
    icon: Flame,
  },
  {
    id: "prevencion",
    titulo: "Prevención",
    actividad: "Reducción de riesgos",
    descripcion:
      "Limpieza preventiva, brechas cortafuego, detección de zonas vulnerables y orientación a vecinos antes de una contingencia.",
    opcionesAporte: [
      "Sé identificar riesgos en casa o colonia",
      "Puedo dar pláticas o repartir guías",
      "Aporto herramientas (machetes, rastrillos, costales)",
      "Aporto señalización o cinta de precaución",
    ],
    icon: Shield,
  },
  {
    id: "vigilancia",
    titulo: "Vigilancia",
    actividad: "Detección y reporte",
    descripcion:
      "Monitoreo constante de humo, crecida de ríos, caída de ceniza o deslaves para emitir reportes tempranos.",
    opcionesAporte: [
      "Vivo cerca de zona de riesgo y puedo reportar",
      "Hago recorridos preventivos en mi comunidad",
      "Cuento con binoculares, linternas o dron",
      "Tengo vehículo o moto para verificar puntos",
    ],
    icon: Eye,
  },
  {
    id: "primeros_auxilios",
    titulo: "Primeros auxilios",
    actividad: "Atención inicial",
    descripcion:
      "Valoración básica, curaciones menores, estabilización y acompañamiento en lo que llegan paramédicos.",
    opcionesAporte: [
      "Soy médico, enfermero o paramédico",
      "Tengo curso básico de primeros auxilios",
      "Aporto botiquín, gasas, vendas o alcohol",
      "Aporto camilla, collarín o suero oral",
    ],
    icon: Stethoscope,
  },
  {
    id: "abastecimiento",
    titulo: "Abastecimiento",
    actividad: "Distribución de suministros",
    descripcion:
      "Recepción, clasificación y entrega de agua, alimentos, cobijas y herramientas en refugios o zonas afectadas.",
    opcionesAporte: [
      "Puedo clasificar y armar despensas",
      "Tengo camioneta o auto para trasladar víveres",
      "Puedo preparar alimentos calientes",
      "Aporto cajas, bolsas o mesas de acopio",
    ],
    icon: Package,
  },
  {
    id: "evacuacion",
    titulo: "Evacuación",
    actividad: "Apoyo a la población",
    descripcion:
      "Guía de rutas seguras y traslado prioritario de niños, adultos mayores y personas con movilidad reducida.",
    opcionesAporte: [
      "Puedo guiar personas hacia refugios",
      "Tengo vehículo disponible para traslados",
      "Experiencia apoyando adultos mayores o discapacidad",
      "Aporto silla de ruedas, bastones o megáfono",
    ],
    icon: Users,
  },
  {
    id: "comunicacion",
    titulo: "Comunicación",
    actividad: "Coordinación y reportes",
    descripcion:
      "Enlace entre vecinos, brigadas y autoridades para evitar rumores y mantener información verificada.",
    opcionesAporte: [
      "Manejo de radios de dos vías (walkie-talkie)",
      "Difusión de alertas oficiales en redes locales",
      "Aporto radios, baterías externas o bocina",
      "Apoyo en traducción o lengua de señas",
    ],
    icon: Radio,
  },
  {
    id: "tecnologico",
    titulo: "Tecnológico",
    actividad: "GPS, mapas y datos",
    descripcion:
      "Mapeo de zonas afectadas, geolocalización de reportes, soporte de conectividad y análisis de alertas.",
    opcionesAporte: [
      "Sé usar GPS, mapas digitales o QGIS",
      "Soporte técnico en celulares y redes",
      "Cuento con internet satelital o router portátil",
      "Aporto laptop, powerbanks o panel solar",
    ],
    icon: Cpu,
  },
  {
    id: "rescate_animal",
    titulo: "Rescate animal",
    actividad: "Atención de fauna",
    descripcion:
      "Resguardo temporal, traslado y curación básica de mascotas, ganado o fauna silvestre afectada.",
    opcionesAporte: [
      "Soy veterinario o auxiliar veterinario",
      "Puedo dar hogar temporal a mascotas",
      "Aporto transportadoras, correas o jaulas",
      "Aporto croquetas, agua o botiquín veterinario",
    ],
    icon: PawPrint,
  },
  {
    id: "restauracion",
    titulo: "Restauración",
    actividad: "Recuperación ambiental",
    descripcion:
      "Limpieza posterior al desastre, retiro de ceniza o escombros y jornadas de reforestación en zonas dañadas.",
    opcionesAporte: [
      "Participación en brigadas de limpieza y reforestación",
      "Conocimiento en suelos, plantas o viveros",
      "Aporto palas, carretillas, escobas o costales",
      "Aporto árboles nativos o tierra preparada",
    ],
    icon: Sprout,
  },
];

const municipiosPuebla = [
  "Puebla Capital",
  "San Pedro Cholula",
  "San Andrés Cholula",
  "Atlixco",
  "Huauchinango",
  "Izúcar de Matamoros",
  "Tehuacán",
];

// Equivalencia entre los tipos de voluntariado de la app y las categorías del backend.
const categoriaBackend = {
  brigadista: "busqueda_rescate",
  prevencion: "otro",
  vigilancia: "comunicaciones",
  primeros_auxilios: "primeros_auxilios",
  abastecimiento: "logistica_acopio",
  evacuacion: "traslado",
  comunicacion: "comunicaciones",
  tecnologico: "comunicaciones",
  rescate_animal: "otro",
  restauracion: "otro",
};

const disponibilidadBackend = {
  Inmediata: "siempre",
  "Fines de semana": "fines_de_semana",
  "Solo en contingencia": "solo_criticas",
};

// "Puebla Capital" se guarda como "Puebla" (así lo usa el backend en sus datos)
const municipioBackend = (m) => (m === "Puebla Capital" ? "Puebla" : m);
const coordenadasMunicipio = (m) =>
  MUNICIPIOS.find((x) => x.nombre === municipioBackend(m)) || MUNICIPIOS[0];

/** Convierte el VoluntarioDto del backend al formato del gafete digital. */
function perfilParaGafete(v) {
  const [titulo, aportesTexto] = (v.experiencia || "").split(": ");
  return {
    id: v.id,
    nombre: [v.nombre, v.apellidos].filter(Boolean).join(" "),
    curp: v.extranjero ? `${v.tipo_documento || "Documento"} ${v.numero_documento || ""}` : v.curp || "—",
    categoria: aportesTexto !== undefined ? titulo : (v.categorias || []).map(etiquetaCategoria).join(", "),
    aportes: aportesTexto ? aportesTexto.split(" · ") : [],
    municipio: v.municipio,
    lat: v.lat,
    lng: v.lng,
    folio: `VOL-PUE-${String(v.id).padStart(4, "0")}`,
    estatus: v.estatus_aprobacion,
    disponible: v.disponible,
    apoyos: 0,
    horas: 0,
    nivel: "Voluntario Activo",
  };
}

const brigadasActivas = [
  {
    id: 1,
    titulo: "Clasificación de Víveres · DIF Puebla",
    zona: "Centro Histórico, Puebla Capital",
    horario: "Hoy · 10:00 a 14:00",
    area: "Abastecimiento",
  },
  {
    id: 2,
    titulo: "Monitoreo Preventivo · Río Atoyac",
    zona: "Zona Sur, Puebla Capital",
    horario: "Hoy · 15:00 a 18:00",
    area: "Vigilancia",
  },
  {
    id: 3,
    titulo: "Limpieza de Ceniza y Drenajes",
    zona: "San Pedro Cholula",
    horario: "Mañana · 09:00 a 13:00",
    area: "Prevención",
  },
];

const rankingInicial = [
  {
    id: 1,
    nombre: "Dra. Elena Morales Ruiz",
    categoria: "Primeros auxilios",
    municipio: "Puebla Capital",
    apoyos: 14,
    horas: 62,
    nivel: "Brigadista Oro",
    folio: "VOL-PUE-1042",
  },
  {
    id: 2,
    nombre: "Ing. Carlos Méndez Vázquez",
    categoria: "Tecnológico",
    municipio: "San Pedro Cholula",
    apoyos: 11,
    horas: 48,
    nivel: "Brigadista Plata",
    folio: "VOL-PUE-1185",
  },
  {
    id: 3,
    nombre: "Ana Sofía Paredes Cruz",
    categoria: "Evacuación",
    municipio: "Huauchinango",
    apoyos: 9,
    horas: 36,
    nivel: "Brigadista Bronce",
    folio: "VOL-PUE-1290",
  },
  {
    id: 4,
    nombre: "Luis Fernando Soto Díaz",
    categoria: "Brigadista",
    municipio: "Atlixco",
    apoyos: 6,
    horas: 24,
    nivel: "Voluntario Activo",
    folio: "VOL-PUE-1411",
  },
];

/**
 * Portal de voluntarios.
 *  - visitante / ciudadano: información y registro como voluntario (el inicio de sesión está en "Mi cuenta")
 *  - voluntario: gafete digital, disponibilidad, brigadas y reconocimientos
 */
export default function Voluntarios({ sesion, onSesion, onAbrirCuenta, modoInicial = "info" }) {
  const [sesionActiva, setSesionActiva] = useState(null);
  const [modoAcceso, setModoAcceso] = useState(modoInicial); // info | registro
  const esCiudadano = sesion?.rol === "ciudadano";
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [extranjero, setExtranjero] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState("Pasaporte");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [paisOrigen, setPaisOrigen] = useState("");

  const [tabPanel, setTabPanel] = useState("panel");
  const [brigadasConfirmadas, setBrigadasConfirmadas] = useState([]);

  const [categoriaId, setCategoriaId] = useState("brigadista");
  const [aportesSeleccionados, setAportesSeleccionados] = useState([]);
  const [otroAporte, setOtroAporte] = useState("");
  const [nombre, setNombre] = useState("");
  const [curp, setCurp] = useState("");
  const [telefono, setTelefono] = useState("");
  const [municipio, setMunicipio] = useState("Puebla Capital");
  const [disponibilidad, setDisponibilidad] = useState("Inmediata");

  const [ranking, setRanking] = useState(rankingInicial);
  const [constanciaActiva, setConstanciaActiva] = useState(null);

  const categoriaActiva = categorias.find((c) => c.id === categoriaId);

  const cambiarCategoria = (id) => {
    setCategoriaId(id);
    setAportesSeleccionados([]);
    setOtroAporte("");
  };

  const toggleAporte = (texto) => {
    setAportesSeleccionados((prev) =>
      prev.includes(texto) ? prev.filter((item) => item !== texto) : [...prev, texto]
    );
  };

  // Carga el perfil real del voluntario cuando hay sesión guardada
  const voluntarioId = sesion?.rol === "voluntario" ? sesion.voluntario_id ?? null : null;
  useEffect(() => {
    if (voluntarioId == null) {
      setSesionActiva(null);
      return;
    }
    let vigente = true;
    api
      .voluntario(voluntarioId)
      .then((v) => vigente && setSesionActiva(perfilParaGafete(v)))
      .catch((e) => {
        if (!vigente) return;
        setError(e.message);
        if (e.status === 401 || e.status === 403 || e.status === 404) onSesion(null);
      });
    return () => {
      vigente = false;
    };
  }, [voluntarioId]);

  // tras registrarse, entra con la nueva cuenta de voluntario
  const entrar = async (identificador, pass, nombreCompleto) => {
    const r = await iniciarSesionApp(identificador, pass);
    onSesion({ ...r, nombre: nombreCompleto });
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");
    const listaAportes = otroAporte.trim()
      ? [...aportesSeleccionados, otroAporte.trim()]
      : aportesSeleccionados;
    const coords = coordenadasMunicipio(municipio);

    const datos = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      telefono,
      correo: correo.trim(),
      password,
      extranjero,
      curp: extranjero ? null : curp.toUpperCase(),
      tipo_documento: extranjero ? tipoDocumento : null,
      numero_documento: extranjero ? numeroDocumento.trim() : null,
      pais_origen: extranjero ? paisOrigen.trim() : null,
      municipio: municipioBackend(municipio),
      lat: coords.lat,
      lng: coords.lng,
      categorias: [categoriaBackend[categoriaId] || "otro"],
      experiencia: `${categoriaActiva.titulo}: ${listaAportes.join(" · ")}`,
      disponibilidad: disponibilidadBackend[disponibilidad] || "siempre",
    };

    setCargando(true);
    try {
      const v = await api.registrarVoluntario(datos);
      setRanking((prev) => [...prev, { ...perfilParaGafete(v), apoyos: 1, horas: 4, nivel: "Nuevo Brigadista" }]);
      await entrar(datos.correo, password, `${datos.nombre} ${datos.apellidos}`.trim());
      setTabPanel("panel");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cambiarDisponible = async () => {
    if (!sesionActiva) return;
    try {
      const v = await api.disponibilidadVoluntario(sesionActiva.id, !sesionActiva.disponible);
      setSesionActiva(perfilParaGafete(v));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleBrigada = (id) => {
    setBrigadasConfirmadas((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const cerrarSesion = () => {
    onSesion(null);
    setSesionActiva(null);
    setModoAcceso("info");
    setError("");
  };

  const avisoError = error && (
    <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg px-3 py-2">
      {error}
    </div>
  );

  if (voluntarioId != null && !sesionActiva) {
    return (
      <div className="space-y-3">
        {avisoError}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-xs text-gray-600">
          Cargando tu perfil de voluntario...
        </div>
        <button onClick={cerrarSesion} className="text-xs font-bold text-guinda hover:underline">
          Cerrar sesión
        </button>
      </div>
    );
  }

  if (!sesionActiva && modoAcceso === "info") {
    return (
      <div className="space-y-4 md:max-w-3xl md:mx-auto">
        <div className="bg-guinda text-white rounded-2xl p-5 md:p-7 shadow-sm space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Brigadas Puebla · Voluntariado
          </p>
          <h2 className="text-lg md:text-2xl font-bold">Súmate como voluntario</h2>
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
            Recibe alertas cercanas a tu ubicación, confirma tu apoyo en emergencias, únete a brigadas y obtén tu gafete digital y reconocimientos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => {
                setError("");
                setModoAcceso("registro");
              }}
              className="flex-1 bg-white text-guinda hover:bg-gray-100 font-bold py-3 rounded-xl text-xs transition"
            >
              Quiero ser voluntario
            </button>
            {!sesion && (
              <button
                onClick={onAbrirCuenta}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                Ya soy voluntario · Iniciar sesión
              </button>
            )}
          </div>
        </div>

        {esCiudadano && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 leading-relaxed">
            Tienes una cuenta ciudadana. El gafete, las brigadas y la confirmación de alertas son exclusivos de voluntarios aprobados por Protección Civil. Para participar, regístrate como voluntario con otro correo.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {categorias.slice(0, 8).map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <Icon className="w-4 h-4 text-guinda" />
                <p className="text-xs font-bold text-gray-900 mt-1.5 leading-tight">{cat.titulo}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{cat.actividad}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!sesionActiva && modoAcceso === "registro") {
    return (
      <form onSubmit={handleRegistro} className="space-y-4 md:max-w-3xl md:mx-auto">
        {esCiudadano && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3">
            Usa un correo distinto al de tu cuenta ciudadana. Al terminar entrarás con tu nueva cuenta de voluntario.
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setError("");
            setModoAcceso("info");
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-guinda hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
            1. Selecciona tu tipo de voluntariado
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categorias.map((cat) => {
              const Icon = cat.icon;
              const activa = categoriaId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => cambiarCategoria(cat.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition ${
                    activa
                      ? "bg-guinda text-white border-guinda shadow-sm"
                      : "bg-white text-gray-800 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      activa ? "text-white" : "text-guinda"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight">{cat.titulo}</p>
                    <p
                      className={`text-[10px] mt-0.5 leading-snug ${
                        activa ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {cat.actividad}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-dorado">
              En qué consiste · {categoriaActiva.titulo}
            </span>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed">
              {categoriaActiva.descripcion}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-xs font-bold text-gray-900">
              ¿Cómo puedes apoyar? (Conocimientos o materiales)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categoriaActiva.opcionesAporte.map((opcion) => {
                const marcada = aportesSeleccionados.includes(opcion);
                return (
                  <button
                    type="button"
                    key={opcion}
                    onClick={() => toggleAporte(opcion)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left transition ${
                      marcada
                        ? "bg-guinda text-white border-guinda font-semibold"
                        : "bg-fondo text-gray-700 border-gray-200"
                    }`}
                  >
                    {marcada ? "✓ " : "+ "}
                    {opcion}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={otroAporte}
              onChange={(e) => setOtroAporte(e.target.value)}
              placeholder="Otro material o habilidad que puedas aportar (opcional)"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
            2. Datos de Contacto
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nombre(s)
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. María"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Apellidos
            </label>
            <input
              type="text"
              required
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Ej. López Hernández"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={extranjero}
              onChange={(e) => setExtranjero(e.target.checked)}
              className="accent-guinda"
            />
            <span>Soy extranjero (no tengo CURP)</span>
          </label>

          {extranjero ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Documento
                </label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-guinda"
                >
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Tarjeta de residente">Tarjeta de residente</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  required
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  País de origen
                </label>
                <input
                  type="text"
                  value={paisOrigen}
                  onChange={(e) => setPaisOrigen(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
                />
              </div>
            </div>
          ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              CURP (18 caracteres)
            </label>
            <input
              type="text"
              required
              minLength={18}
              maxLength={18}
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
              placeholder="Ej. LOHM980512MPLRZN04"
              className="w-full px-3 py-2 text-xs uppercase font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />
          </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ej. maria@correo.com"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Contraseña (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 222 123 4567"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-guinda"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Municipio
              </label>
              <select
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-guinda"
              >
                {municipiosPuebla.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Disponibilidad
              </label>
              <select
                value={disponibilidad}
                onChange={(e) => setDisponibilidad(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-guinda"
              >
                <option value="Inmediata">Inmediata</option>
                <option value="Fines de semana">Fines de semana</option>
                <option value="Solo en contingencia">Solo en contingencia</option>
              </select>
            </div>
          </div>

          {avisoError}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-guinda hover:bg-guindaDark disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-xs transition mt-2"
          >
            {cargando ? "Registrando..." : "Completar Registro y Entrar al Panel"}
          </button>
        </section>
      </form>
    );
  }

  return (
    <div className="space-y-4 md:max-w-3xl md:mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <button
            onClick={() => setTabPanel("panel")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition ${
              tabPanel === "panel"
                ? "bg-guinda text-white border-guinda"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Mi Panel</span>
          </button>

          <button
            onClick={() => setTabPanel("ranking")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition ${
              tabPanel === "ranking"
                ? "bg-guinda text-white border-guinda"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Reconocimientos</span>
          </button>
        </div>

        <button
          onClick={cerrarSesion}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-red-700 transition"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {tabPanel === "panel" && (
        <div className="space-y-4">
          <div className="bg-guinda text-white rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <span className="text-[11px] uppercase tracking-wider text-gray-300 font-semibold">
                Gafete Digital · Brigada Puebla
              </span>
              <ShieldCheck className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-base font-bold">{sesionActiva.nombre}</p>
            <p className="text-[11px] font-mono text-gray-300">CURP: {sesionActiva.curp}</p>
            <p className="text-xs text-gray-200">Categoría: {sesionActiva.categoria}</p>
            {sesionActiva.aportes?.length > 0 && (
              <p className="text-[11px] text-gray-300">
                Aporte: {sesionActiva.aportes.join(" · ")}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-gray-300">
              <span>Municipio: {sesionActiva.municipio}</span>
              <span>Folio: {sesionActiva.folio}</span>
            </div>
          </div>

          {avisoError}

          {sesionActiva.estatus !== "aprobado" && (
            <div
              className={`rounded-xl p-3 text-xs border ${
                sesionActiva.estatus === "rechazado"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {sesionActiva.estatus === "rechazado"
                ? "Tu solicitud de voluntariado fue rechazada por Protección Civil."
                : "Tu registro está en revisión. Recibirás alertas cuando Protección Civil apruebe tu solicitud."}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-gray-900">Disponible para alertas</p>
              <p className="text-[11px] text-gray-500">
                {sesionActiva.disponible
                  ? "Recibirás alertas cercanas a tu ubicación."
                  : "No recibirás alertas mientras esté desactivado."}
              </p>
            </div>
            <button
              onClick={cambiarDisponible}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                sesionActiva.disponible ? "bg-green-700 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {sesionActiva.disponible ? "Disponible" : "No disponible"}
            </button>
          </div>

          <PuntoEncuentroVoluntario
            municipio={sesionActiva.municipio}
            lat={sesionActiva.lat}
            lng={sesionActiva.lng}
          />

          {sesionActiva.estatus === "aprobado" ? (
            <RadarDijes />
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-4 text-[11px] text-gray-500">
              El <strong>radar de dijes</strong> (localizar personas con señal SOS en morse) se habilita cuando Protección Civil aprueba tu registro.
            </div>
          )}

          <section className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
              Brigadas Activas Disponibles
            </h3>

            {brigadasActivas.map((brigada) => {
              const confirmada = brigadasConfirmadas.includes(brigada.id);
              return (
                <div
                  key={brigada.id}
                  className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-dorado">
                        {brigada.area}
                      </span>
                      <p className="text-sm font-bold text-gray-900">{brigada.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{brigada.zona}</p>
                      <p className="text-[11px] text-gray-500">{brigada.horario}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBrigada(brigada.id)}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      confirmada
                        ? "bg-green-700 text-white"
                        : "bg-fondo text-guinda border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {confirmada && <CheckCircle2 className="w-4 h-4" />}
                    <span>{confirmada ? "Asistencia Confirmada" : "Unirme a esta brigada"}</span>
                  </button>
                </div>
              );
            })}
          </section>
        </div>
      )}

      {tabPanel === "ranking" && (
        <section className="space-y-3">
          <div className="bg-guinda text-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-300 text-xs font-bold uppercase tracking-wide">
              <Award className="w-4 h-4" />
              <span>Reconocimiento Ciudadano · Puebla</span>
            </div>
            <p className="text-xs text-gray-200 mt-1 leading-relaxed">
              Padrón de ciudadanos que han apoyado en contingencias, centros de acopio y brigadas comunitarias.
            </p>
          </div>

          <div className="space-y-2.5">
            {ranking.map((persona, index) => (
              <div
                key={persona.id}
                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      index === 0
                        ? "bg-guinda text-white"
                        : index === 1
                        ? "bg-gray-500 text-white"
                        : index === 2
                        ? "bg-gray-400 text-white"
                        : "bg-fondo text-guinda border border-gray-200"
                    }`}
                  >
                    #{index + 1}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      {persona.nombre}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {persona.categoria} · {persona.municipio}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold bg-fondo text-guinda border border-gray-200 px-2 py-0.5 rounded-md">
                        {persona.nivel}
                      </span>
                      <span className="text-[11px] text-gray-600">
                        {persona.apoyos} apoyos · {persona.horas} h
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setConstanciaActiva(persona)}
                  className="text-guinda hover:bg-fondo p-2 rounded-lg border border-gray-200 shrink-0 transition"
                  title="Ver constancia"
                >
                  <FileBadge className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {constanciaActiva && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl border-2 border-guinda relative">
            <button
              onClick={() => setConstanciaActiva(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 py-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Gobierno del Estado de Puebla · Protección Civil
              </p>
              <Award className="w-10 h-10 text-guinda mx-auto" />
              <h3 className="text-base font-bold text-gray-900">
                Reconocimiento al Voluntariado
              </h3>
              <p className="text-xs text-gray-500">Se otorga el presente reconocimiento a:</p>
              <p className="text-base font-bold text-guinda">{constanciaActiva.nombre}</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Por su valiosa participación en <strong>{constanciaActiva.categoria}</strong> con{" "}
                <strong>{constanciaActiva.apoyos} apoyos</strong> ({constanciaActiva.horas} horas) en{" "}
                {constanciaActiva.municipio}.
              </p>
              <div className="pt-3 border-t border-gray-100 flex justify-between text-[10px] text-gray-500">
                <span>Nivel: {constanciaActiva.nivel}</span>
                <span>Folio: {constanciaActiva.folio}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}