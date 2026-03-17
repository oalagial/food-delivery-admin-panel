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

/** Returns the current user id from the JWT payload (sub, id, or userId), or null if not available. */
export function getCurrentUserId(): string | number | null {
  const token = getToken()
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as Record<string, unknown>
    const id = payload.sub ?? payload.id ?? payload.userId ?? payload.user_id
    if (id === undefined || id === null) return null
    return typeof id === 'number' ? id : String(id)
  } catch {
    return null
  }
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
  telephone?: string
  description?: string
  latitude?: string | number
  longitude?: string | number
  openingHours?: OpeningHour[]
  menu: MenuItem[]
  createdAt?: string | number
  [k: string]: unknown
}

export async function getRestaurantsList(query?: string): Promise<Restaurant[]> {
  const res = await authFetch(`/restaurants${query ? `?${query}` : ''}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /restaurants${query ? `?${query}` : ''} failed (${res.status})`)
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
  telephone?: string
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

export async function deleteUser(id: string | number): Promise<void> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/users/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Delete user failed (${res.status})`)
  }
}

export async function setUserActive(id: string | number, active: boolean): Promise<void> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/users/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Update user failed (${res.status})`)
  }
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

export async function deleteType(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/types/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `DELETE /types/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// Product types + APIs
export const ProductAllergy = {
  GLUTEN: 'GLUTEN',
  DAIRY: 'DAIRY',
  EGGS: 'EGGS',
  FISH: 'FISH',
  SHELLFISH: 'SHELLFISH',
  TREE_NUTS: 'TREE_NUTS',
  PEANUTS: 'PEANUTS',
  SOY: 'SOY',
  SESAME: 'SESAME',
  SULPHITES: 'SULPHITES',
  LUPIN: 'LUPIN',
  MOLLUSCS: 'MOLLUSCS',
  MUSTARD: 'MUSTARD',
  CELERY: 'CELERY',
} as const

export type ProductAllergy = (typeof ProductAllergy)[keyof typeof ProductAllergy]

export type Product = {
  id?: string | number
  name?: string
  description?: string
  image?: string
  typeId?: number | string
  type: any
  ingredients?: string[]
  allergies?: ProductAllergy[]
  price?: number
  isAvailable?: boolean
  extras?: ProductExtra[]
  vatRate?: 'FOUR' | 'FIVE' | 'TEN' | 'TWENTY_TWO'
  createdAt?: string | number
  [k: string]: unknown
}

export type CreateProductPayload = {
  name: string
  description?: string
  image?: string
  imageFile?: string
  typeId?: number | string
  ingredients?: string[]
  allergies?: ProductAllergy[]
  price?: number
  isAvailable?: boolean
  stockQuantity?: number | null
  vatRate?: 'FOUR' | 'FIVE' | 'TEN' | 'TWENTY_TWO'
  extras?: Array<{ id?: number; name: string; price: number }>
  discounts?: Array<{ id?: number; type: 'PERCENTAGE' | 'FIXED'; value: number; startsAt: string; endsAt?: string; isActive: boolean }>
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

export async function createProduct(payload: CreateProductPayload, imageFile?: File) {
  let headers: HeadersInit = {}
  let body: BodyInit

  if (imageFile) {
    // Use FormData when uploading a file
    // Send data as individual fields with proper type conversion
    const formData = new FormData()
    formData.append('name', payload.name)
    if (payload.description) formData.append('description', payload.description)
    formData.append('imageFile', imageFile)
    
    // Append typeId - convert to number and send as string (backend should parse)
    if (payload.typeId !== undefined && payload.typeId !== null && payload.typeId !== '') {
      const typeIdNum = Number(payload.typeId)
      if (!isNaN(typeIdNum)) {
        formData.append('typeId', typeIdNum.toString())
      }
    }
    
    // Append ingredients array
    if (payload.ingredients && payload.ingredients.length > 0) {
      payload.ingredients.forEach((ingredient, index) => {
        formData.append(`ingredients[${index}]`, ingredient)
      })
    }
    
    // Append allergies array
    if (payload.allergies && payload.allergies.length > 0) {
      payload.allergies.forEach((allergy, index) => {
        formData.append(`allergies[${index}]`, allergy)
      })
    }
    
    // Append price - convert to number and send as string (backend should parse)
    if (payload.price !== undefined && payload.price !== null) {
      const priceNum = Number(payload.price)
      if (!isNaN(priceNum)) {
        formData.append('price', priceNum.toString())
      }
    }
    
    // Append isAvailable - convert boolean to string (backend should parse)
    const isAvailableValue = payload.isAvailable !== undefined ? Boolean(payload.isAvailable) : true
    formData.append('isAvailable', isAvailableValue ? 'true' : 'false')
    
    // Append vatRate if provided
    if (payload.vatRate) {
      formData.append('vatRate', payload.vatRate)
    }
    
    // Append extras as nested FormData fields if provided
    if (payload.extras && payload.extras.length > 0) {
      payload.extras.forEach((extra, index) => {
        if (extra.id !== undefined && extra.id !== null) {
          formData.append(`extras[${index}][id]`, Number(extra.id).toString())
        }
        if (extra.name) {
          formData.append(`extras[${index}][name]`, extra.name)
        }
        if (extra.price !== undefined && extra.price !== null) {
          formData.append(`extras[${index}][price]`, Number(extra.price).toString())
        }
      })
    }
    
    // Append discounts as JSON string if provided
    if (payload.discounts && payload.discounts.length > 0) {
      formData.append('discounts', JSON.stringify(payload.discounts))
    }
    
    body = formData
    // Don't set Content-Type header - browser will set it with boundary for FormData
  } else {
    // Use JSON when no file is uploaded
    headers = { 'Content-Type': 'application/json' }
    body = JSON.stringify(payload)
  }

  const res = await authFetch('/products/create', {
    method: 'POST',
    headers,
    body,
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

export async function updateProduct(id: string | number, payload: Partial<CreateProductPayload>) {
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

export async function updateProductImage(id: string | number, imageFile: File) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  if (!imageFile) throw new Error('imageFile is required')
  
  const formData = new FormData()
  formData.append('imageFile', imageFile)

  const res = await authFetch(`/products/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for FormData
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `PUT /products/${id} (image) failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function restoreProduct(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/products/${encodeURIComponent(String(id))}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /products/${id}/restore failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function deleteProduct(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/products/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `DELETE /products/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export type ProductExtra = {
  id?: number | string
  productId?: string
  name: string
  price: number
}

export type CreateProductExtraPayload = {
  productId?: number
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
  return data.data || null
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


export type ProductDiscount = {
  id?: number | string
  productId: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  startsAt: string
  endsAt?: string
  isActive: boolean
}

export type CreateProductDiscountPayload = {
  productId: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  startsAt: string
  endsAt?: string
  isActive: boolean
}

export async function getProductDiscount(id: string | number): Promise<ProductDiscount[] | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/products-discount?productId=${encodeURIComponent(String(id))}`)

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /products-discount/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data.data || null
}

export async function createProductDiscount(payload: CreateProductDiscountPayload) {
  const res = await authFetch('/products-discount/create', {
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

    throw new Error(bodyText || `POST /products-discount/create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function createBatchProductDiscount(productId: string | number, payload: Array<CreateProductDiscountPayload>) {
  const res = await authFetch(`/products-discount/batch-create/${productId}`, {
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

    throw new Error(bodyText || `POST /products-discount/batch-create failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function deleteProductDiscount(id: string | number) {
  const res = await authFetch(`/products-discount/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `DELETE /products-discount/${id} failed (${res.status})`)
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
  restaurantId?: number | string
  [k: string]: unknown
}

export async function getMenusList(restaurantId?: string | number): Promise<MenuItem[]> {
  const url = restaurantId 
    ? `/menus?restaurantId=${encodeURIComponent(String(restaurantId))}`
    : '/menus'
  const res = await authFetch(url)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET ${url} failed (${res.status})`)
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

export async function restoreMenu(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/menus/${encodeURIComponent(String(id))}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /menus/${id}/restore failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function deleteMenu(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/menus/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `DELETE /menus/${id} failed (${res.status})`)
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
  offerGroupProducts?: Array<any>
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

export async function updateOffer(id: string | number, payload: Partial<CreateOfferPayload>) {
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

export async function deleteOffer(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/offers/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `DELETE /offers/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function restoreOffer(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/offers/${encodeURIComponent(String(id))}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /offers/${id}/restore failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// Coupons API
export type DiscountType = 'PERCENTAGE' | 'FIXED'

export type Coupon = {
  id: number
  code: string
  name: string
  description?: string | null
  restaurantId?: number | null
  customerId?: number | null
  maxUse?: number | null
  type: DiscountType
  value: number | string
  startsAt: string
  endsAt?: string | null
  isActive: boolean
  restaurant?: { id: number; name?: string } | null
  customer?: { id: number; name?: string; email?: string } | null
  deletedBy?: string | number | null
  [k: string]: unknown
}

export type CreateCouponPayload = {
  code: string
  name: string
  description?: string
  restaurantId?: number | null
  customerId?: number | null
  maxUse?: number | null
  type: DiscountType
  value: number
  startsAt: string
  endsAt?: string | null
  isActive?: boolean
}

export type CouponsListParams = { page?: number; limit?: number; sortField?: string; sortDir?: 'asc' | 'desc' }

export type CouponsListResponse = { data: Coupon[]; total: number; page: number; limit: number; totalPages: number }

export async function getCouponsList(params?: CouponsListParams): Promise<CouponsListResponse> {
  const search = new URLSearchParams()
  if (params?.page != null) search.set('page', String(params.page))
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.sortField) search.set('sortField', params.sortField)
  if (params?.sortDir) search.set('sortDir', params.sortDir)
  const res = await authFetch(`/coupons?${search}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /coupons failed (${res.status})`)
  }
  const json = await res.json().catch(() => null)
  const data = Array.isArray(json?.data) ? json.data : []
  return {
    data,
    total: Number(json?.total) ?? 0,
    page: Number(json?.page) ?? 1,
    limit: Number(json?.limit) ?? 20,
    totalPages: Number(json?.totalPages) ?? 1,
  }
}

export async function getCouponById(id: string | number): Promise<Coupon | null> {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/coupons/${encodeURIComponent(String(id))}`)
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /coupons/${id} failed (${res.status})`)
  }
  return res.json().catch(() => null)
}

export async function createCoupon(payload: CreateCouponPayload) {
  const res = await authFetch('/coupons/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const bodyText = parseErrorJson(await res.json().catch(() => null)) || (await res.text().catch(() => ''))
    throw new Error(bodyText || `POST /coupons/create failed (${res.status})`)
  }
  return res.json().catch(() => null)
}

export async function updateCoupon(id: string | number, payload: Partial<CreateCouponPayload>) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/coupons/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const bodyText = parseErrorJson(await res.json().catch(() => null)) || (await res.text().catch(() => ''))
    throw new Error(bodyText || `PUT /coupons/${id} failed (${res.status})`)
  }
  return res.json().catch(() => null)
}

