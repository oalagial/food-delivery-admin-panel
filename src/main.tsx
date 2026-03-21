import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { attachAuthToFetch } from './utils/api'
// Initialize application
// Patch global fetch so all requests include the Bearer token when available
attachAuthToFetch()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
