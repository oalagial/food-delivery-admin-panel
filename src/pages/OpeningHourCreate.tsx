import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { createOpeningHour, getOpeningHourById, updateOpeningHour } from '../utils/api'

export default function OpeningHourCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id

  const [day, setDay] = useState('Monday')
  const [open, setOpen] = useState('10:00')
  const [close, setClose] = useState('18:00')
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) return
    let mounted = true
    getOpeningHourById(Number(id))
      .then(data => {
        if (!mounted) return
        if (data) {
          setDay(data.day || 'Monday')
          setOpen(data.open || '10:00')
          setClose(data.close || '18:00')
        }
      })
      .catch(e => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [editing, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!day || !open || !close) { setError('All fields required'); return }
    const payload = { day, open, close }
    try {
      setSaving(true)
      if (editing && id) {
        await updateOpeningHour(Number(id), payload)
      } else {
        await createOpeningHour(payload)
      }
      navigate('/opening-hours')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{editing ? 'Edit Opening Hour' : 'Create Opening Hour'}</h1>

      {loading ? <div>Loading...</div> : (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-md border">
          <div>
            <label className="block text-sm font-medium mb-1">Day</label>
            <Input value={day} onChange={(e)=> setDay(e.target.value)} placeholder="Day" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Open</label>
              <Input value={open} onChange={(e)=> setOpen(e.target.value)} type="time" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Close</label>
              <Input value={close} onChange={(e)=> setClose(e.target.value)} type="time" />
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={()=> navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Save' : 'Create')}</Button>
          </div>
        </form>
      )}
    </div>
  )
}
