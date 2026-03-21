/** Mirrors backend `Role` enum — keep strings in sync. */
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CHEF: 'CHEF',
  USER: 'USER',
  DELIVERY_MAN: 'DELIVERY_MAN',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

const KNOWN_ROLES = new Set<string>(Object.values(UserRole))

/** CHEF and DELIVERY_MAN: dashboard only (sidebar + route guard). */
const DASHBOARD_ONLY_ROLES = new Set<UserRole>([UserRole.CHEF, UserRole.DELIVERY_MAN])

export function normalizeUserRole(raw: string | null | undefined): UserRole | null {
  if (raw == null || typeof raw !== 'string') return null
  const u = raw.trim().toUpperCase().replace(/[\s-]+/g, '_')
  return KNOWN_ROLES.has(u) ? (u as UserRole) : null
}

/**
 * When the JWT has no recognizable role claim, allow full panel (backward compatible).
 * CHEF / DELIVERY_MAN are restricted to dashboard routes only.
 */
export function roleHasFullPanelAccess(role: UserRole | null): boolean {
  if (role === null) return true
  return !DASHBOARD_ONLY_ROLES.has(role)
}

export function isDashboardPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/'
  return p === '/' || p === '/dashboard'
}
