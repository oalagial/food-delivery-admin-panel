import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'

import { API_BASE } from '../config'
import { getRolesList, getCurrentUserId } from '../utils/api'
import { Select } from '../components/ui/select';

export default function UserCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', username: '' })
  const [roleIds, setRoleIds] = useState<Array<{ id?: string | number; name?: string }>>([]);
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

  const isEditingSelf = id != null && getCurrentUserId() != null && String(id) === String(getCurrentUserId())

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
      // Don't send roleIds when editing yourself (you can't change your own role)
      if (!isEditingSelf && roleId !== '' && roleId !== undefined) payload.roleIds = [Number(roleId)]
      let res
      if (id) {
        // if (form.password) payload.password = String(form.password)
        res = await fetch(`${API_BASE}/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`Update failed ${res.status}`)
      } else {
        // if (!form.password) {
        //   setError('Password is required when creating a user')
        //   setSaving(false)
        //   return
        // }
        // payload.password = String(form.password)
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
              <Alert variant="destructive" className="rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  className="w-full"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username *</Label>
                <Input
                  id="username"
                  className="w-full"
                  value={form.username}
                  onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">Role{isEditingSelf && <span className="text-gray-500 font-normal ml-1">(you cannot change your own role)</span>}</Label>
                <Select
                  id="role"
                  value={String(roleId ?? '')}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full"
                  disabled={isEditingSelf}
                >
                  <option value="">(No role)</option>
                  {roleIds.map((r) => (
                    <option key={String(r.id)} value={String(r.id)}>
                      {r.name ?? String(r.id)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Link to="/users">
                <Button variant="default" type="button">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (id ? 'Saving...' : 'Creating...') : (id ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
