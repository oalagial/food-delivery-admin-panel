import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createRestaurant, getRestaurantsList, getRestaurantByToken, updateRestaurant } from '../utils/api'
import type { CreateRestaurantPayload } from '../utils/api'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

export default function RestaurantCreate() {
  const { token } = useParams<{ token?: string }>()
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<unknown | null>(null)
  const [form, setForm] = useState({
    name: '',
    address: '',
    streetNumber: '',
    city: '',
    province: '',
    zipCode: '',
    country: '',
    image: '',
    description: '',
    latitude: '',
    longitude: '',
  })
  const [files, setFiles] = useState<FileList | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreateResult(null)

    const payload: CreateRestaurantPayload = {
      name: String(form.name || '').trim(),
      address: String(form.address || '').trim(),
      streetNumber: String(form.streetNumber || '').trim(),
      city: String(form.city || '').trim(),
      province: String(form.province || '').trim(),
      zipCode: String(form.zipCode || '').trim(),
      country: String(form.country || '').trim(),
      image: String(form.image || '').trim(),
      description: String(form.description || '').trim(),
    }

    const latRaw = String(form.latitude || '').trim()
    const lonRaw = String(form.longitude || '').trim()
    if (latRaw !== '') {
      const latNum = Number(latRaw)
      if (Number.isNaN(latNum)) {
        setCreateError('Latitude must be a valid number')
        setCreating(false)
        return
      }
      if (latNum < -90 || latNum > 90) {
        setCreateError('Latitude must be between -90 and 90')
        setCreating(false)
        return
      }
      ;(payload as unknown as { latitude?: number }).latitude = latNum
    }
    if (lonRaw !== '') {
      const lonNum = Number(lonRaw)
      if (Number.isNaN(lonNum)) {
        setCreateError('Longitude must be a valid number')
        setCreating(false)
        return
      }
      if (lonNum < -180 || lonNum > 180) {
        setCreateError('Longitude must be between -180 and 180')
        setCreating(false)
        return
      }
      ;(payload as unknown as { longitude?: number }).longitude = lonNum
    }

    try {
      let res
      if (token) {
        // Edit mode: use PUT
        res = await updateRestaurant(token, payload)
        setCreateResult(res)
      } else {
        res = await createRestaurant(payload)
        setCreateResult(res)
      }

      // Optionally refresh list
      await getRestaurantsList()

      // After success, navigate back to list
      navigate('/restaurant')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setCreateError(msg || (token ? 'Update failed' : 'Create failed'))
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (!token) return
    let mounted = true

    getRestaurantByToken(token)
      .then((data) => {
        if (!mounted) return
        if (data) {
          setForm((s) => ({
            ...s,
            name: String(data.name ?? ''),
            address: String(data.address ?? ''),
            streetNumber: String(data.streetNumber ?? ''),
            city: String(data.city ?? ''),
            province: String(data.province ?? ''),
            zipCode: String(data.zipCode ?? ''),
            country: String(data.country ?? ''),
            image: String(data.image ?? ''),
            description: String(data.description ?? ''),
            latitude: data.latitude != null ? String(data.latitude) : '',
            longitude: data.longitude != null ? String(data.longitude) : '',
          }))
        } else {
          setCreateError('Restaurant not found')
        }
      })
      .catch((err) => {
        setCreateError(err?.message || 'Failed to load restaurant')
      })

    return () => {
      mounted = false
    }
  }, [token])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{token ? 'Edit Restaurant' : 'Create Restaurant'}</h1>

      <form onSubmit={handleCreate} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input
            className="w-full"
            name="name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Restaurant name"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input
              name="address"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="Address"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
            <Input
              name="streetNumber"
              value={form.streetNumber}
              onChange={(e) => setForm((s) => ({ ...s, streetNumber: e.target.value }))}
              placeholder="Number"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Input
              name="city"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              placeholder="City"
              className="w-full"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP CODE</label>
            <Input
              name="zipCode"
              value={form.zipCode}
              onChange={(e) => setForm((s) => ({ ...s, zipCode: e.target.value }))}
              placeholder="ZIP CODE"
              className="w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <Input
              name="province"
              value={form.province}
              onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))}
              placeholder="Province"
              className="w-full"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <Input
              name="country"
              value={form.country}
              onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
              placeholder="Country"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            placeholder="Description..."
            className="w-full min-h-[90px] rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input
              name="latitude"
              value={form.latitude}
              onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))}
              placeholder="Latitude"
              type="number"
              step="any"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input
              name="longitude"
              value={form.longitude}
              onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))}
              placeholder="Longitude"
              type="number"
              step="any"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add Images</label>
          <div className="flex items-center gap-4">
            <input id="images" type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files)} />
            <label htmlFor="images"><Button variant="primary">Choose Images</Button></label>
            <div className="text-sm text-gray-500">{files && files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/restaurant"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button variant="primary" type="submit" disabled={creating}>{creating ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>

      {createError && <div className="text-red-600">{createError}</div>}
      {(() => {
        const createResultText = createResult ? (typeof createResult === 'string' ? createResult : JSON.stringify(createResult)) : null
        return createResultText ? <div className="text-green-600">{token ? 'Updated' : 'Created'}: {createResultText}</div> : null
      })()}
    </div>
  )
}
