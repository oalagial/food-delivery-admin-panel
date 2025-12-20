import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'

import { API_BASE } from '../config'
import { getRolesList } from '../utils/api'

export default function UserCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [roleIds, setRoleIds] = useState<Array<{ id?: string | number; name?: string }>>([])
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
          let roleFromApi = ''
          if (Array.isArray(user.roles) && user.roles.length > 0) {
            roleFromApi = user.roles[0]?.id ?? ''
          } else {
            roleFromApi = user.role?.id ?? user.roleId ?? user.role_id ?? ''
          }
          if (roleFromApi !== undefined && roleFromApi !== null && roleFromApi !== '') setRoleId(String(roleFromApi))
        } catch (err: unknown) {
          if (!mounted) return
          setError(err instanceof Error ? err.message : String(err))
        }
      })()
    }

    // fetch roleIds for the select using API helper (always fetch roleIds)
    let mountedRoles = true
    getRolesList().then((data) => {
      if (!mountedRoles) return
      setRoleIds(data || [])
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
      if (!payload.email || !payload.username) {
        setError('Email and username are required')
        setSaving(false)
        return
      }
      // Always send roleIds array if a role is selected
      if (roleId !== '' && roleId !== undefined) payload.roleIds = [Number(roleId)]
      let res
      if (id) {
        if (form.password) payload.password = String(form.password)
        res = await fetch(`${API_BASE}/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`Update failed ${res.status}`)
      } else {
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
      <div>
        <h1 className="text-3xl font-bold">{id ? 'Edit User' : 'Create User'}</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{id ? 'Update User' : 'New User'}</CardTitle>
          <CardDescription>Manage user account and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                className="mt-2 w-full"
                value={form.email} 
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} 
                placeholder="user@example.com" 
                required 
              />
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <Input 
                id="username"
                className="mt-2 w-full"
                value={form.username} 
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} 
                placeholder="Username" 
                required 
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <select 
                id="role"
                value={String(roleId ?? '')} 
                onChange={(e) => setRoleId(e.target.value)} 
                className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">(No role)</option>
                {roleIds.map(r => <option key={String(r.id)} value={String(r.id)}>{r.name ?? String(r.id)}</option>)}
              </select>
            </div>

            <div>
              <Label htmlFor="password">Password {id && <span className="text-xs text-gray-400">(leave blank to keep)</span>}</Label>
              <Input 
                id="password"
                className="mt-2 w-full"
                value={form.password} 
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} 
                placeholder={id ? 'Leave blank to keep current' : 'Enter password'} 
                type="password" 
                required={!id}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to="/users"><Button variant="ghost" type="button">Cancel</Button></Link>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? (id ? 'Saving...' : 'Creating...') : (id ? 'Update' : 'Create')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
