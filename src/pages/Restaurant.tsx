import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { getRestaurantsList } from '../utils/api'
import type { Restaurant as RestaurantType } from '../utils/api'

export default function Restaurant() {
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    getRestaurantsList()
      .then((data) => {
        if (!mounted) return
        setRestaurants(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load')
        setRestaurants([])
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
      <h1>Restaurants</h1>

      <section style={{ marginTop: 16 }}>
        <div style={{ marginTop: 8 }}>
          <Link to="/restaurant/creation"><Button variant="primary">Create new restaurant</Button></Link>
        </div>
      </section>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
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
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {restaurants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11}>No restaurants found.</TableCell>
                </TableRow>
              )}
              {restaurants.map((r) => (
                <TableRow key={r.id || r.name}>
                  <TableCell>{String(r.id ?? '')}</TableCell>
                  <TableCell>{r.name ?? ''}</TableCell>
                  <TableCell>{r.address ?? ''}</TableCell>
                  <TableCell>{r.city ?? r?.address?.city ?? ''}</TableCell>
                  <TableCell>{r.province ?? ''}</TableCell>
                  <TableCell>{r.zipCode ?? ''}</TableCell>
                  <TableCell>{r.country ?? ''}</TableCell>
                  <TableCell>{r.latitude ?? ''}</TableCell>
                  <TableCell>{r.longitude ?? ''}</TableCell>
                  <TableCell>{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</TableCell>
                  <TableCell>
                    <Link to={`/restaurant/creation/${encodeURIComponent(String(r.id ?? ''))}`} style={{ marginRight: 8 }}><Button variant="ghost" size="sm">Edit</Button></Link>
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
