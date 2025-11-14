import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { attachAuthToFetch } from './utils/api'

// Patch global fetch so all requests include the Bearer token when available
attachAuthToFetch()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
