import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
import { getTypesList } from '../utils/api'
import type { TypeItem } from '../utils/api'

export default function Types() {
  const [types, setTypes] = useState<TypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getTypesList()
      .then((data) => {
        if (!mounted) return
        setTypes(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load')
        setTypes([])
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  return (
    <div>
      <h1>Types</h1>

      <section className="mt-3">
        <div className="mt-2">
          <Link to="/types/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>Create new type</Button></Link>
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
              <TableHeadCell>Tag</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {(!loading && types.length === 0) && (
              <TableRow>
                <TableCell colSpan={6}>No types found.</TableCell>
              </TableRow>
            )}

            {types.map((t) => (
              <TableRow key={t.id ?? t.name}>
                <TableCell>{String(t.id ?? '')}</TableCell>
                <TableCell>{t.name ?? ''}</TableCell>
                <TableCell>{t.tag ?? ''}</TableCell>
                <TableCell>{t.description ?? ''}</TableCell>
                <TableCell>{t.createdAt ? new Date(String(t.createdAt)).toLocaleString() : ''}</TableCell>
                <TableCell>
                  <Link to={`/types/creation/${encodeURIComponent(String(t.id ?? ''))}`} style={{ marginRight: 8 }}><Button variant="ghost" size="sm" icon={<FiEdit className="w-4 h-4" />}>Edit</Button></Link>
                  <Button variant="danger" size="sm" icon={<FiTrash className="w-4 h-4" />}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
