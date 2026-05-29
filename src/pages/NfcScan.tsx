import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NfcFlowShell } from '../components/NfcFlowShell'
import { scanNfcTag } from '../utils/api'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function NfcScan() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mac = (searchParams.get('mac') ?? '').trim()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mac) {
      setError(t('nfcFlow.macMissing'))
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const result = await scanNfcTag(mac)
        if (cancelled) return
        const q = `mac=${encodeURIComponent(mac)}`
        if (result.empty) {
          navigate(`/nfc/bind?${q}`, { replace: true })
        } else {
          navigate(`/nfc/deliver?${q}`, { replace: true })
        }
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : t('nfcFlow.scanError')
        if (msg.toLowerCase().includes('not found')) {
          setError(t('nfcFlow.tagUnknown'))
        } else {
          setError(msg)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mac, navigate, t])

  return (
    <NfcFlowShell title={t('nfcFlow.scanLoading')} subtitle={mac || undefined}>
      {!error ? (
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          {t('nfcFlow.scanLoading')}
        </p>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </NfcFlowShell>
  )
}
