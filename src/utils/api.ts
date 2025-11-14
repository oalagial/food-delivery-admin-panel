type LoginResponse = {
  token?: string
  accessToken?: string
  [k: string]: any
}
const API_BASE = 'https://delivery-app-backend-production-64f2.up.railway.app'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Login request failed (${res.status})`)
  }

  const data: LoginResponse = await res.json()
  const token = data.access_token || data.accessToken || data.token || data?.bearer
  if (token) setToken(token)
  return data
}

export function setToken(token: string) {
  try {
    localStorage.setItem('access_token', token)
    try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth')) } catch { /* ignore */ }
  } catch {
    // ignore storage errors
  }
}

export function clearToken() {
  try { localStorage.removeItem('access_token') } catch { /* ignore */ }
  try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth')) } catch { /* ignore */ }
}

export function getToken(): string | null {
  try { return localStorage.getItem('access_token') } catch { return null }
}

export function authFetch(input: RequestInfo, init?: RequestInit) {
  const token = getToken()
  const headers = new Headers(init?.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const newInit = { ...init, headers }

  // If `input` is a string and not an absolute URL, prefix with API_BASE
  if (typeof input === 'string') {
    const isAbsolute = /^https?:\/\//i.test(input)
    const normalized = isAbsolute ? input : `${API_BASE.replace(/\/$/, '')}/${input.replace(/^\/+/, '')}`
    return fetch(normalized, newInit)
  }

  return fetch(input, newInit)
}

// Monkey-patch global fetch so all requests automatically include the Bearer header
export function attachAuthToFetch() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return
  const originalFetch = window.fetch.bind(window)
  // Avoid wrapping multiple times
  const origWithFlag = originalFetch as unknown as { __auth_wrapped?: boolean }
  if (origWithFlag.__auth_wrapped) return

  const wrapped = (input: RequestInfo, init?: RequestInit) => {
    const token = getToken()

    // Normalize URL if input is string
    let finalInput: RequestInfo = input
    if (typeof input === 'string') {
      const isAbsolute = /^https?:\/\//i.test(input)
      finalInput = isAbsolute ? input : `${API_BASE.replace(/\/$/, '')}/${input.replace(/^\/+/, '')}`
    }

    const headers = new Headers(init?.headers || {})
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const newInit = { ...(init || {}), headers }
    return originalFetch(finalInput, newInit)
  }

  ;(wrapped as unknown as { __auth_wrapped?: boolean }).__auth_wrapped = true
  window.fetch = wrapped as unknown as typeof window.fetch
}
