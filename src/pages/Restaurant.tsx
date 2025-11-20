import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { getRestaurantsList, getRestaurantByToken } from '../utils/api'
import type { Restaurant as RestaurantType } from '../utils/api'

export default function Restaurant() {
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [fetchedByToken, setFetchedByToken] = useState<RestaurantType | null>(null)

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

  async function handleFetchByToken(e?: React.FormEvent) {
    e?.preventDefault()
    setFetchedByToken(null)
    if (!tokenInput) return setError('Please provide a token')
    setError(null)
    try {
      const res = await getRestaurantByToken(tokenInput)
      setFetchedByToken(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Failed to fetch by token')
    }
  }

  
 

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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Address</th>
              <th style={{ padding: 8 }}>City</th>
              <th style={{ padding: 8 }}>Province</th>
              <th style={{ padding: 8 }}>Zip</th>
              <th style={{ padding: 8 }}>Country</th>
              <th style={{ padding: 8 }}>Lat</th>
              <th style={{ padding: 8 }}>Lon</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: 12 }}>No restaurants found.</td>
              </tr>
            )}
            {restaurants.map((r) => (
              <tr key={r.id || r.name} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <td style={{ padding: 8 }}>{String(r.id ?? '')}</td>
                <td style={{ padding: 8 }}>{r.name ?? ''}</td>
                <td style={{ padding: 8 }}>{r.address ?? ''}</td>
                <td style={{ padding: 8 }}>{r.city ?? r?.address?.city ?? ''}</td>
                <td style={{ padding: 8 }}>{r.province ?? ''}</td>
                <td style={{ padding: 8 }}>{r.zipCode ?? ''}</td>
                <td style={{ padding: 8 }}>{r.country ?? ''}</td>
                <td style={{ padding: 8 }}>{r.latitude ?? ''}</td>
                <td style={{ padding: 8 }}>{r.longitude ?? ''}</td>
                <td style={{ padding: 8 }}>{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</td>
                <td style={{ padding: 8 }}>
                  <Link to={`/restaurant/creation`} style={{ marginRight: 8 }}><Button variant="ghost" size="sm">Edit</Button></Link>
                  <Button variant="danger" size="sm">Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
