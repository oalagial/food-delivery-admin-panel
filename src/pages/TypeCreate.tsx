import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
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
      <div>
        <h1 className="text-3xl font-bold">{editing ? 'Edit Type' : 'Create Type'}</h1>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">Loading...</CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{editing ? 'Update Type' : 'New Type'}</CardTitle>
            <CardDescription>Create or edit a product type</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Type Name *</Label>
                <Input 
                  id="name"
                  className="mt-2 w-full"
                  value={form.name as string} 
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} 
                  placeholder="e.g., Beverages, Desserts" 
                  required 
                />
              </div>

              <div>
                <Label htmlFor="tag">Tag</Label>
                <Input 
                  id="tag"
                  className="mt-2 w-full"
                  value={form.tag as string} 
                  onChange={(e) => setForm((s) => ({ ...s, tag: e.target.value }))} 
                  placeholder="e.g., food, drinks"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  className="mt-2 w-full"
                  value={form.description as string} 
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} 
                  placeholder="Describe this type..."
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={() => navigate('/types')}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
