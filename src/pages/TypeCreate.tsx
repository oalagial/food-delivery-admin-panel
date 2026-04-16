import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createType, getTypeById, updateType } from '../utils/api'
import { canSubmitResourceForm } from '../utils/permissions'
import { FormSaveBarrier } from '../components/FormSaveBarrier'
import type { CreateTypePayload } from '../utils/api'

export default function TypeCreate() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id
  const canSave = canSubmitResourceForm('types', editing)

  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<CreateTypePayload>>({ name: '', tag: '', description: '' })

  useEffect(() => {
    if (!editing) return
    let mounted = true
    setLoading(true)
    getTypeById(id as string)
      .then((data) => {
        if (!mounted) return
        if (data) setForm({ name: data.name || '', tag: data.tag || '', description: data.description || '' })
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

    const payload: CreateTypePayload = {
      name: String(form.name ?? '').trim(),
      tag: String(form.tag ?? '').trim(),
      description: String(form.description ?? '').trim(),
    }

    try {
      if (editing && id) {
        await updateType(id, payload)
      } else {
        await createType(payload)
      }
      navigate('/types')
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
          {editing ? t('createForms.editType') : t('createForms.createType')}
        </h1>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">{t('createForms.loading')}</CardContent>
        </Card>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 max-w-3xl lg:grid-cols-2"
        >
          <FormSaveBarrier canSave={canSave} alertClassName="lg:col-span-2">
          {/* Basic info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {editing ? t('createForms.updateType') : t('createForms.newType')}
              </CardTitle>
              <CardDescription>{t('common.createEditType')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('createForms.typeNameStar')}</Label>
                <Input
                  id="name"
                  className="mt-1.5 w-full"
                  value={form.name as string}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder={t('common.typeNamePh')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tag">{t('typesPage.tag')}</Label>
                <Input
                  id="tag"
                  className="mt-1.5 w-full"
                  value={form.tag as string}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, tag: e.target.value }))
                  }
                  placeholder={t('common.typeNamePh')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Description & actions */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('common.typeDescTitle')}</CardTitle>
              <CardDescription>
                {t('common.typeDescOptionalCard')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">{t('common.typeDescTitle')}</Label>
                <Textarea
                  id="description"
                  className="mt-1.5 w-full"
                  value={form.description as string}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder={t('common.typeDescPlaceholder')}
                />
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
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 lg:col-span-2 max-w-3xl">
            <Button
              variant="default"
              type="button"
              onClick={() => navigate('/types')}
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
