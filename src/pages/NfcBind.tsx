import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NfcFlowShell } from '../components/NfcFlowShell'
import { bindNfcTag } from '../utils/api'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function NfcBind() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const mac = (searchParams.get('mac') ?? '').trim()
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const num = Number.parseInt(orderNumber.trim(), 10)
    if (!Number.isFinite(num) || num < 1) {
      setError(t('nfcFlow.invalidOrderNumber'))
      return
    }
    if (!mac) {
      setError(t('nfcFlow.macMissing'))
      return
    }

    setLoading(true)
    try {
      await bindNfcTag({ mac, orderNumber: num })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('nfcFlow.scanError'))
    } finally {
      setLoading(false)
    }
  }

  if (!mac) {
    return (
      <NfcFlowShell title={t('nfcFlow.bindTitle')}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('nfcFlow.macMissing')}</AlertDescription>
        </Alert>
      </NfcFlowShell>
    )
  }

  if (success) {
    return (
      <NfcFlowShell title={t('nfcFlow.bindTitle')} subtitle={t('nfcFlow.bindSuccess')}>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="text-sm text-muted-foreground font-mono break-all">{mac}</p>
          <Link
            to={`/nfc/scan?mac=${encodeURIComponent(mac)}`}
            className="w-full inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('nfcFlow.backToScan')}
          </Link>
        </div>
      </NfcFlowShell>
    )
  }

  return (
    <NfcFlowShell title={t('nfcFlow.bindTitle')} subtitle={t('nfcFlow.bindSubtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-1">
          <div>
            <span className="text-muted-foreground">{t('nfcFlow.tagMac')}: </span>
            <span className="font-mono break-all">{mac}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orderNumber">{t('nfcFlow.orderNumber')}</Label>
          <Input
            id="orderNumber"
            type="number"
            inputMode="numeric"
            min={1}
            autoFocus
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={t('nfcFlow.orderNumberPh')}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" variant="primary" className="w-full justify-center py-3" disabled={loading}>
          {loading ? t('common.loading') : t('nfcFlow.submitBind')}
        </Button>
      </form>
    </NfcFlowShell>
  )
}
