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

function handleUnauthorized() {
  try {
    clearToken()
    if (typeof window !== 'undefined') {
      // notify listeners
      try { window.dispatchEvent(new Event('auth')) } catch {}
      // avoid redirect loop if already on /login
      try {
        const current = window.location.pathname || ''
        if (!current.startsWith('/login')) window.location.href = '/login'
      } catch {}
    }
  } catch {
    // ignore
  }
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
    return fetch(normalized, newInit).then((res) => {
      if (res.status === 401) {
        handleUnauthorized()
      }
      return res
    })
  }

  return fetch(input, newInit).then((res) => {
    if (res.status === 401) {
      handleUnauthorized()
    }
    return res
  })
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
    return originalFetch(finalInput, newInit).then((res) => {
      if (res && (res as Response).status === 401) {
        handleUnauthorized()
      }
      return res
    })
  }

  ;(wrapped as unknown as { __auth_wrapped?: boolean }).__auth_wrapped = true
  window.fetch = wrapped as unknown as typeof window.fetch
}

export type Restaurant = {
  id?: string
  name?: string
  [k: string]: any
}

export async function getRestaurantsList(): Promise<Restaurant[]> {
  const res = await authFetch('/restaurants/list')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /restaurants/list failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getDeliveryLocationsList(): Promise<Restaurant[]> {
  const res = await authFetch('/delivery-locations/list')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /delivery-locations/list failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export type OpeningHour = {
  day?: string
  open?: string
  close?: string
  [k: string]: any
}

export async function getRestaurantByToken(token: string): Promise<Restaurant | null> {
  if (!token) throw new Error('token is required')
  const res = await authFetch(`/restaurants/${encodeURIComponent(token)}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /restaurants/${token} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data || null
}

// Alias using clearer name when the identifier is a numeric id
export async function getRestaurantById(id: string | number): Promise<Restaurant | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  return getRestaurantByToken(String(id))
}

export type CreateRestaurantPayload = {
  name: string
  address?: string
  streetNumber?: string
  city?: string
  province?: string
  image?: string
  zipCode?: string
  country?: string
  description?: string
  latitude?: string | number
  longitude?: string | number
  openingHours?: OpeningHour[]
  [k: string]: any
}

export async function createRestaurant(payload: CreateRestaurantPayload) {
  const res = await authFetch('/restaurants/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    // Try to parse structured JSON error body, otherwise fallback to text
    let bodyText = ''
    try {
      const json = await res.json()
      // Common patterns: { message: '...', errors: [...] } or { messages: [...] }
      if (json) {
        if (Array.isArray(json.messages)) {
          bodyText = json.messages.join('; ')
        } else if (Array.isArray(json.errors)) {
          bodyText = json.errors.map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e))).join('; ')
        } else if (typeof json.message === 'string') {
          bodyText = json.message
        } else {
          bodyText = JSON.stringify(json)
        }
      }
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /restaurants/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export type CreateDeliveryLocationPayload = {
  name: string
  address?: string
  streetNumber?: string
  city?: string
  province?: string
  image?: string
  zipCode?: string
  country?: string
  description?: string
  latitude?: string | number
  longitude?: string | number
  isActive?: boolean
  restaurantIds?: Array<number | string>
  [k: string]: unknown
}

export async function createDeliveryLocation(payload: CreateDeliveryLocationPayload) {
  const res = await authFetch('/delivery-locations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      if (json) {
        if (Array.isArray(json.messages)) {
          bodyText = json.messages.join('; ')
        } else if (Array.isArray((json as any).errors)) {
          bodyText = (json as any).errors.map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e))).join('; ')
        } else if (typeof (json as any).message === 'string') {
          bodyText = (json as any).message
        } else {
          bodyText = JSON.stringify(json)
        }
      }
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /delivery-locations/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function updateRestaurant(token: string, payload: CreateRestaurantPayload) {
  if (!token) throw new Error('token is required')
  const res = await authFetch(`/restaurants/${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      if (json) {
        if (Array.isArray(json.messages)) {
          bodyText = json.messages.join('; ')
        } else if (Array.isArray(json.errors)) {
          bodyText = json.errors.map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e))).join('; ')
        } else if (typeof json.message === 'string') {
          bodyText = json.message
        } else {
          bodyText = JSON.stringify(json)
        }
      }
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `PUT /restaurants/${token} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}