export async function deleteCoupon(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/coupons/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
  if (!res.ok) {
    const bodyText = parseErrorJson(await res.json().catch(() => null)) || (await res.text().catch(() => ''))
    throw new Error(bodyText || `DELETE /coupons/${id} failed (${res.status})`)
  }
}

export async function restoreCoupon(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/coupons/${encodeURIComponent(String(id))}/restore`, { method: 'POST' })
  if (!res.ok) {
    const bodyText = parseErrorJson(await res.json().catch(() => null)) || (await res.text().catch(() => ''))
    throw new Error(bodyText || `POST /coupons/${id}/restore failed (${res.status})`)
  }
  return res.json().catch(() => null)
}

export type CustomerListItem = { id: number; name?: string; email?: string; phone?: string; [k: string]: unknown }

export async function getCustomersList(params?: { page?: number; limit?: number }): Promise<{ data: CustomerListItem[]; total: number; totalPages: number }> {
  const search = new URLSearchParams()
  if (params?.page != null) search.set('page', String(params.page))
  if (params?.limit != null) search.set('limit', String(params.limit))
  const res = await authFetch(`/customers?${search}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /customers failed (${res.status})`)
  }
  const json = await res.json().catch(() => null)
  const data = Array.isArray(json?.data) ? json.data : []
  return {
    data,
    total: Number(json?.total) ?? 0,
    totalPages: Number(json?.totalPages) ?? 1,
  }
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

export async function deleteSection(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/sections/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `DELETE /sections/${id} failed (${res.status})`)
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

// Replace enums with const objects using 'as const'
export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  ONLINE: 'ONLINE'
} as const;

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  ON_THE_WAY: 'ON_THE_WAY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
} as const;

// Type inference from const objects
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

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
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryTime: string
  customer?: OrderCustomer
  subtotal: string
  deliveryFee: string
  discount: string
  notes?: string
  total: string
  products?: any[]
  offers?: any[]
  createdAt?: string | number
  restaurant: Restaurant,
  deliveryLocation: any
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

export async function getOrdersList(page = 1, limit = 10): Promise<any> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const res = await authFetch(`/orders?${params}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /orders failed (${res.status})`)
  }
  const data = await res.json().catch(() => null)
  // Return paginated response as-is for consumers to handle
  return data
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

export async function updateOrder(id: string | number, payload: any) {
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

export async function deleteDeliveryLocation(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/delivery-locations/delete/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }
    throw new Error(bodyText || `DELETE /delivery-locations/delete/${id} failed (${res.status})`)
  }
  return res.json().catch(() => null)
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

export async function restoreRestaurant(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/restaurants/${encodeURIComponent(String(id))}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `POST /restaurants/${id}/restore failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

export async function deleteRestaurant(id: string | number) {
  if (id === undefined || id === null || String(id) === '') throw new Error('id is required')
  const res = await authFetch(`/restaurants/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let bodyText = ''
    try {
      const json = await res.json()
      bodyText = parseErrorJson(json)
    } catch {
      try { bodyText = await res.text() } catch { bodyText = '' }
    }

    throw new Error(bodyText || `DELETE /restaurants/${id} failed (${res.status})`)
  }

  const data = await res.json().catch(() => null)
  return data
}

// Stats API
export type StatsOverviewResponse = {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  deliveredOrders: number
  cancelledOrders: number
  deliveryRate: number
  cancellationRate: number
  newCustomers: number
  ordersWithCoupon: number
}

export type StatsRevenueItem = {
  period: string
  revenue: number
  orderCount: number
}

export type StatsProductItem = {
  productId: number
  productName: string
  quantity: number
  revenue: number
}

export type StatsPaymentMethodItem = {
  method: string
  count: number
  total: number
}

export type StatsTopCustomerItem = {
  customerId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  orderCount: number
  totalRevenue: number
  averageOrderValue: number
}

export type StatsParams = {
  from?: string
  to?: string
  restaurantId?: number
  groupBy?: 'day' | 'week' | 'month'
}

export async function getStatsOverview(params?: StatsParams): Promise<StatsOverviewResponse> {
  const search = new URLSearchParams()
  if (params?.from) search.set('from', params.from)
  if (params?.to) search.set('to', params.to)
  if (params?.restaurantId != null) search.set('restaurantId', String(params.restaurantId))
  if (params?.groupBy) search.set('groupBy', params.groupBy)
  const res = await authFetch(`/stats/overview?${search}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /stats/overview failed (${res.status})`)
  }
  return res.json()
}

export async function getStatsRevenue(params?: StatsParams): Promise<StatsRevenueItem[]> {
  const search = new URLSearchParams()
  if (params?.from) search.set('from', params.from)
  if (params?.to) search.set('to', params.to)
  if (params?.restaurantId != null) search.set('restaurantId', String(params.restaurantId))
  if (params?.groupBy) search.set('groupBy', params.groupBy)
  const res = await authFetch(`/stats/revenue?${search}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /stats/revenue failed (${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function getStatsProducts(params?: StatsParams): Promise<StatsProductItem[]> {
  const search = new URLSearchParams()
  if (params?.from) search.set('from', params.from)
  if (params?.to) search.set('to', params.to)
  if (params?.restaurantId != null) search.set('restaurantId', String(params.restaurantId))
  if (params?.groupBy) search.set('groupBy', params.groupBy)
  const res = await authFetch(`/stats/products/top?${search}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /stats/products/top failed (${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function getStatsPaymentMethods(params?: StatsParams): Promise<StatsPaymentMethodItem[]> {
  const search = new URLSearchParams()
  if (params?.from) search.set('from', params.from)
  if (params?.to) search.set('to', params.to)
  if (params?.restaurantId != null) search.set('restaurantId', String(params.restaurantId))
  const res = await authFetch(`/stats/payment-methods?${search}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /stats/payment-methods failed (${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function getStatsTopCustomers(params?: StatsParams): Promise<StatsTopCustomerItem[]> {
  const search = new URLSearchParams()
  if (params?.from) search.set('from', params.from)
  if (params?.to) search.set('to', params.to)
  if (params?.restaurantId != null) search.set('restaurantId', String(params.restaurantId))
  const res = await authFetch(`/stats/customers/top?${search}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `GET /stats/customers/top failed (${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
