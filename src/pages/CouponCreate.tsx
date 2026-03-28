import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import {
  createCoupon,
  updateCoupon,
  getCouponById,
  getRestaurantsList,
  getCustomersList,
  type CreateCouponPayload,
  type DiscountType,
  type Restaurant,
  type CustomerListItem,
} from '../utils/api'
import { canSubmitResourceForm } from '../utils/permissions'
import { FormSaveBarrier } from '../components/FormSaveBarrier'

function toDatetimeLocal(isoOrDate: string | Date | null | undefined): string {
  if (isoOrDate == null) return ''
  const d = new Date(isoOrDate)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

export default function CouponCreate() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id
  const canSave = canSubmitResourceForm('coupons', editing)

  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState<string | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [customers, setCustomers] = useState<CustomerListItem[]>([])

  const [form, setForm] = useState<{
    code: string
    name: string
    description: string
    restaurantId: string
    customerId: string
    maxUse: string
    type: DiscountType
    value: string
    startsAt: string
    endsAt: string
    isActive: boolean
  }>({
    code: '',
    name: '',
    description: '',
    restaurantId: '',
    customerId: '',
    maxUse: '',
    type: 'PERCENTAGE',
    value: '',
    startsAt: '',
    endsAt: '',
    isActive: true,
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [restList, custRes] = await Promise.all([
          getRestaurantsList('deletedBy=null').catch(() => []),
          getCustomersList({ page: 1, limit: 500 }).catch(() => ({ data: [] })),
        ])
        if (!mounted) return
        setRestaurants(Array.isArray(restList) ? restList : [])
        setCustomers(custRes?.data ?? [])
      } catch {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!editing || !id) return
    let mounted = true
    setLoading(true)
    getCouponById(id)
      .then((data) => {
        if (!mounted || !data) return
        setForm({
          code: data.code ?? '',
          name: data.name ?? '',
          description: data.description ?? '',
          restaurantId: data.restaurantId != null ? String(data.restaurantId) : '',
          customerId: data.customerId != null ? String(data.customerId) : '',
          maxUse: data.maxUse != null ? String(data.maxUse) : '',
          type: (data.type as DiscountType) ?? 'PERCENTAGE',
          value: data.value != null ? String(data.value) : '',
          startsAt: toDatetimeLocal(data.startsAt),
          endsAt: toDatetimeLocal(data.endsAt),
          isActive: data.isActive ?? true,
        })
      })
      .catch((e) => {
        if (mounted) setError(String(e))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [editing, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSubmitting(true)
    setError(null)

    const payload: CreateCouponPayload = {
      code: String(form.code).trim(),
      name: String(form.name).trim(),
      description: form.description.trim() || undefined,
      restaurantId: form.restaurantId ? Number(form.restaurantId) : undefined,
      customerId: form.customerId ? Number(form.customerId) : undefined,
      maxUse: form.maxUse ? Number(form.maxUse) : undefined,
      type: form.type,
      value: Number(form.value),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      isActive: form.isActive,
    }

    try {
      if (editing && id) {
        await updateCoupon(id, payload)
      } else {
        await createCoupon(payload)
      }
      navigate('/coupons')
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
          {editing ? t('createForms.editCoupon') : t('createForms.newCoupon')}
        </h1>
        <p className="text-gray-600 mt-1 dark:text-slate-400">
          {t('createForms.couponSubtitle')}
        </p>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">{t('common.loading')}</CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormSaveBarrier canSave={canSave}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Basic details + Scope */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('common.basicDetails')}</CardTitle>
                <CardDescription>{t('common.basicDetailsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="code">{t('common.couponCodeStar')}</Label>
                  <Input
                    id="code"
                    type="text"
                    className="mt-1.5 w-full font-mono"
                    value={form.code}
                    onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                    placeholder={t('common.couponCodePh')}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="name">{t('common.displayNameStar')}</Label>
                  <Input
                    id="name"
                    type="text"
                    className="mt-1.5 w-full"
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder={t('common.displayNamePh')}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t('common.description')}</Label>
                  <Input
                    id="description"
                    type="text"
                    className="mt-1.5 w-full"
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder={t('common.descOptionalPh')}
                    maxLength={255}
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-slate-700 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">{t('common.scope')}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                      {t('createForms.couponScopeDesc')}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="restaurantId">{t('common.restaurant')}</Label>
                    <Select
                      id="restaurantId"
                      className="mt-1.5 w-full"
                      value={form.restaurantId}
                      onChange={(e) => setForm((s) => ({ ...s, restaurantId: e.target.value }))}
                    >
                      <option value="">{t('common.allRestaurants')}</option>
                      {restaurants.map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          {r.name ?? t('common.idDisplay', { id: r.id })}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customerId">{t('common.customer')}</Label>
                    <Select
                      id="customerId"
                      className="mt-1.5 w-full"
                      value={form.customerId}
                      onChange={(e) => setForm((s) => ({ ...s, customerId: e.target.value }))}
                    >
                      <option value="">{t('common.allCustomers')}</option>
                      {customers.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name && c.email ? `${c.name} (${c.email})` : (c.email || c.name || t('common.idDisplay', { id: c.id }))}
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {t('createForms.couponCustomerHelp')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Discount & validity */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('common.discountValidity')}</CardTitle>
                <CardDescription>{t('common.discountValidityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">{t('common.discountTypeStar')}</Label>
                    <Select
                      id="type"
                      className="mt-1.5 w-full"
                      value={form.type}
                      onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as DiscountType }))}
                    >
                      <option value="PERCENTAGE">{t('common.percentageAmount')}</option>
                      <option value="FIXED">{t('common.fixedAmount')}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">{t('common.valueStar')}</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Input
                        id="value"
                        type="number"
                        min={0}
                        step={form.type === 'PERCENTAGE' ? 1 : 0.01}
                        className="w-full"
                        value={form.value}
                        onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))}
                        placeholder={form.type === 'PERCENTAGE' ? '10' : '5.00'}
                        required
                      />
                      <span className="text-sm text-gray-500 dark:text-slate-400 shrink-0 w-6">
                        {form.type === 'PERCENTAGE' ? '%' : '€'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="maxUse">{t('common.maxUses')}</Label>
                  <Input
                    id="maxUse"
                    type="number"
                    min={0}
                    className="mt-1.5 w-full"
                    value={form.maxUse}
                    onChange={(e) => setForm((s) => ({ ...s, maxUse: e.target.value }))}
                    placeholder={t('common.unlimited')}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startsAt">{t('common.validFromStar')}</Label>
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      className="mt-1.5 w-full"
                      value={form.startsAt}
                      onChange={(e) => setForm((s) => ({ ...s, startsAt: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endsAt">{t('common.validUntil')}</Label>
                    <Input
                      id="endsAt"
                      type="datetime-local"
                      className="mt-1.5 w-full"
                      value={form.endsAt}
                      onChange={(e) => setForm((s) => ({ ...s, endsAt: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm((s) => ({ ...s, isActive: !!checked }))}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">{t('common.activeCoupon')}</Label>
                </div>
              </CardContent>
            </Card>
          </div>
          </FormSaveBarrier>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-slate-700">
            <Button type="submit" variant="primary" disabled={!canSave || submitting}>
              {submitting ? t('common.saving') : editing ? t('common.saveChanges') : t('createForms.createCouponButton')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/coupons')}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
