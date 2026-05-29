import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createNfcTag, getNfcTagById, updateNfcTag } from '../utils/api'
import { canSubmitResourceForm } from '../utils/permissions'
import { FormSaveBarrier } from '../components/FormSaveBarrier'
import type { CreateNfcTagPayload } from '../utils/api'

export default function NfcTagCreate() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id
  const canSave = canSubmitResourceForm('nfc_tags', editing)

  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<{
    mac: string
    label: string
    orderId: string
  }>({ mac: '', label: '', orderId: '' })

  useEffect(() => {
    if (!editing) return
    let mounted = true
    setLoading(true)
    getNfcTagById(id as string)
      .then((data) => {
        if (!mounted) return
        if (data) {
          setForm({
            mac: data.mac || '',
            label: data.label || '',
            orderId: data.orderId != null ? String(data.orderId) : '',
          })
        }
      })
      .catch((e) => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [editing, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSubmitting(true)
    setError(null)

    const mac = form.mac.trim()
    if (!mac) {
      setError(t('nfcTagsPage.macRequired'))
      setSubmitting(false)
      return
    }

    const orderIdRaw = form.orderId.trim()
    let orderId: number | null | undefined
    if (orderIdRaw === '') {
      orderId = editing ? null : undefined
    } else {
      const parsed = Number(orderIdRaw)
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError(t('nfcTagsPage.orderIdInvalid'))
        setSubmitting(false)
        return
      }
      orderId = parsed
    }

    const payload: CreateNfcTagPayload = {
      mac,
      label: form.label.trim() || null,
      ...(orderId !== undefined ? { orderId } : {}),
    }

    try {
      if (editing && id) {
        await updateNfcTag(id, payload)
      } else {
        await createNfcTag(payload)
      }
      navigate('/nfc-tags')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          {editing ? t('createForms.editNfcTag') : t('createForms.createNfcTag')}
        </h1>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">{t('createForms.loading')}</CardContent>
        </Card>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 max-w-3xl"
        >
          <FormSaveBarrier canSave={canSave}>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {editing ? t('createForms.updateNfcTag') : t('createForms.newNfcTag')}
                </CardTitle>
                <CardDescription>{t('createForms.nfcTagCardDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mac">{t('createForms.nfcTagMacStar')}</Label>
                  <Input
                    id="mac"
                    className="mt-1.5 w-full"
                    value={form.mac}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, mac: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="label">{t('nfcTagsPage.label')}</Label>
                  <Input
                    id="label"
                    className="mt-1.5 w-full"
                    value={form.label}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, label: e.target.value }))
                    }
                    placeholder={t('createForms.nfcTagLabelPh')}
                  />
                </div>

                <div>
                  <Label htmlFor="orderId">{t('nfcTagsPage.order')}</Label>
                  <Input
                    id="orderId"
                    type="number"
                    min={1}
                    step={1}
                    className="mt-1.5 w-full"
                    value={form.orderId}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, orderId: e.target.value }))
                    }
                    placeholder={t('createForms.nfcTagOrderPh')}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('createForms.nfcTagOrderHelp')}
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </FormSaveBarrier>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 max-w-3xl">
            <Button
              variant="default"
              type="button"
              onClick={() => navigate('/nfc-tags')}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={!canSave || submitting}>
              {submitting ? t('common.saving') : editing ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
