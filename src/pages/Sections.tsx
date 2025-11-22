import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { getSectionsList } from '../utils/api'
import type { SectionItem } from '../utils/api'

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sections</h1>
        <Link to="/sections/creation"><Button variant="primary">Create Section</Button></Link>
      </div>

      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Products</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(it => (
              <TableRow key={String(it.id)}>
                <TableCell>{it.id}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.typeId}</TableCell>
                <TableCell>{(it.productsIds || []).length}</TableCell>
                <TableCell>
                  <Link to={`/sections/creation/${it.id}`}><Button size="sm" variant="ghost">Edit</Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
