const STORAGE_KEY = 'user_permissions'

export function setStoredPermissions(perms: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perms))
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth'))
  } catch {
    /* ignore */
  }
}

/** `null` = not loaded / logged out; `[]` = no permissions (deny). */
export function getStoredPermissions(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return null
  }
}

export function clearStoredPermissions() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth'))
  } catch {
    /* ignore */
  }
}

export function hasPermission(action: string): boolean {
  const p = getStoredPermissions()
  if (p === null || p.length === 0) return false
  if (p.includes('*')) return true
  return p.includes(action)
}

export function hasAnyPermission(actions: string[]): boolean {
  const p = getStoredPermissions()
  if (p === null || p.length === 0) return false
  if (p.includes('*')) return true
  return actions.some((a) => p.includes(a))
}

export type ResourceCrudOp =
  | 'access'
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'

/** UI guard for `${resource}.${op}` (e.g. `products.update`). */
export function perm(resource: string, op: ResourceCrudOp): boolean {
  return hasPermission(`${resource}.${op}`)
}

/** First URL segment (path) → permission resource key (underscore). */
const PATH_FIRST_SEGMENT_TO_RESOURCE: Record<string, string> = {
  dashboard: 'dashboard',
  orders: 'orders',
  restaurant: 'restaurants',
  'delivery-locations': 'delivery_locations',
  types: 'types',
  products: 'products',
  menus: 'menus',
  sections: 'sections',
  users: 'users',
  roles: 'roles',
  permissions: 'roles',
  offers: 'offers',
  customers: 'customers',
  coupons: 'coupons',
}

function resourceKeyFromAdminPath(pathname: string): string | null {
  const norm = (pathname.replace(/\/+$/, '') || '/').toLowerCase()
  const first = norm.split('/').filter(Boolean)[0]
  if (!first) return null
  return PATH_FIRST_SEGMENT_TO_RESOURCE[first] ?? null
}

/** Create route → `*.create`; edit route (has id) → `*.update`. */
export function canSubmitResourceForm(resource: string, isEditMode: boolean): boolean {
  return isEditMode ? perm(resource, 'update') : perm(resource, 'create')
}

/** Any permission that allows opening the orders list (narrow or broad). */
export function hasOrdersReadUiAccess(): boolean {
  const p = getStoredPermissions()
  if (p === null || p.length === 0) return false
  if (p.includes('*') || p.includes('orders.read')) return true
  return p.some(
    (x) =>
      x.startsWith('orders.read_status.') || x.startsWith('orders.read_payment.'),
  )
}

/** Create / update orders in UI (broad or status/payment-scoped update). */
export function hasOrdersMutationUiAccess(): boolean {
  const p = getStoredPermissions()
  if (p === null || p.length === 0) return false
  if (p.includes('*')) return true
  if (p.includes('orders.create') || p.includes('orders.update')) return true
  return p.some(
    (x) =>
      x.startsWith('orders.update_status.') ||
      x.startsWith('orders.update_payment.'),
  )
}

/**
 * Dashboard: "Ready" (kitchen) — only scoped confirmed/preparing updates, no wildcard/broad/pending.
 */
export function canDashboardOrdersMarkReady(): boolean {
  if (!hasOrdersMutationUiAccess()) return false
  const p = getStoredPermissions()
  if (p === null || p.length === 0) return false
  if (p.includes('*') || p.includes('orders.update')) return false
  return p.includes('orders.update_status.confirmed') || p.includes('orders.update_status.preparing')
}

/**
 * Dashboard: delivery actions — only ready/on_the_way scoped updates.
 */
export function canDashboardOrdersDelivery(): boolean {
  if (!hasOrdersMutationUiAccess()) return false
  const p = getStoredPermissions()
  if (p === null || p.length === 0) return false
  if (p.includes('*') || p.includes('orders.update')) return false
  return p.includes('orders.update_status.ready') || p.includes('orders.update_status.on_the_way')
}

/**
 * Dashboard: confirm/cancel (and other admin order actions) when not kitchen-only or delivery-only.
 */
