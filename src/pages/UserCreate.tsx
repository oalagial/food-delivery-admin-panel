import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

import { API_BASE } from '../config'
import { getRolesList } from '../utils/api'

export default function UserCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [roles, setRoles] = useState<Array<{ id?: string | number; name?: string }>>([])
  const [roleId, setRoleId] = useState<string | number | ''>('')

  useEffect(() => {
    let mounted = true

    // If editing, load the user
    if (id) {
      ;(async () => {
        try {
          const res = await fetch(`${API_BASE}/users?id=${id}`)
          if (!res.ok) throw new Error(`Failed to load user: ${res.status}`)
          const json = await res.json()
          const user = json?.data[0] || json
          if (!mounted) return
          setForm({
            email: String(user.email ?? ''),
            username: String(user.username ?? ''),
            password: '',
          })
          // try to populate role selection from returned user object
          const roleFromApi = (user && (user.role?.id ?? user.roleId ?? user.role_id)) ?? ''
          if (roleFromApi !== undefined && roleFromApi !== null) setRoleId(String(roleFromApi))
        } catch (err: unknown) {
          if (!mounted) return
          setError(err instanceof Error ? err.message : String(err))
        }
      })()
    }

    // fetch roles for the select using API helper (always fetch roles)
    let mountedRoles = true
    getRolesList().then((data) => {
      if (!mountedRoles) return
      setRoles(data || [])
    }).catch(() => {})

    return () => {
      mounted = false
      mountedRoles = false
    }
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        email: String(form.email).trim(),
        username: String(form.username).trim(),
      }
        if (roleId !== '' && roleId !== undefined) payload.roleId = Number(roleId)
      if (!payload.email || !payload.username) {
        setError('Email and username are required')
        setSaving(false)
        return
      }
      if (!id && form.password) payload.password = String(form.password)

      let res
      if (id) {
        res = await fetch(`${API_BASE}/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`Update failed ${res.status}`)
      } else {
        // creation
        if (!form.password) {
          setError('Password is required when creating a user')
          setSaving(false)
          return
        }
        payload.password = String(form.password)
        res = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`Create failed ${res.status}`)
      }

      // success — navigate back to users list
      navigate('/users')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{id ? 'Edit User' : 'Create User'}</h1>

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
        {error && <div className="text-red-600">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="Email" required className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <Input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} placeholder="Username" required className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={String(roleId ?? '')} onChange={(e) => setRoleId(e.target.value)} className="w-full rounded border px-2 py-1">
            <option value="">(No role)</option>
            {roles.map(r => <option key={String(r.id)} value={String(r.id)}>{r.name ?? String(r.id)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password {id ? <span className="text-xs text-gray-400">(leave blank to keep)</span> : null}</label>
          <Input value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="Password" type="password" className="w-full" />
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/users"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? (id ? 'Saving...' : 'Creating...') : (id ? 'Save' : 'Create')}</Button>
        </div>
      </form>
    </div>
  )
}
