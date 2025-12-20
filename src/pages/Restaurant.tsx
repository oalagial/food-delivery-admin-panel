import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { getRestaurantsList } from '../utils/api'
import type { Restaurant as RestaurantType } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant locations</p>
        </div>
        <Link to="/restaurant/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Restaurant</Button></Link>
      </div>
      {loading && (
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
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Opening Hours</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 11 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
       {!loading && <div>
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
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Opening Hours</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {restaurants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12}>No restaurants found.</TableCell>
                </TableRow>
              )}
              {restaurants.map((r) => (
                <TableRow key={r.id || r.name}>
                  <TableCell>{r.name ?? ''}</TableCell>
                  <TableCell>{r.address ?? ''}</TableCell>
                  <TableCell>{r.city ?? ''}</TableCell>
                  <TableCell>{r.province ?? ''}</TableCell>
                  <TableCell>{r.zipCode ?? ''}</TableCell>
                  <TableCell>{r.country ?? ''}</TableCell>
                  <TableCell>{r.latitude ?? ''}</TableCell>
                  <TableCell>{r.longitude ?? ''}</TableCell>
                  <TableCell>{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</TableCell>
                  <TableCell>
                    {Array.isArray(r.openingHours) && r.openingHours.length > 0 ? (
                      <>
                        {`${r.openingHours[0].day}: ${r.openingHours[0].open}-${r.openingHours[0].close}`}
                        {r.openingHours.length > 1 && (
                          <span className="text-xs text-gray-500 ml-2">+{r.openingHours.length - 1} more</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No hours</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to={`/restaurant/creation/${encodeURIComponent(String(r.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                    <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />}></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>}
    </div>
  )
}
