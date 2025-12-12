import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createDeliveryLocation, getDeliveryLocationById, updateDeliveryLocation, getRestaurantsList } from '../utils/api'
import type { CreateDeliveryLocationPayload, Restaurant as RestaurantType } from '../utils/api'

type DeliveredByEntry = {
  restaurantId: number
  deliveryFee: number
  minOrder: number
  isActive?: boolean
}

export default function DeliveryLocationCreate() {
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
                return {
                  restaurantId: Number(String(entry['restaurantId'] ?? '')),
                  deliveryFee: entry['deliveryFee'] ? Number(entry['deliveryFee']) : 0,
                  minOrder: entry['minOrder'] ? Number(entry['minOrder']) : 0,
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

  function handleSelectChange(selectedIds: number[]) {
    const next = selectedIds.map((id) => {
      const found = selectedDeliveredBy.find((e) => e.restaurantId === id)
      return found ?? { restaurantId: id, deliveryFee: 0, minOrder: 0, isActive: true }
    })
    setSelectedDeliveredBy(next)
  }

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
        setError('Latitude must be a valid number')
        setSubmitting(false)
        return
      }
      if (latNum < -90 || latNum > 90) {
        setError('Latitude must be between -90 and 90')
        setSubmitting(false)
        return
      }
      latitude = latNum
    }

    if (lonRaw !== '') {
      const lonNum = Number(lonRaw)
      if (Number.isNaN(lonNum)) {
        setError('Longitude must be a valid number')
        setSubmitting(false)
        return
      }
      if (lonNum < -180 || lonNum > 180) {
        setError('Longitude must be between -180 and 180')
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
        <h1 className="text-3xl font-bold">{params.id ? 'Edit Delivery Location' : 'Create Delivery Location'}</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{params.id ? 'Update Location' : 'New Delivery Location'}</CardTitle>
          <CardDescription>Set up delivery area and restaurant assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Location Name *</Label>
              <Input 
                id="name"
                className="mt-2 w-full"
                value={form.name as string} 
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} 
                placeholder="Location name" 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address"
                  className="mt-2 w-full"
                  value={form.address as string} 
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} 
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label htmlFor="streetNumber">House Number</Label>
                <Input 
                  id="streetNumber"
                  className="mt-2 w-full"
                  value={form.streetNumber as string} 
                  onChange={(e) => setForm((s) => ({ ...s, streetNumber: e.target.value }))} 
                  placeholder="Number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city"
                  className="mt-2 w-full"
                  value={form.city as string} 
                  onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} 
                  placeholder="City"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input 
                  id="zipCode"
                  className="mt-2 w-full"
                  value={form.zipCode as string} 
                  onChange={(e) => setForm((s) => ({ ...s, zipCode: e.target.value }))} 
                  placeholder="ZIP"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="province">Province</Label>
                <Input 
                  id="province"
                  className="mt-2 w-full"
                  value={form.province as string} 
                  onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))} 
                  placeholder="Province"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country"
                  className="mt-2 w-full"
                  value={form.country as string} 
                  onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} 
                  placeholder="Country"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                className="mt-2 w-full"
                value={form.description as string} 
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} 
                placeholder="Describe this delivery area..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input 
                  id="latitude"
                  className="mt-2 w-full"
                  value={form.latitude as string} 
                  onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))} 
                  placeholder="e.g., 40.7128"
                  type="number" 
                  step="any"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input 
                  id="longitude"
                  className="mt-2 w-full"
                  value={form.longitude as string} 
                  onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))} 
                  placeholder="e.g., -74.0060"
                  type="number" 
                  step="any"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input 
                id="isActive"
                type="checkbox" 
                checked={!!form.isActive} 
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="mb-0 cursor-pointer">Active location</Label>
            </div>

            <div>
              <Label htmlFor="restaurants">Restaurants</Label>
              {restaurantsLoading ? (
                <div className="mt-2 text-sm text-gray-500">Loading restaurants...</div>
              ) : restaurantsError ? (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{restaurantsError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <select
                    id="restaurants"
                    multiple
                    value={selectedDeliveredBy.map((d) => String(d.restaurantId))}
                    onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions).map((o) => Number(o.value)).filter((n) => !Number.isNaN(n))
                      handleSelectChange(vals)
                    }}
                    className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id ?? r.name} value={String(r.id ?? '')}>{r.name ?? String(r.id)}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple restaurants</p>
                </>
              )}
            </div>

            {selectedDeliveredBy.length > 0 && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold">Delivery Settings</h3>
                {selectedDeliveredBy.map((entry, idx) => {
                  const rest = restaurants.find((r) => String(r.id) === String(entry.restaurantId))
                  return (
                    <div key={entry.restaurantId} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 bg-white rounded border">
                      <div className="md:col-span-2">
                        <div className="text-sm font-medium">{rest?.name ?? entry.restaurantId}</div>
                      </div>
                      <div>
                        <Label className="text-xs">Fee ($)</Label>
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
                        <Label className="text-xs">Min Order ($)</Label>
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
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={!!entry.isActive} 
                          onChange={(e) => setSelectedDeliveredBy((s) => s.map((it, i) => i === idx ? { ...it, isActive: e.target.checked } : it))}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-xs">Active</span>
                      </div>
                      <div>
                        <button 
                          type="button" 
                          className="text-xs text-red-600 hover:text-red-700 font-medium" 
                          onClick={() => setSelectedDeliveredBy((s) => s.filter((it) => it.restaurantId !== entry.restaurantId))}
                        >
                          Remove
                        </button>
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

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" type="button" onClick={() => navigate('/delivery-locations')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : params.id ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
