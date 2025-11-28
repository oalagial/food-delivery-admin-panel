import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { Skeleton } from '../components/ui/skeleton'
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

type User = {
  id: number | string
  email?: string
  username?: string
  createdAt?: string
  [key: string]: unknown
}

const API_BASE = 'https://delivery-app-backend-production-64f2.up.railway.app'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  

  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [editValues, setEditValues] = useState<{ email?: string; username?: string }>({})

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/users/list`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = Array.isArray(json) ? json : json?.data ?? Object.values(json ?? {})
      setUsers(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsers()
  }, [])

  if (loading && users.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Users</h1>
          <Link to="/users/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>Create</Button></Link>
        </div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Username</TableHeadCell>
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
      </div>
    )
  }

  

  async function handleDelete(id: number | string) {
    if (!confirm('Delete this user?')) return
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Delete failed ${res.status}`)
      await fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    }
  }

  function startEdit(u: User) {
    setEditingId(u.id)
    setEditValues({ email: u.email as string | undefined, username: u.username as string | undefined })
  }

  async function saveEdit(id: number | string) {
    if (!editValues.email || !editValues.username) return setError('Email and username required')
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      })
      if (!res.ok) throw new Error(`Update failed ${res.status}`)
      setEditingId(null)
      await fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    }
  }

  

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link to="/users/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>Create</Button></Link>
      </div>

      {error && <div style={{ color: 'crimson' }}><strong>Error:</strong> {error}</div>}

      <div>
          <Table>
          <TableHead>
            <tr>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Username</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No users found.</TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{String(u.id)}</TableCell>
                <TableCell>
                  {editingId === u.id ? (
                    <input value={editValues.email ?? ''} onChange={(e) => setEditValues(v => ({ ...v, email: e.target.value }))} />
                  ) : (
                    u.email
                  )}
                </TableCell>
                <TableCell>
                  {editingId === u.id ? (
                    <input value={editValues.username ?? ''} onChange={(e) => setEditValues(v => ({ ...v, username: e.target.value }))} />
                  ) : (
                    u.username
                  )}
                </TableCell>
                <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</TableCell>
                <TableCell>
                  {editingId === u.id ? (
                    <>
                      <Button variant="primary" size="sm" onClick={() => void saveEdit(u.id)}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} style={{ marginLeft: 6 }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(u)} icon={<FiEdit className="w-4 h-4" />}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => void handleDelete(u.id)} style={{ marginLeft: 6 }} icon={<FiTrash className="w-4 h-4" />}>Delete</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
