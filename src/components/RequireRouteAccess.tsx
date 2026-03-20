import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUserRole } from '../utils/api'
import { isDashboardPath, roleHasFullPanelAccess } from '../utils/userRoles'

/**
 * After auth: CHEF and DELIVERY_MAN may only open dashboard URLs; others get full panel.
 */
export default function RequireRouteAccess({ children }: { children: ReactNode }) {
  const location = useLocation()
  const role = getCurrentUserRole()

  if (!roleHasFullPanelAccess(role) && !isDashboardPath(location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
