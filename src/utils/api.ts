import { API_BASE } from '../config'

type LoginResponse = {
  token?: string
  accessToken?: string
  [k: string]: unknown
}

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
  const obj = data as unknown as Record<string, unknown>
  const tokenVal = obj['access_token'] ?? obj['accessToken'] ?? obj['token'] ?? obj['bearer']
  if (typeof tokenVal === 'string') setToken(tokenVal)
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

function parseErrorJson(json: unknown): string {
  if (!json) return ''
  if (Array.isArray(json)) return json.map(String).join('; ')
  if (typeof json === 'object') {
    const obj = json as Record<string, unknown>
    if (Array.isArray(obj.messages)) return (obj.messages as unknown[]).map(String).join('; ')
    if (Array.isArray(obj.errors)) {
      return (obj.errors as unknown[]).map((e) => {
        if (typeof e === 'string') return e
        if (typeof e === 'object' && e && 'message' in (e as Record<string, unknown>)) return String((e as Record<string, unknown>).message)
        return JSON.stringify(e)
      }).join('; ')
    }
    if (typeof obj.message === 'string') return obj.message
    try { return JSON.stringify(obj) } catch { return String(obj) }
  }
  return String(json)
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
  createdAt?: string | number
  [k: string]: unknown
}

export async function getRestaurantsList(): Promise<Restaurant[]> {
  const res = await authFetch('/restaurants')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /restaurants failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getDeliveryLocationsList(): Promise<Restaurant[]> {
  const res = await authFetch('/delivery-locations')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /delivery-locations failed (${res.status})`)
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
  const res = await authFetch(`/restaurants?id=${encodeURIComponent(token)}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /restaurants?id=${token} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)

  return data.data[0] || null
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
  [k: string]: unknown
}

