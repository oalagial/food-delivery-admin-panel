import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'

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

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

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

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault()
    if (!newName) return setError('Name is required')
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/roles/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDescription }),
      })
      if (!res.ok) throw new Error(`Create failed ${res.status}`)
      setNewName('')
      setNewDescription('')
      await fetchRoles()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

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

  if(loading && roles.length === 0){
    return <p>Loading roles…</p>
  }

  return (
    <div>
      <h1>Roles</h1>

      <section style={{ marginBottom: 20 }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input placeholder="Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          <Button variant="primary" type="submit" disabled={creating}>{creating ? 'Creating…' : 'Add Role'}</Button>
        </form>
      </section>

      {error && <div style={{ color: 'crimson' }}><strong>Error:</strong> {error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '8px' }}>ID</th>
              <th style={{ padding: '8px' }}>Name</th>
              <th style={{ padding: '8px' }}>Description</th>
              <th style={{ padding: '8px' }}>Created</th>
              <th style={{ padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 12 }}>No roles found.</td>
              </tr>
            )}
            {roles.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <td style={{ padding: 8 }}>{String(r.id)}</td>
                <td style={{ padding: 8 }}>
                  {editingId === r.id ? (
                    <input value={editValues.name ?? ''} onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))} />
                  ) : (
                    r.name
                  )}
                </td>
                <td style={{ padding: 8 }}>
                  {editingId === r.id ? (
                    <input value={editValues.description ?? ''} onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))} />
                  ) : (
                    r.description ?? ''
                  )}
                </td>
                <td style={{ padding: 8 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                <td style={{ padding: 8 }}>
                  {editingId === r.id ? (
                    <>
                      <Button variant="primary" size="sm" onClick={() => void saveEdit(r.id)}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} style={{ marginLeft: 6 }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => void handleDelete(r.id)} style={{ marginLeft: 6 }}>Delete</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
