import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { getDeliveryLocationsList } from '../utils/api'
import type { Restaurant as DeliveryLocation } from '../utils/api'

export default function DeliveryLocations() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getDeliveryLocationsList()
      .then((data) => {
        if (!mounted) return
        setLocations(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load')
        setLocations([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

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
              <TableRow key={loc.id ?? loc.name}>
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
                <TableCell>{Array.isArray(loc.restaurantIds) ? loc.restaurantIds.join(', ') : ''}</TableCell>
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
