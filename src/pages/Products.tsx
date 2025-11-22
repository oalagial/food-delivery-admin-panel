import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { getProductsList } from '../utils/api'
import type { Product } from '../utils/api'

export default function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getProductsList()
      .then((data) => {
        if (!mounted) return
        setItems(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load')
        setItems([])
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  return (
    <div>
      <h1>Products</h1>

      <section className="mt-3">
        <div className="mt-2">
          <Link to="/products/creation"><Button variant="primary">Create new product</Button></Link>
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
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>Available</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {(!loading && items.length === 0) && (
              <TableRow>
                <TableCell colSpan={7}>No products found.</TableCell>
              </TableRow>
            )}

            {items.map((p) => (
              <TableRow key={p.id ?? p.name}>
                <TableCell>{String(p.id ?? '')}</TableCell>
                <TableCell>{p.name ?? ''}</TableCell>
                <TableCell>{p.typeId ?? ''}</TableCell>
                <TableCell>{p.price != null ? String(p.price) : ''}</TableCell>
                <TableCell>{p.isAvailable ? 'Yes' : 'No'}</TableCell>
                <TableCell>{p.createdAt ? new Date(String(p.createdAt)).toLocaleString() : ''}</TableCell>
                <TableCell>
                  <Link to={`/products/creation/${encodeURIComponent(String(p.id ?? ''))}`} style={{ marginRight: 8 }}><Button variant="ghost" size="sm">Edit</Button></Link>
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
