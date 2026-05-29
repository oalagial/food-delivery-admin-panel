import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NfcFlowShell } from '../components/NfcFlowShell'
import { deliverNfcTag, scanNfcTag, type NfcTagScanResult } from '../utils/api'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function NfcDeliver() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const mac = (searchParams.get('mac') ?? '').trim()
  const [scan, setScan] = useState<NfcTagScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!mac) {
      setError(t('nfcFlow.macMissing'))
      setLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const result = await scanNfcTag(mac)
        if (cancelled) return
        if (result.empty) {
          window.location.replace(`/nfc/bind?mac=${encodeURIComponent(mac)}`)
          return
        }
        setScan(result)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t('nfcFlow.scanError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mac, t])

  async function handleDeliver() {
    if (!mac) return
    setError(null)
    setSubmitting(true)
    try {
      await deliverNfcTag({ mac })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('nfcFlow.scanError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!mac) {
    return (
      <NfcFlowShell title={t('nfcFlow.deliverTitle')}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('nfcFlow.macMissing')}</AlertDescription>
        </Alert>
      </NfcFlowShell>
    )
  }

  if (success) {
    return (
      <NfcFlowShell title={t('nfcFlow.deliverTitle')} subtitle={t('nfcFlow.deliverSuccess')}>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
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
    <NfcFlowShell title={t('nfcFlow.deliverTitle')} subtitle={t('nfcFlow.deliverSubtitle')}>
      {loading ? (
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          {t('nfcFlow.scanLoading')}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-muted/50 px-3 py-3 space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">{t('nfcFlow.tagMac')}: </span>
              <span className="font-mono break-all">{mac}</span>
            </div>
            {scan?.tag?.label ? (
              <div>
                <span className="text-muted-foreground">{t('nfcFlow.tagLabel')}: </span>
                {scan.tag.label}
              </div>
            ) : null}
            {scan?.order?.orderNumber != null ? (
              <p className="text-2xl font-bold text-center pt-2">
                {t('nfcFlow.orderHash', { number: scan.order.orderNumber })}
              </p>
            ) : null}
            {scan?.order?.status ? (
              <div className="text-center text-muted-foreground">
                {t('nfcFlow.status')}: {scan.order.status}
              </div>
            ) : null}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="button"
            variant="primary"
            className="w-full justify-center py-3 text-base"
            disabled={submitting || !scan?.order}
            onClick={() => void handleDeliver()}
          >
            {submitting ? t('common.loading') : t('nfcFlow.submitDeliver')}
          </Button>
        </div>
      )}
    </NfcFlowShell>
  )
}
