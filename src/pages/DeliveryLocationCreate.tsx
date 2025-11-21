import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { createDeliveryLocation } from '../utils/api'
import { getRestaurantsList } from '../utils/api'
import type { CreateDeliveryLocationPayload, Restaurant as RestaurantType } from '../utils/api'

export default function DeliveryLocationCreate() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown | null>(null)

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
    restaurantIds: [],
  })

  const [restaurants, setRestaurants] = useState<RestaurantType[]>([])
  const [restaurantsLoading, setRestaurantsLoading] = useState(true)
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getRestaurantsList()
      .then((data) => {
        if (!mounted) return
        setRestaurants(data)
        setRestaurantsError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setRestaurantsError(err?.message || 'Failed to load restaurants')
        setRestaurants([])
      })
      .finally(() => {
        if (mounted) setRestaurantsLoading(false)
      })

    return () => { mounted = false }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)

    // Normalize restaurantIds: allow comma-separated input in form.restaurantIds (string)
    // Validate and normalize latitude/longitude to numbers
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
      restaurantIds: Array.isArray(form.restaurantIds)
        ? form.restaurantIds.map((v) => (typeof v === 'string' ? Number(v) : Number(v))).filter((n) => !Number.isNaN(n))
        : (typeof form.restaurantIds === 'string'
          ? String(form.restaurantIds).split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n))
          : []),
    }

    try {
      const res = await createDeliveryLocation(payload)
      setResult(res)
      navigate('/delivery-locations')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create Delivery Location</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input value={form.name as string} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Location name" className="w-full" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input value={form.address as string} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} placeholder="Address" className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
            <Input value={form.streetNumber as string} onChange={(e) => setForm((s) => ({ ...s, streetNumber: e.target.value }))} placeholder="Number" className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Input value={form.city as string} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} placeholder="City" className="w-full" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP CODE</label>
            <Input value={form.zipCode as string} onChange={(e) => setForm((s) => ({ ...s, zipCode: e.target.value }))} placeholder="ZIP CODE" className="w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <Input value={form.province as string} onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))} placeholder="Province" className="w-full" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <Input value={form.country as string} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} placeholder="Country" className="w-full" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description as string} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description..." className="w-full min-h-[90px] rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input value={form.latitude as string} onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))} placeholder="Latitude" type="number" step="any" className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input value={form.longitude as string} onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))} placeholder="Longitude" type="number" step="any" className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
              <span className="text-sm">Active</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurants</label>
            {restaurantsLoading ? (
              <div className="text-sm text-gray-500">Loading restaurants...</div>
            ) : restaurantsError ? (
              <div className="text-sm text-red-600">{restaurantsError}</div>
            ) : (
              <select
                multiple
                value={Array.isArray(form.restaurantIds) ? (form.restaurantIds as Array<number | string>).map(String) : []}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions).map((o) => Number(o.value)).filter((n) => !Number.isNaN(n))
                  setForm((s) => ({ ...s, restaurantIds: vals }))
                }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {restaurants.map((r) => (
                  <option key={r.id ?? r.name} value={String(r.id ?? '')}>{r.name ?? String(r.id)}</option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd (or use shift) to select multiple restaurants.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/delivery-locations')}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>

      {error && <div className="text-red-600">{error}</div>}
      {result != null && <div className="text-green-600">Created</div>}
    </div>
  )
}
