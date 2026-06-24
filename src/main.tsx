import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { stashIncomingClip } from './clip'
import './index.css'

// Captura dados do webclipper (Compartilhar/extensão) antes de renderizar,
// para que sobrevivam a um eventual redirect de login.
stashIncomingClip()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
