import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createRestaurant, getRestaurantsList } from '../utils/api'
import type { CreateRestaurantPayload } from '../utils/api'
import { Input } from '../components/ui/input'

export default function RestaurantCreate() {
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
      const res = await createRestaurant(payload)
      setCreateResult(res)
      // Optionally refresh: call getRestaurantsList to warm cache if needed
      await getRestaurantsList()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setCreateError(msg || 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <h1>Create Restaurant</h1>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
        <div className="p-2 bg-gray-100">Name</div>
          <Input
            className='p-4'
            name="name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Restaurant name"
            required
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div>Address</div>
            <Input
              name="address"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="Address"
            />
          </div>
          <div style={{ width: 180 }}>
            <div>House Number</div>
            <Input
              name="streetNumber"
              value={form.streetNumber}
              onChange={(e) => setForm((s) => ({ ...s, streetNumber: e.target.value }))}
              placeholder="Number"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flexGrow: 1 }}>
            <div>City</div>
            <Input
              name="city"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              placeholder="City"
            />
          </div>
          <div style={{ width: 140 }}>
            <div>ZIP CODE</div>
            <Input
              name="zipCode"
              value={form.zipCode}
              onChange={(e) => setForm((s) => ({ ...s, zipCode: e.target.value }))}
              placeholder="ZIP CODE"
            />
          </div>
          <div style={{ flexGrow: 1 }}>
            <div>Province</div>
            <Input
              name="province"
              value={form.province}
              onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))}
              placeholder="Province"
            />
          </div>
          <div style={{ width: 150 }}>
            <div>Country</div>
            <Input
              name="country"
              value={form.country}
              onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
              placeholder="Country"
            />
          </div>
        </div>

        <div>
          <div>Description</div>
          <textarea name="description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description..." style={{ width: '100%', minHeight: 90 }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div>Latitude</div>
            <Input
              name="latitude"
              value={form.latitude}
              onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))}
              placeholder="Latitude"
              type="number"
              step="any"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div>Longitude</div>
            <Input
              name="longitude"
              value={form.longitude}
              onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))}
              placeholder="Longitude"
              type="number"
              step="any"
            />
          </div>
        </div>

        <div>
          <div>Add Images</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input id="images" type="file" multiple style={{ display: 'none' }} onChange={(e) => setFiles(e.target.files)} />
            <div htmlFor="images" className="btn btn-primary">Choose Images</div>
            <div style={{ color: '#6b7280' }}>{files && files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Link to="/restaurant"><button type="button" className="btn btn-ghost">You go out</button></Link>
          <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? 'Saving...' : 'Save'}</button>
        </div>
      </form>

      {createError && <div style={{ color: 'red', marginTop: 12 }}>{createError}</div>}
      {(() => {
        const createResultText = createResult ? (typeof createResult === 'string' ? createResult : JSON.stringify(createResult)) : null
        return createResultText ? <div style={{ color: 'green', marginTop: 12 }}>Created: {createResultText}</div> : null
      })()}
    </div>
  )
}
