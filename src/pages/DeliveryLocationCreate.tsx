import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Checkbox } from '../components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import { createDeliveryLocation, getDeliveryLocationById, updateDeliveryLocation, getRestaurantsList } from '../utils/api'
import type { CreateDeliveryLocationPayload, Restaurant as RestaurantType } from '../utils/api'

const DEFAULT_MIN_DELIVERY_MINUTES = 10

type DeliveredByEntry = {
  restaurantId: number
  deliveryFee: number
  minOrder: number
  minDeliveryTimeMinutes: number
  isActive?: boolean
}

export default function DeliveryLocationCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<CreateDeliveryLocationPayload>>({
    name: '',
    address: '',
    streetNumber: '',
    city: '',
    province: '',
    image: '',
    zipCode: '',
    country: '',
    description: '',
    latitude: '',
    longitude: '',
    isActive: true,
  })

  const [selectedDeliveredBy, setSelectedDeliveredBy] = useState<DeliveredByEntry[]>([])

  const [restaurants, setRestaurants] = useState<RestaurantType[]>([])
  const [restaurantsLoading, setRestaurantsLoading] = useState(true)
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        if (params.id) {
          const data = await getDeliveryLocationById(params.id)
          if (!mounted) return
          if (data) {
            setForm({
              name: data.name ?? '',
              address: data.address ?? '',
              streetNumber: data.streetNumber ?? '',
              city: data.city ?? '',
              province: data.province ?? '',
              image: data.image ?? '',
              zipCode: data.zipCode ?? '',
              country: data.country ?? '',
              description: data.description ?? '',
              latitude: data.latitude !== undefined && data.latitude !== null ? String(data.latitude) : '',
              longitude: data.longitude !== undefined && data.longitude !== null ? String(data.longitude) : '',
              isActive: data.isActive ?? true,
            })

            if (Array.isArray((data as unknown as Record<string, unknown>)?.deliveredBy)) {
              const entries = ((data as unknown as Record<string, unknown>)?.deliveredBy as unknown[]).map((d) => {
                const entry = d as Record<string, unknown>
                // Handle both restaurantId (direct) and id (from restaurant object)
                const restaurantId = entry['restaurantId'] ?? entry['id']
                const rawMinTime = entry['minDeliveryTimeMinutes']
                const minDeliveryTimeMinutes =
                  rawMinTime !== undefined && rawMinTime !== null && String(rawMinTime) !== ''
                    ? Math.max(0, Math.floor(Number(rawMinTime)))
                    : DEFAULT_MIN_DELIVERY_MINUTES
                return {
                  restaurantId: Number(String(restaurantId ?? '')),
                  deliveryFee: entry['deliveryFee'] !== undefined && entry['deliveryFee'] !== null ? Number(entry['deliveryFee']) : 0,
                  minOrder: entry['minOrder'] !== undefined && entry['minOrder'] !== null ? Number(entry['minOrder']) : 0,
                  minDeliveryTimeMinutes: Number.isFinite(minDeliveryTimeMinutes) ? minDeliveryTimeMinutes : DEFAULT_MIN_DELIVERY_MINUTES,
                  isActive: entry['isActive'] === undefined ? true : Boolean(entry['isActive']),
                } as DeliveredByEntry
              })
              setSelectedDeliveredBy(entries)
            }
          }
        }

        const rest = await getRestaurantsList()
        if (!mounted) return
        setRestaurants(rest)
        setRestaurantsError(null)
      } catch (err: unknown) {
        if (!mounted) return
        setRestaurantsError(err instanceof Error ? err.message : String(err))
        setRestaurants([])
      } finally {
        if (mounted) setRestaurantsLoading(false)
      }
    }

    load()

    return () => { mounted = false }
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const latRaw = String(form.latitude ?? '').trim()
    const lonRaw = String(form.longitude ?? '').trim()

    let latitude: number | undefined = undefined
    let longitude: number | undefined = undefined

    if (latRaw !== '') {
      const latNum = Number(latRaw)
      if (Number.isNaN(latNum)) {
        setError(t('common.geoLatInvalid'))
        setSubmitting(false)
        return
      }
      if (latNum < -90 || latNum > 90) {
        setError(t('common.geoLatRange'))
        setSubmitting(false)
        return
      }
      latitude = latNum
    }

    if (lonRaw !== '') {
      const lonNum = Number(lonRaw)
      if (Number.isNaN(lonNum)) {
        setError(t('common.geoLngInvalid'))
        setSubmitting(false)
        return
      }
      if (lonNum < -180 || lonNum > 180) {
        setError(t('common.geoLngRange'))
        setSubmitting(false)
        return
      }
      longitude = lonNum
    }

    const payload: CreateDeliveryLocationPayload = {
      name: String(form.name ?? '').trim(),
      address: String(form.address ?? '').trim(),
      streetNumber: String(form.streetNumber ?? '').trim(),
      city: String(form.city ?? '').trim(),
      province: String(form.province ?? '').trim(),
      image: String(form.image ?? '').trim(),
      zipCode: String(form.zipCode ?? '').trim(),
      country: String(form.country ?? '').trim(),
      description: String(form.description ?? '').trim(),
      latitude,
      longitude,
      isActive: !!form.isActive,
      deliveredBy: selectedDeliveredBy.map((entry) => ({
        restaurantId: entry.restaurantId,
        deliveryFee: entry.deliveryFee,
        minOrder: entry.minOrder,
        minDeliveryTimeMinutes: entry.minDeliveryTimeMinutes,
        isActive: entry.isActive,
      })),
    }

    try {
      if (params.id) {
        await updateDeliveryLocation(params.id, payload)
      } else {
        await createDeliveryLocation(payload)
      }
      navigate('/delivery-locations')
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
          {params.id ? t('createForms.editDeliveryLocation') : t('createForms.createDeliveryLocation')}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 max-w-5xl lg:grid-cols-2"
      >
        {/* Basic location info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {params.id ? t('createForms.updateLocation') : t('createForms.locationDetailsTitle')}
            </CardTitle>
            <CardDescription>
              {t('createForms.locationCardDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">{t('createForms.locationNameStar')}</Label>
              <Input 
                id="name"
                className="mt-1.5 w-full"
                value={form.name as string} 
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} 
                placeholder={t('common.locationNamePh')} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">{t('common.address')}</Label>
                <Input 
                  id="address"
                  className="mt-2 w-full"
                  value={form.address as string} 
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} 
                  placeholder={t('common.streetAddressPh')}
                />
              </div>
              <div>
                <Label htmlFor="streetNumber">{t('common.houseNumber')}</Label>
                <Input 
                  id="streetNumber"
                  className="mt-2 w-full"
                  value={form.streetNumber as string} 
                  onChange={(e) => setForm((s) => ({ ...s, streetNumber: e.target.value }))} 
                  placeholder={t('common.numberPh')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="city">{t('common.city')}</Label>
                <Input 
                  id="city"
                  className="mt-1.5 w-full"
                  value={form.city as string} 
                  onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} 
                  placeholder={t('common.cityPh')}
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="zipCode">{t('common.zipCode')}</Label>
                <Input 
                  id="zipCode"
                  className="mt-1.5 w-full"
                  value={form.zipCode as string} 
                  onChange={(e) => setForm((s) => ({ ...s, zipCode: e.target.value }))} 
                  placeholder={t('common.zipPh')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="province">{t('common.province')}</Label>
                <Input 
                  id="province"
                  className="mt-1.5 w-full"
                  value={form.province as string} 
                  onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))} 
                  placeholder={t('common.provincePh')}
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="country">{t('common.country')}</Label>
                <Input 
                  id="country"
                  className="mt-1.5 w-full"
                  value={form.country as string} 
                  onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} 
                  placeholder={t('common.countryPh')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea 
                id="description"
                className="mt-1.5 w-full"
                value={form.description as string} 
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} 
                placeholder={t('common.deliveryAreaPh')}
              />
            </div>

          </CardContent>
        </Card>

        {/* Coordinates & status */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('common.coordinatesStatus')}</CardTitle>
            <CardDescription>{t('common.coordinatesDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">{t('common.latitude')}</Label>
                <Input 
                  id="latitude"
                  className="mt-1.5 w-full"
                  value={form.latitude as string} 
                  onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))} 
                  placeholder={t('common.latPh')}
                  type="number" 
                  step="any"
                />
              </div>
              <div>
                <Label htmlFor="longitude">{t('common.longitude')}</Label>
                <Input 
                  id="longitude"
                  className="mt-1.5 w-full"
                  value={form.longitude as string} 
                  onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))} 
                  placeholder={t('common.lngPh')}
                  type="number" 
                  step="any"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox 
                id="isActive"
                checked={!!form.isActive}
                onCheckedChange={(checked) => setForm((s) => ({ ...s, isActive: checked }))}
              />
              <Label htmlFor="isActive" className="mb-0 cursor-pointer text-sm">{t('common.activeLocation')}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Restaurants & delivery settings */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('deliveryLocationsPage.restaurantsLabel')}</CardTitle>
            <CardDescription>
              {t('common.restaurantsCardDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('deliveryLocationsPage.restaurantsLabel')}</Label>
              {restaurantsLoading ? (
                <div className="mt-2 text-sm text-gray-500">{t('common.loadingRestaurants')}</div>
              ) : restaurantsError ? (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{restaurantsError}</AlertDescription>
                </Alert>
              ) : (
                <div className="flex gap-4 mt-2">
                  {/* Available Restaurants */}
                  <div className="flex-1">
                    <div className="font-semibold mb-1 text-sm">{t('common.available')}</div>
                    <div className="border rounded p-2 h-40 overflow-y-auto bg-white dark:bg-slate-900">
                      {restaurants.filter(r => !selectedDeliveredBy.some(e => e.restaurantId === Number(r.id))).length === 0 && (
                        <div className="text-xs text-gray-400">{t('common.noMoreRestaurants')}</div>
                      )}
                      {restaurants.filter(r => !selectedDeliveredBy.some(e => e.restaurantId === Number(r.id))).map(r => (
                        <div key={r.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded cursor-pointer group">
                          <span>{r.name ?? String(r.id)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-green-600 hover:text-green-800 text-xs font-bold opacity-80 group-hover:opacity-100"
                            onClick={() =>
                              setSelectedDeliveredBy(list => [
                                ...list,
                                { restaurantId: Number(r.id), deliveryFee: 0, minOrder: 0, minDeliveryTimeMinutes: DEFAULT_MIN_DELIVERY_MINUTES, isActive: true },
                              ])
                            }
                          >
                            {t('common.add')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Selected Restaurants */}
                  <div className="flex-1">
                    <div className="font-semibold mb-1 text-sm">{t('common.selected')}</div>
                    <div className="border rounded p-2 h-40 overflow-y-auto bg-white dark:bg-slate-900">
                      {selectedDeliveredBy.length === 0 && (
                        <div className="text-xs text-gray-400">{t('common.noRestaurantsSelected')}</div>
                      )}
                      {selectedDeliveredBy.map((entry) => {
                        const rest = restaurants.find(r => Number(r.id) === Number(entry.restaurantId))
                        return (
                          <div key={entry.restaurantId} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded cursor-pointer group">
                            <span>{rest?.name ?? entry.restaurantId}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-red-600 hover:text-red-800 text-xs font-bold opacity-80 group-hover:opacity-100"
                              onClick={() =>
                                setSelectedDeliveredBy(list =>
                                  list.filter(e => e.restaurantId !== entry.restaurantId),
                                )
                              }
                            >
                              {t('common.remove')}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">{t('common.pickerHintAddRemove')}</p>
            </div>

            {selectedDeliveredBy.length > 0 && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-lg">
                <h3 className="text-sm font-semibold">{t('common.deliverySettings')}</h3>
                {selectedDeliveredBy.map((entry, idx) => {
                  const rest = restaurants.find((r) => String(r.id) === String(entry.restaurantId))
                  return (
                    <div key={entry.restaurantId} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                      <div className="md:col-span-2">
                        <div className="text-sm font-medium">{rest?.name ?? entry.restaurantId}</div>
                      </div>
                      <div>
                        <Label className="text-xs">{t('common.deliveryFeeEuro')}</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={String(entry.deliveryFee)} 
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            setSelectedDeliveredBy((s) => s.map((it, i) => i === idx ? { ...it, deliveryFee: Number.isNaN(v) ? 0 : v } : it))
                          }} 
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t('common.minOrderEuro')}</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={String(entry.minOrder)} 
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            setSelectedDeliveredBy((s) => s.map((it, i) => i === idx ? { ...it, minOrder: Number.isNaN(v) ? 0 : v } : it))
                          }} 
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t('common.minDeliveryTimeMinutesLabel')}</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={String(entry.minDeliveryTimeMinutes)}
                          onChange={(e) => {
                            const v = Math.floor(Number(e.target.value))
                            setSelectedDeliveredBy((s) =>
                              s.map((it, i) =>
                                i === idx
                                  ? { ...it, minDeliveryTimeMinutes: Number.isNaN(v) || v < 0 ? DEFAULT_MIN_DELIVERY_MINUTES : v }
                                  : it,
                              ),
                            )
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={!!entry.isActive}
                          onCheckedChange={(checked) =>
                            setSelectedDeliveredBy((s) =>
                              s.map((it, i) => (i === idx ? { ...it, isActive: checked } : it)),
                            )
                          }
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-xs">{t('common.active')}</span>
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                          onClick={() =>
                            setSelectedDeliveredBy((s) =>
                              s.filter((it) => it.restaurantId !== entry.restaurantId),
                            )
                          }
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button variant="ghost" type="button" onClick={() => navigate('/delivery-locations')}>{t('common.cancel')}</Button>
              <Button variant="primary" type="submit" disabled={submitting}>{submitting ? t('common.saving') : params.id ? t('common.update') : t('common.create')}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
