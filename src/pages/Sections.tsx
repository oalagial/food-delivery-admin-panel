import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit } from 'react-icons/fi'
import { getSectionsList } from '../utils/api'
import type { SectionItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'

export default function Sections() {
  const [items, setItems] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getSectionsList()
      .then(d => { if (mounted) setItems(d) })
      .catch(e => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
          <p className="text-gray-600 mt-1">Organize products into sections</p>
        </div>
        <Link to="/sections/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Section</Button></Link>
      </div>

      {loading ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Products</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 6 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : error ? <div className="text-red-600">{error}</div> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Products</TableHeadCell>
            <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(it => (
              <TableRow key={String(it.id)}>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.typeId}</TableCell>
                <TableCell>{(() => {
                  const rec = it as unknown as Record<string, unknown>
                  const prods = rec.products
                  if (Array.isArray(prods)) {
                    return (prods as Array<Record<string, unknown>>).map(p => String(p.name ?? p.id ?? '')).join(', ')
                  }
                  return (it.productsIds || []).length
                })()}</TableCell>
                <TableCell>{it.description ?? ''}</TableCell>
                <TableCell>
                  <Link to={`/sections/creation/${it.id}`}><Button size="sm" variant="ghost" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
