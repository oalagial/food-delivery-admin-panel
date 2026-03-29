import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { canAccessPath, getFirstAccessiblePanelPath } from '../utils/permissions'

/** After auth: routes require matching RBAC permissions (`*.access`, `*.read`, etc.). */
export default function RequireRouteAccess({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const [, setPermVersion] = useState(0)
  useEffect(() => {
    const bump = () => setPermVersion((v) => v + 1)
    window.addEventListener('auth', bump)
    return () => window.removeEventListener('auth', bump)
  }, [])

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
