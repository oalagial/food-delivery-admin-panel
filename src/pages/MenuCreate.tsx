import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
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
        setRestaurantId(((menu.restaurants || [])[0] ?? '') + '')
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
      <div>
        <h1 className="text-3xl font-bold">{editing ? 'Edit Menu' : 'Create Menu'}</h1>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">Loading...</CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{editing ? 'Update Menu Details' : 'New Menu'}</CardTitle>
            <CardDescription>Fill in the menu information below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Menu Name *</Label>
                <Input 
                  id="name"
                  className="mt-2 w-full"
                  value={name} 
                  onChange={(e)=> setName(e.target.value)} 
                  placeholder="Menu name" 
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description"
                  className="mt-2 w-full"
                  value={description} 
                  onChange={(e)=> setDescription(e.target.value)} 
                  placeholder="Brief description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <select 
                    id="restaurant"
                    value={restaurantId} 
                    onChange={(e) => setRestaurantId(e.currentTarget.value)} 
                    className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select restaurant</option>
                    {restaurants.map(r => <option key={r.id} value={String(r.id)}>{r.name || r.id}</option>)}
                  </select>
                </div>

                <div>
                  <Label htmlFor="sections">Sections</Label>
                  <select 
                    id="sections"
                    multiple 
                    value={sectionIds.map(String)} 
                    onChange={(e) => {
                      const opts = Array.from(e.currentTarget.selectedOptions).map(o=> Number(o.value))
                      setSectionIds(opts)
                    }} 
                    className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={()=> navigate(-1)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
