import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
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

  const [newEmail, setNewEmail] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

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

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault()
    if (!newEmail || !newUsername) return setError('Email and username are required')
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, username: newUsername, password: newPassword }),
      })
      if (!res.ok) throw new Error(`Create failed ${res.status}`)
      setNewEmail('')
      setNewUsername('')
      setNewPassword('')
      await fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setCreating(false)
    }
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

  if(loading && users.length === 0){
    return <p>Loading users…</p>
  }

  return (
    <div>
      <h1>Users</h1>

      <section style={{ marginBottom: 20 }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <input placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          <input placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Button variant="primary" type="submit" disabled={creating} icon={<FiPlus className="w-4 h-4" />}>{creating ? 'Creating…' : 'Add User'}</Button>
        </form>
      </section>

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
