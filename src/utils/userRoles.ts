/** Mirrors backend role name strings — for display / JWT hints only (authorization is RBAC). */
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CHEF: 'CHEF',
  USER: 'USER',
  DELIVERY_MAN: 'DELIVERY_MAN',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

const KNOWN_ROLES = new Set<string>(Object.values(UserRole))

export function normalizeUserRole(raw: string | null | undefined): UserRole | null {
  if (raw == null || typeof raw !== 'string') return null
  const u = raw.trim().toUpperCase().replace(/[\s-]+/g, '_')
  return KNOWN_ROLES.has(u) ? (u as UserRole) : null
}
