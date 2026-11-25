// Conexión Bluetooth (Web Bluetooth) con el "Dije Seguro" (XIAO ESP32-S3).
//
// Protocolo (texto en una sola característica, igual al firmware):
//   Dije -> app : "ALERTA" | "ALERTA,lat,lng"
//   App  -> dije: "OK"            confirma que la alerta llegó (vibra 3 veces)
//                 "VIBRAR"        vibra 2 veces
//                 "LED_ON" | "LED_OFF" | "LED"
//                 "SOS_LUZ"       NUEVO: el LED parpadea S-O-S en código morse (lo usa el voluntario)
//                 "SOS_LUZ_OFF"   NUEVO: detiene la señal morse
//                 "AVISO,<tipo>"  NUEVO: alerta oficial (sismo, incendio, inundacion, huracan) -> vibra
//
// Requisitos de Web Bluetooth: Chrome/Edge (Android, Windows, macOS, ChromeOS) y página en
// HTTPS o localhost. iPhone no lo soporta en Safari/Chrome (se puede usar el navegador "Bluefy").

export const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
export const CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

/** ¿Este navegador puede usar Bluetooth? Devuelve { ok, motivo }. */
export function bluetoothDisponible() {
  if (typeof navigator === "undefined" || !navigator.bluetooth) {
    const ios = /iPhone|iPad|iPod/i.test(navigator?.userAgent || "");
    return {
      ok: false,
      motivo: ios
        ? "iPhone no permite Bluetooth desde el navegador. Usa un teléfono Android con Chrome (o la app Bluefy en iPhone)."
        : "Este navegador no soporta Bluetooth. Usa Google Chrome en Android o en computadora.",
    };
  }
  if (!window.isSecureContext) {
    return {
      ok: false,
      motivo: "El Bluetooth sólo funciona si la página se abre con https:// o en localhost.",
    };
  }
  return { ok: true, motivo: "" };
}

const codificar = (t) => new TextEncoder().encode(t);
const decodificar = (dv) => new TextDecoder().decode(dv).trim();

/** Una conexión con un dije. El dueño mantiene una; el voluntario abre una por cada dije que localiza. */
export class ConexionDije {
  constructor(rol) {
    this.rol = rol; // "duenio" | "rescate"
    this.dispositivo = null;
    this.caracteristica = null;
    this.estado = "desconectado"; // desconectado | conectando | conectado
    this.oyentesEstado = new Set();
    this.oyentesMensaje = new Set();
    this._alDesconectar = () => this._cambiarEstado("desconectado");
  }

  get nombre() {
    return this.dispositivo?.name || "Dije";
  }
  get conectado() {
    return this.estado === "conectado";
  }

  onEstado(cb) {
    this.oyentesEstado.add(cb);
    return () => this.oyentesEstado.delete(cb);
  }
  onMensaje(cb) {
    this.oyentesMensaje.add(cb);
    return () => this.oyentesMensaje.delete(cb);
  }
  _cambiarEstado(e) {
    this.estado = e;
    if (e === "desconectado") this.caracteristica = null;
    this.oyentesEstado.forEach((cb) => cb(e));
  }

  /** Abre el selector del navegador (el "radar": lista los dijes cercanos) y se conecta. */
  async buscarYConectar() {
    const disp = bluetoothDisponible();
    if (!disp.ok) throw new Error(disp.motivo);
    const dispositivo = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }, { namePrefix: "Dije" }],
      optionalServices: [SERVICE_UUID],
    });
    await this.conectarA(dispositivo);
    return dispositivo;
  }

  async conectarA(dispositivo) {
    if (this.dispositivo && this.dispositivo !== dispositivo) {
      this.dispositivo.removeEventListener("gattserverdisconnected", this._alDesconectar);
    }
    this.dispositivo = dispositivo;
    dispositivo.addEventListener("gattserverdisconnected", this._alDesconectar);
    this._cambiarEstado("conectando");
    try {
      const servidor = await dispositivo.gatt.connect();
      const servicio = await servidor.getPrimaryService(SERVICE_UUID);
      const car = await servicio.getCharacteristic(CHAR_UUID);
      await car.startNotifications();
      car.addEventListener("characteristicvaluechanged", (ev) => {
        const texto = decodificar(ev.target.value);
        this.oyentesMensaje.forEach((cb) => cb(texto));
      });
      this.caracteristica = car;
      this._cambiarEstado("conectado");
    } catch (e) {
      this._cambiarEstado("desconectado");
      throw new Error(`No se pudo conectar con el dije: ${e.message}`);
    }
  }

  async enviar(comando) {
    if (!this.caracteristica) throw new Error("El dije no está conectado");
    const datos = codificar(comando);
    if (this.caracteristica.writeValueWithResponse) await this.caracteristica.writeValueWithResponse(datos);
    else await this.caracteristica.writeValue(datos);
  }

  desconectar() {
    if (this.dispositivo?.gatt?.connected) this.dispositivo.gatt.disconnect();
    else this._cambiarEstado("desconectado");
  }
}

/** Dije de la persona que usa este teléfono (se conserva mientras la app esté abierta). */
export const miDije = new ConexionDije("duenio");

/** Interpreta "ALERTA" | "ALERTA,lat,lng" del dije. Devuelve null si no es una alerta. */
export function leerAlertaDije(texto) {
  if (!texto || !texto.startsWith("ALERTA")) return null;
  const [, lat, lng] = texto.split(",");
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  return Number.isFinite(la) && Number.isFinite(ln) ? { lat: la, lng: ln } : {};
}
