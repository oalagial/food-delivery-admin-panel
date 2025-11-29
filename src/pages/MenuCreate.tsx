import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { getRestaurantsList, getSectionsList, getMenuById, createMenu, updateMenu } from '../utils/api'
import type { CreateMenuPayload, Restaurant, SectionItem } from '../utils/api'

export default function MenuCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // allow selecting only one restaurant for a menu
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [sectionIds, setSectionIds] = useState<Array<number | string>>([])

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      getRestaurantsList().catch(() => []),
      getSectionsList().catch(() => []),
      id ? getMenuById(id).catch(() => null) : Promise.resolve(null),
    ]).then(([rs, ss, menu]) => {
      if (!mounted) return
      setRestaurants(rs || [])
      setSections(ss || [])
      if (menu) {
        setName(menu.name || '')
        setDescription(menu.description || '')
        // take the first restaurant id if returned as an array
        setRestaurantId(((menu.restaurantIds || [])[0] ?? '') + '')
        setSectionIds((menu.sectionIds || []).map(v => Number(v)))
      }
    }).catch((e) => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Name is required'); return }
    const payload: CreateMenuPayload = {
      name: String(name).trim(),
      description: description || undefined,
      sectionIds: sectionIds.map(Number),
      // backend expects an array of restaurant ids; wrap selected id if present
      restaurantIds: restaurantId ? [Number(restaurantId)] : [],
    }
    try {
      setSaving(true)
      if (editing && id) {
        await updateMenu(Number(id), payload)
      } else {
        await createMenu(payload)
      }
      navigate('/menus')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{editing ? 'Edit Menu' : 'Create Menu'}</h1>

      {loading ? <div>Loading...</div> : (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-md border">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={name} onChange={(e)=> setName(e.target.value)} placeholder="Menu name" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input value={description} onChange={(e)=> setDescription(e.target.value)} placeholder="Description" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Restaurant</label>
              <select value={restaurantId} onChange={(e) => setRestaurantId(e.currentTarget.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">-- Select restaurant --</option>
                {restaurants.map(r => <option key={r.id} value={String(r.id)}>{r.name || r.id}</option>)}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Sections</label>
              <select multiple value={sectionIds.map(String)} onChange={(e) => {
                const opts = Array.from(e.currentTarget.selectedOptions).map(o=> Number(o.value))
                setSectionIds(opts)
              }} className="w-full rounded-md border px-3 py-2 text-sm">
                {sections.map(s => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={()=> navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Save' : 'Create')}</Button>
          </div>
        </form>
      )}
    </div>
  )
}
