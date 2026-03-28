import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUserRole } from '../utils/api'
import { canAccessPath, getFirstAccessiblePanelPath } from '../utils/permissions'
import { isDashboardPath, roleHasFullPanelAccess } from '../utils/userRoles'

/**
 * After auth: CHEF and DELIVERY_MAN may only open dashboard URLs; others get full panel.
 * With DB permissions stored after login, routes also require matching `*.read` / `*.create|update`.
 */
export default function RequireRouteAccess({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const role = getCurrentUserRole()

  if (!roleHasFullPanelAccess(role) && !isDashboardPath(location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!canAccessPath(location.pathname)) {
    const next = getFirstAccessiblePanelPath()
    if (next && next !== location.pathname) {
      return <Navigate to={next} replace />
    }
    return (
      <div className="panel p-8 text-center text-muted-foreground max-w-md mx-auto">
        <p className="text-lg font-medium text-foreground">{t('common.noAccessibleSectionTitle')}</p>
        <p className="mt-2 text-sm">{t('common.noAccessibleSectionBody')}</p>
      </div>
    )
  }

  return <>{children}</>
}
