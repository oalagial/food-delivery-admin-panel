import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'

type Role = {
  id: number | string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

const API_BASE = 'https://delivery-app-backend-production-64f2.up.railway.app'

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [editValues, setEditValues] = useState<{ name?: string; description?: string }>({})

  async function fetchRoles() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/roles/list`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = Array.isArray(json) ? json : json?.data ?? Object.values(json ?? {})
      setRoles(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchRoles()
  }, [])

  async function handleDelete(id: number | string) {
    if (!confirm('Delete this role?')) return
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/roles/delete/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Delete failed ${res.status}`)
      await fetchRoles()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    }
  }

  function startEdit(r: Role) {
    setEditingId(r.id)
    setEditValues({ name: r.name, description: r.description })
  }

  async function saveEdit(id: number | string) {
    if (!editValues.name) return setError('Name is required')
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/roles/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      })
      if (!res.ok) throw new Error(`Update failed ${res.status}`)
      setEditingId(null)
      await fetchRoles()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    }
  }

  

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Roles</h1>
        <Link to="/roles/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>Create</Button></Link>
      </div>

      {error && <div style={{ color: 'crimson' }}><strong>Error:</strong> {error}</div>}

      <div>
        {loading && (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>ID</TableHeadCell>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, r) => (
                <TableRow key={r} className="animate-pulse">
                  {Array.from({ length: 5 }).map((__, c) => (
                    <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>ID</TableHeadCell>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>No roles found.</TableCell>
                </TableRow>
              )}
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{String(r.id)}</TableCell>
                  <TableCell>
                    {editingId === r.id ? (
                      <input value={editValues.name ?? ''} onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))} />
                    ) : (
                      r.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === r.id ? (
                      <input value={editValues.description ?? ''} onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))} />
                    ) : (
                      r.description ?? ''
                    )}
                  </TableCell>
                  <TableCell>{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</TableCell>
                  <TableCell>
                    {editingId === r.id ? (
                      <>
                        <Button variant="primary" size="sm" onClick={() => void saveEdit(r.id)}>Save</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} style={{ marginLeft: 6 }}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(r)} icon={<FiEdit className="w-4 h-4" />}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => void handleDelete(r.id)} style={{ marginLeft: 6 }} icon={<FiTrash className="w-4 h-4" />}>Delete</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
