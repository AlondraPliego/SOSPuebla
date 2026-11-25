import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PanelSecretaria from './pages/PanelSecretaria.jsx'

// Dos sitios separados: "/panel" es el Panel Web de Protección Civil (operador/admin);
// cualquier otra ruta es la app pública (ciudadanos y voluntarios).
const esPanel = window.location.pathname.replace(/\/+$/, '').endsWith('/panel')

if (esPanel) document.title = 'Centro de Mando · Protección Civil Puebla'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {esPanel ? <PanelSecretaria /> : <App />}
  </StrictMode>,
)
