import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Alert, AlertDescription } from './ui/alert'
import { AlertCircle } from 'lucide-react'

type Props = {
  canSave: boolean
  children: ReactNode
  /** e.g. `lg:col-span-2` when the form is a multi-column grid */
  alertClassName?: string
}

export function FormSaveBarrier({ canSave, children, alertClassName }: Props) {
  const { t } = useTranslation()
  return (
    <>
      {!canSave ? (
        <Alert
          variant="default"
          className={`border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 ${alertClassName ?? ''}`}
        >
          <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            {t('common.formNoSavePermission')}
          </AlertDescription>
        </Alert>
      ) : null}
      <fieldset disabled={!canSave} className="contents min-w-0 border-0 p-0 m-0">
        {children}
      </fieldset>
    </>
  )
}
