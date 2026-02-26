import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createRestaurant, getRestaurantsList, getRestaurantById, updateRestaurant, getMenusList, updateMenu } from '../utils/api'
import type { CreateRestaurantPayload, MenuItem } from '../utils/api'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Select } from '../components/ui/select';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function RestaurantCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<boolean>(false)
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
    timeslotDurationMinutes: '',
    ordersPerTimeslot: '',
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [openingHours, setOpeningHours] = useState<Array<{ day: string; open: string; close: string }>>([])
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loadingMenus, setLoadingMenus] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreateResult(false)

    const payload: CreateRestaurantPayload & { openingHours?: any[] } = {
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

    // Add timeslotDurationMinutes if provided
    const timeslotDurationRaw = String(form.timeslotDurationMinutes || '').trim()
    if (timeslotDurationRaw !== '') {
      const timeslotDurationNum = Number(timeslotDurationRaw)
      if (!Number.isNaN(timeslotDurationNum) && timeslotDurationNum > 0) {
        ; (payload as unknown as { timeslotDurationMinutes?: number }).timeslotDurationMinutes = timeslotDurationNum
      }
    }

    // Add ordersPerTimeslot if provided
    const ordersPerTimeslotRaw = String(form.ordersPerTimeslot || '').trim()
    if (ordersPerTimeslotRaw !== '') {
      const ordersPerTimeslotNum = Number(ordersPerTimeslotRaw)
      if (!Number.isNaN(ordersPerTimeslotNum) && ordersPerTimeslotNum > 0) {
        ; (payload as unknown as { ordersPerTimeslot?: number }).ordersPerTimeslot = ordersPerTimeslotNum
      }
    }
    if (openingHours.length > 0) {
      payload.openingHours = openingHours
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
      ; (payload as unknown as { latitude?: number }).latitude = latNum
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
      ; (payload as unknown as { longitude?: number }).longitude = lonNum
    }

    try {
      if (id) {
        // Edit mode: use PUT
        await updateRestaurant(id, payload)
        setCreateResult(true)
      } else {
        await createRestaurant(payload)
        setCreateResult(true)
      }

      // Optionally refresh list
      await getRestaurantsList()

      // After success, navigate back to list
      navigate('/restaurant')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setCreateError(msg || (id ? 'Update failed' : 'Create failed'))
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoadingMenus(true)

    Promise.all([
      getRestaurantById(id),
      getMenusList(id)
    ])
      .then(([data, menusData]) => {
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
            timeslotDurationMinutes: (data as any).timeslotDurationMinutes != null ? String((data as any).timeslotDurationMinutes) : '',
            ordersPerTimeslot: (data as any).ordersPerTimeslot != null ? String((data as any).ordersPerTimeslot) : '',
          }))
          if (Array.isArray(data.openingHours)) {
            setOpeningHours(data.openingHours.map((oh: any) => ({
              day: oh.day || '',
              open: oh.open || '',
              close: oh.close || '',
            })))
          }
        } else {
          setCreateError('Restaurant not found')
        }
        setMenus(menusData || [])
      })
      .catch((err) => {
        setCreateError(err?.message || 'Failed to load restaurant')
      })
      .finally(() => {
        if (mounted) setLoadingMenus(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  const handleSetActiveMenu = async (menuId: string | number) => {
    try {
      setLoadingMenus(true)
      const menu = menus.find((m) => m.id === menuId)
      if (!menu) return

      // Get current menu data
      const menuAny = menu as any
      const payload = {
        name: menu.name || '',
        description: menu.description || undefined,
        sectionIds: Array.isArray(menu.sectionIds) ? menu.sectionIds : [],
        restaurantId: menuAny.restaurantId || menuAny.restaurant?.id || id,
        isActive: true,
      }

      await updateMenu(menuId, payload)

      // Reload menus to reflect the change
      if (id) {
        const updatedMenus = await getMenusList(id)
        setMenus(updatedMenus || [])
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to set menu as active')
    } finally {
      setLoadingMenus(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{id ? 'Edit Restaurant' : 'Create Restaurant'}</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{id ? 'Update Details' : 'Enter Restaurant Details'}</CardTitle>
          <CardDescription>Fill in all the required information below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                className="mt-2 w-full"
                name="name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Restaurant name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  className="mt-2 w-full"
                  name="address"
                  value={form.address}
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label htmlFor="streetNumber">House Number</Label>
                <Input
                  id="streetNumber"
                  className="mt-2 w-full"
                  name="streetNumber"
                  value={form.streetNumber}
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
                  name="city"
                  value={form.city}
                  onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  className="mt-2 w-full"
                  name="zipCode"
                  value={form.zipCode}
                  onChange={(e) => setForm((s) => ({ ...s, zipCode: e.target.value }))}
                  placeholder="ZIP"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  className="mt-2 w-full"
                  name="province"
                  value={form.province}
                  onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))}
                  placeholder="Province"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  className="mt-2 w-full"
                  name="country"
                  value={form.country}
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
                name="description"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Tell us about your restaurant..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  className="mt-2 w-full"
                  name="latitude"
                  value={form.latitude}
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
                  name="longitude"
                  value={form.longitude}
                  onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))}
                  placeholder="e.g., -74.0060"
                  type="number"
                  step="any"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeslotDurationMinutes">Timeslot Duration (minutes)</Label>
                <Input
                  id="timeslotDurationMinutes"
                  className="mt-2 w-full"
                  name="timeslotDurationMinutes"
                  value={form.timeslotDurationMinutes}
                  onChange={(e) => setForm((s) => ({ ...s, timeslotDurationMinutes: e.target.value }))}
                  placeholder="e.g., 15"
                  type="number"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="ordersPerTimeslot">Orders Per Timeslot</Label>
                <Input
                  id="ordersPerTimeslot"
                  className="mt-2 w-full"
                  name="ordersPerTimeslot"
                  value={form.ordersPerTimeslot}
                  onChange={(e) => setForm((s) => ({ ...s, ordersPerTimeslot: e.target.value }))}
                  placeholder="e.g., 10"
                  type="number"
                  min="1"
                />
              </div>
            </div>

            {/* Opening Hours Section */}
            <div>
              <Label>Opening Hours</Label>
              <div className="space-y-2 mt-2">
                {openingHours.map((oh, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      className="border rounded px-2 py-1 w-36"
                      value={oh.day}
                      onChange={e =>
                        setOpeningHours(hrs =>
                          hrs.map((h, i) => (i === idx ? { ...h, day: e.target.value } : h)),
                        )
                      }
                    >
                      <option value="">Day</option>
                      {DAYS.map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="time"
                      className="w-28"
                      value={oh.open}
                      onChange={e =>
                        setOpeningHours(hrs =>
                          hrs.map((h, i) => (i === idx ? { ...h, open: e.target.value } : h)),
                        )
                      }
                      placeholder="Open"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      className="w-28"
                      value={oh.close}
                      onChange={e =>
                        setOpeningHours(hrs =>
                          hrs.map((h, i) => (i === idx ? { ...h, close: e.target.value } : h)),
                        )
                      }
                      placeholder="Close"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="ml-2"
                      onClick={() =>
                        setOpeningHours(hrs => hrs.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() =>
                    setOpeningHours(hrs => [...hrs, { day: '', open: '', close: '' }])
                  }
                >
                  Add Opening Hour
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="images">Images</Label>
              <div className="mt-2 flex items-center gap-4">
                <input id="images" type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files)} />
                <label htmlFor="images"><Button variant="primary" type="button">Choose Images</Button></label>
                <span className="text-sm text-gray-600">{files && files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}</span>
              </div>
            </div>

            {/* Menus Section - Only show when editing */}
            {id && (
              <div>
                <Label>Menus</Label>
                <div className="mt-2 space-y-3">
                  {loadingMenus ? (
                    <div className="text-sm text-gray-500">Loading menus...</div>
                  ) : menus.length === 0 ? (
                    <div className="text-sm text-gray-500">No menus found for this restaurant</div>
                  ) : (
                    <>
                      {/* Active Menu */}
                      {menus.filter((m: any) => m.isActive === true).map((menu) => (
                        <div key={menu.id} className="border rounded p-3 bg-green-50 border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-green-800">{menu.name}</span>
                              {menu.description && (
                                <p className="text-sm text-gray-600 mt-1">{menu.description}</p>
                              )}
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-200 text-green-800 rounded">Active</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Inactive Menus */}
                      {menus.filter((m: any) => m.isActive !== true).length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mt-3">Other Menus:</div>
                          {menus.filter((m: any) => m.isActive !== true).map((menu) => (
                            <div key={menu.id} className="border rounded p-3 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold">{menu.name}</span>
                                  {menu.description && (
                                    <p className="text-sm text-gray-600 mt-1">{menu.description}</p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleSetActiveMenu(menu.id!)}
                                  disabled={loadingMenus}
                                >
                                  Set as Active
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Link to="/restaurant"><Button variant="default" type="button">Cancel</Button></Link>
              <Button variant="primary" type="submit" disabled={creating}>{creating ? 'Saving...' : id ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {createResult && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{id ? 'Restaurant updated' : 'Restaurant created'} successfully!</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