export function canDashboardShowAdminOrderActions(): boolean {
  if (!hasOrdersMutationUiAccess()) return false
  if (canDashboardOrdersMarkReady()) return false
  if (canDashboardOrdersDelivery()) return false
  const p = getStoredPermissions()
  if (p === null || p.length === 0) return false
  return true
}

/**
 * Rough map for tooling: primary data permission (UI also needs `*.access` when using RBAC).
 * @deprecated Prefer `canAccessPath` / `canSeeNavPath` which enforce `*.access`.
 */
export function getRequiredPermissionForPath(pathname: string): string | string[] | null {
  const p = (pathname.replace(/\/+$/, '') || '/').toLowerCase()
  if (p === '/' || p === '/dashboard') return 'dashboard.access'
  if (p.startsWith('/stats')) return 'stats.read'

  const segments = p.split('/').filter(Boolean)
  const first = segments[0]
  const resKey = first ? PATH_FIRST_SEGMENT_TO_RESOURCE[first] : undefined
  if (!resKey) return null

  const isCreation = segments.includes('creation')
  if (isCreation) {
    const cIdx = segments.indexOf('creation')
    const idAfter = cIdx >= 0 ? segments[cIdx + 1] : undefined
    if (idAfter) {
      return [`${resKey}.read`, `${resKey}.update`]
    }
    return [`${resKey}.create`, `${resKey}.update`]
  }
  return `${resKey}.read`
}

/** Order used when a route is denied — pick first reachable module (avoids redirect loop if Dashboard is gated). */
const PANEL_PATH_PRIORITY: readonly string[] = [
  '/dashboard',
  '/orders',
  '/stats',
  '/restaurant',
  '/delivery-locations',
  '/types',
  '/products',
  '/menus',
  '/sections',
  '/offers',
  '/coupons',
  '/customers',
  '/users',
  '/roles',
  '/permissions',
]

export function getFirstAccessiblePanelPath(): string | null {
  for (const path of PANEL_PATH_PRIORITY) {
    if (canAccessPath(path)) return path
  }
  return null
}

/** Sidebar / module entry: show link if user may open that admin section (`*.access`). */
export function canSeeNavPath(to: string): boolean {
  const norm = (to.replace(/\/+$/, '') || '/').toLowerCase()
  if (norm === '/' || norm === '/dashboard') {
    return perm('dashboard', 'access')
  }

  if (norm === '/orders' || norm.startsWith('/orders/')) {
    return perm('orders', 'access')
  }
  if (norm.startsWith('/stats')) {
    return perm('stats', 'access')
  }

  const resKey = resourceKeyFromAdminPath(to)
  if (!resKey) return true
  return perm(resKey, 'access')
}

export function canAccessPath(pathname: string): boolean {
  const norm = (pathname.replace(/\/+$/, '') || '/').toLowerCase()
  if (norm === '/' || norm === '/dashboard') {
    return perm('dashboard', 'access')
  }

  if (norm === '/orders' || norm.startsWith('/orders/')) {
    if (!perm('orders', 'access')) return false
    const segments = norm.split('/').filter(Boolean)
    if (segments.includes('creation')) {
      return hasOrdersMutationUiAccess()
    }
    return hasOrdersReadUiAccess()
  }

  if (norm.startsWith('/stats')) {
    return perm('stats', 'access') && perm('stats', 'read')
  }

  const resKey = resourceKeyFromAdminPath(pathname)
  if (!resKey) return true

  if (!perm(resKey, 'access')) return false

  const segments = norm.split('/').filter(Boolean)
  const isCreation = segments.includes('creation')
  if (isCreation) {
    const cIdx = segments.indexOf('creation')
    const idAfter = cIdx >= 0 ? segments[cIdx + 1] : undefined
    if (idAfter) {
      return hasAnyPermission([`${resKey}.read`, `${resKey}.update`])
    }
    return hasAnyPermission([`${resKey}.create`, `${resKey}.update`])
  }

  return perm(resKey, 'read')
}
