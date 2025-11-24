import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
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
    <div>
      <h1>Delivery Locations</h1>

      <section className="mt-3">
        <div className="mt-2">
          <Link to="/delivery-locations/creation"><Button variant="primary">Create new delivery location</Button></Link>
        </div>
      </section>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="mt-4">
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>ID</TableHeadCell>
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
              <TableHeadCell>Created</TableHeadCell>
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
                <TableCell>{String(loc.id ?? '')}</TableCell>
                <TableCell>{loc.name ?? ''}</TableCell>
                <TableCell>{loc.address ?? ''}</TableCell>
                <TableCell>{loc.city ?? ''}</TableCell>
                <TableCell>{loc.province ?? ''}</TableCell>
                <TableCell>{loc.zipCode ?? ''}</TableCell>
                <TableCell>{loc.country ?? ''}</TableCell>
                <TableCell>{loc.latitude ?? ''}</TableCell>
                <TableCell>{loc.longitude ?? ''}</TableCell>
                <TableCell>{loc.isActive ? 'Yes' : 'No'}</TableCell>
                <TableCell>{Array.isArray((loc as Partial<DeliveryLocation>).deliveredBy)
                  ? ((loc as Partial<DeliveryLocation>).deliveredBy as Array<{restaurantId?: number | string, deliveryFee?: number, minOrder?: number, isActive?: boolean}>).map(d => {
                    const name = restaurantsMap[String(d.restaurantId ?? '')] ?? String(d.restaurantId ?? '')
                    const fee = d.deliveryFee !== undefined ? ` fee:${d.deliveryFee}` : ''
                    const min = d.minOrder !== undefined ? ` min:${d.minOrder}` : ''
                    const act = d.isActive === false ? ' (inactive)' : ''
                    return `${name}${fee}${min}${act}`
                  }).join(', ')
                  : ''}</TableCell>
                <TableCell>{loc.createdAt ? new Date(String(loc.createdAt)).toLocaleString() : ''}</TableCell>
                <TableCell>
                  <Link to={`/delivery-locations/creation/${encodeURIComponent(String(loc.id ?? ''))}`} style={{ marginRight: 8 }}><Button variant="ghost" size="sm">Edit</Button></Link>
                  <Button variant="danger" size="sm">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
