import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit } from 'react-icons/fi'
import { getMenusList } from '../utils/api'
import type { MenuItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'

export default function Menus() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getMenusList()
      .then((d) => { if (mounted) setMenus(d) })
      .catch((e) => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menus</h1>
        <Link to="/menus/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>Create Menu</Button></Link>
      </div>

      {loading ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Sections</TableHeadCell>
              <TableHeadCell>Restaurants</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 7 }).map((__, c) => (
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
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Sections</TableHeadCell>
              <TableHeadCell>Restaurants</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menus.map((m) => (
              <TableRow key={String(m.id)}>
                <TableCell>{m.id}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.description}</TableCell>
                <TableCell>
                  {Array.isArray((m as any).sections) && (m as any).sections.length > 0
                    ? (m as any).sections.map((s: any) => s?.name ?? s?.id).join(', ')
                    : (m.sectionIds || []).length}
                </TableCell>
                <TableCell>{(m.restaurantIds || []).length}</TableCell>
                <TableCell>{m.createdAt ? new Date(String(m.createdAt)).toLocaleString() : ''}</TableCell>
                <TableCell>
                  <Link to={`/menus/creation/${m.id}`}><Button size="sm" variant="ghost" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
