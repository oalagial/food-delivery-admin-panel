import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function NfcFlowShell({ title, subtitle, children }: Props) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-orange-300 to-amber-600 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-2">
          <div className="w-32 h-32 sm:w-40 sm:h-40">
            <img src="/logo.png" alt={t('common.logoAlt')} className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="rounded-xl bg-white shadow-2xl border-0 p-6 space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
