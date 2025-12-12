import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { getDeliveryLocationsList, getRestaurantsList } from '../utils/api'
import type { CreateDeliveryLocationPayload as DeliveryLocation, Restaurant as RestaurantType } from '../utils/api'

export default function DeliveryLocations() {
  const [locations, setLocations] = useState<Partial<DeliveryLocation>[]>([])
  const [restaurantsMap, setRestaurantsMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadAll() {
      try {
        const locsRaw = await getDeliveryLocationsList()
        const restsRaw = await getRestaurantsList()

        if (!mounted) return

        // Normalize delivery locations to an array
        const locsArray = Array.isArray(locsRaw) ? locsRaw : (locsRaw && (locsRaw as any).items) || (locsRaw && (locsRaw as any).data) || []
        setLocations(locsArray as unknown as Partial<DeliveryLocation>[])

        // Normalize restaurants to an array and build id->name map
        const restsArray = Array.isArray(restsRaw) ? restsRaw : (restsRaw && (restsRaw as any).items) || (restsRaw && (restsRaw as any).data) || []
        const map: Record<string, string> = {}
        if (Array.isArray(restsArray)) {
          (restsArray as RestaurantType[]).forEach((r) => {
            if (r && r.id !== undefined) map[String(r.id)] = String(r.name ?? r.id)
          })
        }
        setRestaurantsMap(map)
        setError(null)
      } catch (err: unknown) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err) || 'Failed to load')
        setLocations([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAll()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Locations</h1>
          <p className="text-gray-600 mt-1">Manage delivery zones and locations</p>
        </div>
        <Link to="/delivery-locations/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Location</Button></Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="mt-4">
        {loading ? (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Address</TableHeadCell>
                <TableHeadCell>City</TableHeadCell>
                <TableHeadCell>Province</TableHeadCell>
                <TableHeadCell>Zip</TableHeadCell>
                <TableHeadCell>Country</TableHeadCell>
                <TableHeadCell>Lat</TableHeadCell>
                <TableHeadCell>Lon</TableHeadCell>
                <TableHeadCell>Active</TableHeadCell>
                <TableHeadCell>Restaurants</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, r) => (
                <TableRow key={r} className="animate-pulse">
                  {Array.from({ length: 13 }).map((__, c) => (
                    <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Address</TableHeadCell>
                <TableHeadCell>City</TableHeadCell>
                <TableHeadCell>Province</TableHeadCell>
                <TableHeadCell>Zip</TableHeadCell>
                <TableHeadCell>Country</TableHeadCell>
                <TableHeadCell>Lat</TableHeadCell>
                <TableHeadCell>Lon</TableHeadCell>
                <TableHeadCell>Active</TableHeadCell>
                <TableHeadCell>Restaurants</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {(!loading && locations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={13}>No delivery locations found.</TableCell>
                </TableRow>
              )}

              {locations.map((loc) => (
                <TableRow key={String(loc.id ?? '') + String(loc.name ?? '')}>
                  <TableCell>{loc.name ?? ''}</TableCell>
                  <TableCell>{loc.address ?? ''}</TableCell>
                  <TableCell>{loc.city ?? ''}</TableCell>
                  <TableCell>{loc.province ?? ''}</TableCell>
                  <TableCell>{loc.zipCode ?? ''}</TableCell>
                  <TableCell>{loc.country ?? ''}</TableCell>
                  <TableCell>{loc.latitude ?? ''}</TableCell>
                  <TableCell>{loc.longitude ?? ''}</TableCell>
                  <TableCell>{loc.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{(() => {
                    const anyLoc = loc as unknown as Record<string, unknown>
                    // Try several possible shapes returned by different API versions
                    const maybeArray = (key: string): unknown[] | null => {
                      const v = anyLoc[key]
                      return Array.isArray(v) ? (v as unknown[]) : null
                    }
                    const list = maybeArray('deliveredBy') ?? maybeArray('deliveredByRestaurants') ?? maybeArray('delivedByRestaurants') ?? []

                    return list.map((d) => {
                      const item = d as Record<string, unknown>
                      // d can be either: { restaurantId, deliveryFee, minOrder, isActive }
                      // or a full restaurant object with { id, name, ... }
                      let name = ''
                      if (typeof item.name === 'string' || item.id !== undefined) {
                        name = String(item.name ?? item.id)
                      } else if (item.restaurantId !== undefined) {
                        name = restaurantsMap[String(item.restaurantId ?? '')] ?? String(item.restaurantId ?? '')
                      }
                      const fee = (typeof item.deliveryFee === 'number' || typeof item.deliveryFee === 'string') ? ` fee:${String(item.deliveryFee)}` : ''
                      const min = (typeof item.minOrder === 'number' || typeof item.minOrder === 'string') ? ` min:${String(item.minOrder)}` : ''
                      const act = item.isActive === false ? ' (inactive)' : ''
                      return `${name}${fee}${min}${act}`
                    }).join(', ')
                  })()}</TableCell>
                  <TableCell>
                    <Link to={`/delivery-locations/creation/${encodeURIComponent(String(loc.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                    <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />}></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
