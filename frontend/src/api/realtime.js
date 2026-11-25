// Conexión WebSocket (STOMP) con el backend.
// Canales que publica el backend:
//   /topic/alertas               -> alerta:nueva, alerta:estado, voluntario:confirmo, voluntario:declino
//   /topic/voluntarios/{id}      -> alerta:nueva dirigida a un voluntario
//   /topic/sismo/countdown       -> { segundos } durante la simulación de sismo
// Nota: estos mensajes son Map en el backend, por eso llegan en camelCase (alertaId, voluntarioId).

import { Client } from "@stomp/stompjs";
import { API_URL } from "./client";

// Si el API es relativo (p. ej. "/api" detrás del proxy de Vite o un túnel HTTPS),
// el WebSocket va al mismo host de la página: wss://<host>/ws
function urlWebSocket() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (API_URL.startsWith("/")) {
    return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
  }
  return `${API_URL.replace(/^http/, "ws")}/ws`;
}
const WS_URL = urlWebSocket();

let cliente = null;
const suscripciones = new Map(); // id -> { destino, callback, sub }
let siguienteId = 1;

function asegurarCliente() {
  if (cliente) return cliente;
  cliente = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      // (re)suscribe todo lo registrado al conectar o reconectar
      for (const s of suscripciones.values()) {
        s.sub = cliente.subscribe(s.destino, (msg) => entregar(s, msg));
      }
    },
  });
  cliente.activate();
  return cliente;
}

function entregar(s, msg) {
  let datos = msg.body;
  try {
    datos = JSON.parse(msg.body);
  } catch {
    /* cuerpo no JSON */
  }
  s.callback(datos);
}

/** Se suscribe a un destino STOMP. Devuelve una función para cancelar. */
export function suscribir(destino, callback) {
  const c = asegurarCliente();
  const id = siguienteId++;
  const s = { destino, callback, sub: null };
  suscripciones.set(id, s);
  if (c.connected) s.sub = c.subscribe(destino, (msg) => entregar(s, msg));
  return () => {
    try {
      s.sub?.unsubscribe();
    } catch {
      /* ya desconectado */
    }
    suscripciones.delete(id);
  };
}
