import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { createType, getTypeById, updateType } from '../utils/api'
import type { CreateTypePayload } from '../utils/api'

export default function TypeCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id

  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown | null>(null)

  const [form, setForm] = useState<Partial<CreateTypePayload>>({ name: '', tag: '', description: '' })

  useEffect(() => {
    if (!editing) return
    let mounted = true
    setLoading(true)
    getTypeById(id as string)
      .then((data) => {
        if (!mounted) return
        if (data) setForm({ name: data.name || '', tag: data.tag || '', description: data.description || '' })
      })
      .catch((e) => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [editing, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)

    const payload: CreateTypePayload = {
      name: String(form.name ?? '').trim(),
      tag: String(form.tag ?? '').trim(),
      description: String(form.description ?? '').trim(),
    }

    try {
      let res
      if (editing && id) {
        res = await updateType(id, payload)
      } else {
        res = await createType(payload)
      }
      setResult(res)
      navigate('/types')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{editing ? 'Edit Type' : 'Create Type'}</h1>

      {loading ? <div>Loading...</div> : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input value={form.name as string} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Type name" className="w-full" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <Input value={form.tag as string} onChange={(e) => setForm((s) => ({ ...s, tag: e.target.value }))} placeholder="tag (e.g. food)" className="w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description as string} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description..." className="w-full min-h-[90px] rounded-md border px-3 py-2 text-sm" />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => navigate('/types')}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Save' : 'Save')}</Button>
          </div>
        </form>
      )}

      {error && <div className="text-red-600">{error}</div>}
      {result != null && <div className="text-green-600">Saved</div>}
    </div>
  )
}
