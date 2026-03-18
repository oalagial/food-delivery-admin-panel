import { useEffect, useState } from 'react'
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

function toDatetimeLocal(isoOrDate: string | Date | null | undefined): string {
  if (isoOrDate == null) return ''
  const d = new Date(isoOrDate)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

export default function CouponCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id

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
          {editing ? 'Edit coupon' : 'New coupon'}
        </h1>
        <p className="text-gray-600 mt-1 dark:text-slate-400">
          General (for everyone) or per customer; optionally per restaurant.
        </p>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">Loading...</CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Basic details + Scope */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Basic details</CardTitle>
                <CardDescription>Code, name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="code">Coupon code *</Label>
                  <Input
                    id="code"
                    type="text"
                    className="mt-1.5 w-full font-mono"
                    value={form.code}
                    onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. WELCOME10"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name (display) *</Label>
                  <Input
                    id="name"
                    type="text"
                    className="mt-1.5 w-full"
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="e.g. Welcome discount"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    className="mt-1.5 w-full"
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="Optional description"
                    maxLength={255}
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-slate-700 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">Scope</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                      Optional: limit to a restaurant and/or a specific customer.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="restaurantId">Restaurant</Label>
                    <Select
                      id="restaurantId"
                      className="mt-1.5 w-full"
                      value={form.restaurantId}
                      onChange={(e) => setForm((s) => ({ ...s, restaurantId: e.target.value }))}
                    >
                      <option value="">All restaurants</option>
                      {restaurants.map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          {r.name ?? `ID ${r.id}`}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      id="customerId"
                      className="mt-1.5 w-full"
                      value={form.customerId}
                      onChange={(e) => setForm((s) => ({ ...s, customerId: e.target.value }))}
                    >
                      <option value="">General (all customers)</option>
                      {customers.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name && c.email ? `${c.name} (${c.email})` : (c.email || c.name || `ID ${c.id}`)}
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Leave empty for a general coupon; pick a customer for a per-customer coupon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Discount & validity */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Discount & validity</CardTitle>
                <CardDescription>Type, value, dates and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Discount type *</Label>
                    <Select
                      id="type"
                      className="mt-1.5 w-full"
                      value={form.type}
                      onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as DiscountType }))}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed amount (€)</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Value *</Label>
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
                  <Label htmlFor="maxUse">Max uses (empty = unlimited)</Label>
                  <Input
                    id="maxUse"
                    type="number"
                    min={0}
                    className="mt-1.5 w-full"
                    value={form.maxUse}
                    onChange={(e) => setForm((s) => ({ ...s, maxUse: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startsAt">Valid from *</Label>
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
                    <Label htmlFor="endsAt">Valid until</Label>
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
                  <Label htmlFor="isActive" className="cursor-pointer">Active coupon</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-slate-700">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Save changes' : 'Create coupon'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/coupons')}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
