import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { getProductsList } from '../utils/api'
import type { Product } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { API_BASE } from '../config'
import { Input } from '../components/ui/input'

export default function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  

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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return items

    return items.filter(p =>
      p.name?.toLowerCase().includes(q)
    )
  }, [items, search])


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant products</p>
        </div>
        <div className="flex flex-row items-center gap-4">
          <div className="w-36">
            <Input
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/products/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Product</Button></Link>
        </div>
      </div>

      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Image</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Ingredients</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>Available</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Updated</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 10 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {error && <p className="text-red-600">{error}</p>}

        {!loading && (<Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Image</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Ingredients</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>Available</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Updated</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {(!loading && filteredItems.length === 0) && (
              <TableRow>
                <TableCell colSpan={10}>No products found.</TableCell>
              </TableRow>
            )}

            {filteredItems.map((p) => (
              <TableRow key={p.id ?? p.name}>
                <TableCell>{p.name ?? ''}</TableCell>
                <TableCell>
                  {p.image ? (
                    <img src={API_BASE + "/images/" + p.image} alt={p.name ?? 'product'} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded" />
                  )}
                </TableCell>
                <TableCell>{p.type.name ?? ''}</TableCell>
                <TableCell>{Array.isArray(p.ingredients) ? p.ingredients.join(', ') : ''}</TableCell>
                <TableCell>{p.price != null ? String(p.price) : ''}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center">
                    {p.isAvailable
                      ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Available" />
                      : <FiXCircle className="w-5 h-5 text-red-500" aria-label="Not available" />}
                  </span>
                </TableCell>
                <TableCell>{p.createdAt ? new Date(String(p.createdAt)).toLocaleString() : ''}</TableCell>
                <TableCell>{p.updatedAt ? new Date(String(p.updatedAt)).toLocaleString() : ''}</TableCell>
                <TableCell>
                  <div className="flex">
                    <Link to={`/products/creation/${encodeURIComponent(String(p.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                    <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />}></Button>

                  </div>
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