export async function createRestaurant(payload: CreateRestaurantPayload) {
  const res = await authFetch('/restaurants/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /restaurants/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// Roles API
export type RoleItem = {
  id?: string | number
  name?: string
  description?: string
  createdAt?: string | number
  [k: string]: unknown
}

export async function getRolesList(): Promise<RoleItem[]> {
  // Try authenticated fetch first (works when user is logged in)
  try {
    const res = await authFetch('/roles')
    if (res.ok) {
      const data = await res.json().catch(() => null)
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    }
  } catch {
    // ignore and fallback to unauthenticated fetch below
  }

  // Fallback: try a plain fetch to the full API URL (some deployments expose roles publicly)
  try {
    const url = API_BASE.replace(/\/$/, '') + '/roles'
    const res2 = await fetch(url)
    if (!res2.ok) {
      const text = await res2.text().catch(() => '')
      throw new Error(text || `GET /roles failed (${res2.status})`)
    }
    const data2 = await res2.json().catch(() => null)
    return Array.isArray(data2) ? data2 : (data2?.items || data2?.data || [])
  } catch (err) {
    throw err
  }
}

export async function getRoleById(id: string | number): Promise<Restaurant | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/roles?id=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /roles/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data?.[0] || null
}


export type TypeItem = {
  id?: string | number
  name?: string
  tag?: string
  description?: string
  createdAt?: string | number
  [k: string]: unknown
}

export async function getTypesList(): Promise<TypeItem[]> {
  const res = await authFetch('/types')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /types failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}


export type CreateTypePayload = {
  name: string
  tag?: string
  description?: string
  [k: string]: unknown
}

export async function createType(payload: CreateTypePayload) {
  const res = await authFetch('/types/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /types/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function getTypeById(id: string | number): Promise<TypeItem | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/types?id=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /types?id=${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data?.[0] || null
}

export async function updateType(id: string | number, payload: CreateTypePayload) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/types/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `PUT /types/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// Product types + APIs
export type Product = {
  id?: string | number
  name?: string
  description?: string
  image?: string
  typeId?: number | string
  type: any
  ingredients?: string[]
  price?: number
  isAvailable?: boolean
  createdAt?: string | number
  [k: string]: unknown
}

export type CreateProductPayload = {
  name: string
  description?: string
  image?: string
  typeId?: number | string
  ingredients?: string[]
  price?: number
  isAvailable?: boolean
  [k: string]: unknown
}

export async function getProductsList(): Promise<Product[]> {
  const res = await authFetch('/products')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /products failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getProductById(id: string | number): Promise<Product | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/products?id=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /products/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data?.[0] || null
}

export async function createProduct(payload: CreateProductPayload) {
  const res = await authFetch('/products/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /products/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function updateProduct(id: string | number, payload: CreateProductPayload) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/products/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `PUT /products/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export type ProductExtra = {
  productId?: string
  name: string
  price: number
}

export type CreateProductExtraPayload = {
  productId?: string
  name: string
  price: number
}

export async function getExtrasByProduct(id: string | number): Promise<ProductExtra[] | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/products-extra?productId=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /products-extra/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data?.[0] || null
}

export async function createProductExtra(payload: CreateProductExtraPayload) {
  const res = await authFetch('/products-extra/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /products-extra/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}




// Menus API
export type MenuItem = {
  id?: number | string
  name?: string
  description?: string
  sectionIds?: Array<number | string>
  restaurants?: Array<number>
  createdAt?: string | number
  [k: string]: unknown
}

export type CreateMenuPayload = {
  name: string
  description?: string
  sectionIds?: Array<number | string>
  restaurantIds?: Array<number | string>
  [k: string]: unknown
}

export async function getMenusList(): Promise<MenuItem[]> {
  const res = await authFetch('/menus')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /menus failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getMenuById(id: string | number): Promise<MenuItem | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/menus?id=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /menus?id=${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data?.[0] || null
}

export async function createMenu(payload: CreateMenuPayload) {
  const res = await authFetch('/menus/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `POST /menus/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function updateMenu(id: string | number, payload: CreateMenuPayload) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/menus/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `PUT /menus/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// (previous helper removed — real Sections API implemented below)

// Offers API

export type Offer = {
  name: string
  description?: string
  price: number | string
  restaurantId: number | string
  menuId?: number | string
  isActive: boolean
  image?: string
  groups: OfferGroup[]
}

export type OfferGroup = {
  name: string
  minItems: number
  maxItems: number
  products?: Array<any>
  productsIds: Array<number>
}

export type CreateOfferPayload = {
  name: string
  description: string
  price: number
  restaurantId: number
  menuId: number
  isActive: boolean
  groups: OfferGroup[]
}

export async function getOfferList() {
  const res = await authFetch('/offers')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /menus failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getOfferById(id: string | number): Promise<Offer | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/offers?id=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /offers?id=${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data?.[0] || null
}

export async function createOffer(payload: CreateOfferPayload) {
  const res = await authFetch('/offers/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `POST /offers/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function updateOffer(id: string | number, payload: CreateOfferPayload) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/offers/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `PUT /offers/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}


// Opening Hours API
export type OpeningHourItem = {
  id?: number | string
  day?: string
  open?: string
  close?: string
  createdAt?: string | number
  [k: string]: unknown
}

export async function getOpeningHoursList(): Promise<OpeningHourItem[]> {
  const res = await authFetch('/opening-hours')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /opening-hours failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getOpeningHourById(id: string | number): Promise<OpeningHourItem | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/opening-hours/${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /opening-hours/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data || null
}

export async function createOpeningHour(payload: OpeningHourItem) {
  const res = await authFetch('/opening-hours/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `POST /opening-hours/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function updateOpeningHour(id: string | number, payload: OpeningHourItem) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/opening-hours/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `PUT /opening-hours/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// Sections API
export type SectionItem = {
  id?: number | string
  name?: string
  description?: string
  typeId?: number | string
  productsIds?: Array<number | string>
  createdAt?: string | number
  [k: string]: unknown
}

export type CreateSectionPayload = {
  name: string
  description?: string
  typeId?: number | string
  productsIds?: Array<number | string>
  [k: string]: unknown
}

export async function getSectionsList(): Promise<SectionItem[]> {
  const res = await authFetch('/sections')

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /sections failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getSectionById(id: string | number): Promise<SectionItem | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/sections?id=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /sections?id=${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data?.[0] || null
}

export async function createSection(payload: CreateSectionPayload) {
  const res = await authFetch('/sections/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `POST /sections/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function updateSection(id: string | number, payload: CreateSectionPayload) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/sections/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `PUT /sections/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// Orders API
export type OrderProductItem = {
  productId: number | string
  quantity: number
  [k: string]: unknown
}

export type OrderCustomer = {
  name?: string
  email?: string
  phone?: string
  [k: string]: unknown
}

export type OrderItem = {
  id?: number | string
  restaurantId?: number | string
  deliveryLocationId?: number | string
  status?: string | number
  customer?: OrderCustomer
  notes?: string
  orderProducts?: OrderProductItem[]
  createdAt?: string | number
  [k: string]: unknown
}

export type CreateOrderPayload = {
  restaurantId: number | string
  deliveryLocationId: number | string
  status?: string | number
  customer: OrderCustomer
  notes?: string
  orderProducts: OrderProductItem[]
  [k: string]: unknown
}

export async function getOrdersList(): Promise<OrderItem[]> {
  const res = await authFetch('/orders')
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /orders failed (${res.status})`)
  }
  const data = await res.json().catch(() => null)
  return Array.isArray(data) ? data : (data?.items || data?.data || [])
}

export async function getOrderById(id: string | number): Promise<OrderItem | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/orders/${encodeURIComponent(String(id))}`)
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /orders/${id} failed (${res.status})`)
  }
  const data = await res.json().catch(() => null)
  return data || null
}

export async function createOrder(payload: CreateOrderPayload) {
  const res = await authFetch('/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `POST /orders/create failed (${res.status})`)
  }
  const data = await res.json().catch(() => null)
  return data
}

export async function updateOrder(id: string | number, payload: CreateOrderPayload) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/orders/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = (json && (json.message || JSON.stringify(json))) || ''
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `PUT /orders/${id} failed (${res.status})`)
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
  deliveredBy?: Array<{
    restaurantId: number | string
    deliveryFee?: number
    minOrder?: number
    isActive?: boolean
    [k: string]: unknown
  }>
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
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /delivery-locations/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function getDeliveryLocationById(id: string | number): Promise<CreateDeliveryLocationPayload | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/delivery-locations?id=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /delivery-locations?id=${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data[0] || null
}

export async function updateDeliveryLocation(id: string | number, payload: CreateDeliveryLocationPayload) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/delivery-locations/update/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `PUT /delivery-locations/${id} failed (${res.status})`)
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
          bodyText = (json.errors as unknown[]).map((e) => (typeof e === 'string' ? e : (e && (e as Record<string, unknown>).message) || JSON.stringify(e))).join('; ')
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
