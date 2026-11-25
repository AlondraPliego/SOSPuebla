import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Backend Spring Boot al que apunta el proxy (para probar desde el teléfono con un solo dominio HTTPS)
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Con VITE_API_URL=/api la app llama al backend a través de este mismo servidor:
    //   /api/*  -> backend (sin el prefijo /api)
    //   /ws     -> WebSocket del backend
    // Así un túnel HTTPS (cloudflared/ngrok) expone app + backend en una sola dirección,
    // requisito de Web Bluetooth (sólo funciona en https://) y evita "contenido mixto".
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      '/ws': { target: BACKEND, ws: true, changeOrigin: true },
    },
    allowedHosts: true,
  },
})
