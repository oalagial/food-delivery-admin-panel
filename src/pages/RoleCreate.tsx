import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

const API_BASE = 'https://delivery-app-backend-production-64f2.up.railway.app'

export default function RoleCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (!id) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/roles/${id}`)
        if (!res.ok) throw new Error(`Failed to load role: ${res.status}`)
        const json = await res.json()
        if (!mounted) return
        setForm({ name: String(json.name ?? ''), description: String(json.description ?? '') })
      } catch (err: unknown) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
      }
    })()

    return () => { mounted = false }
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { name: String(form.name).trim(), description: String(form.description).trim() }
      if (!payload.name) {
        setError('Name is required')
        setSaving(false)
        return
      }

      if (id) {
        const res = await fetch(`${API_BASE}/roles/update/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(`Update failed ${res.status}`)
      } else {
        const res = await fetch(`${API_BASE}/roles/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(`Create failed ${res.status}`)
      }

      navigate('/roles')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{id ? 'Edit Role' : 'Create Role'}</h1>

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
        {error && <div className="text-red-600">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Role name" required className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description" className="w-full" />
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/roles"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? (id ? 'Saving...' : 'Creating...') : (id ? 'Save' : 'Create')}</Button>
        </div>
      </form>
    </div>
  )
}
