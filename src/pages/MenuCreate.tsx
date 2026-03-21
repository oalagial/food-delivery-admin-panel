import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getRestaurantsList, getSectionsList, getMenuById, createMenu, updateMenu } from '../utils/api'
import type { CreateMenuPayload, Restaurant, SectionItem } from '../utils/api'
import { Select } from '../components/ui/select';

export default function MenuCreate() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // allow selecting only one restaurant for a menu
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [sectionIds, setSectionIds] = useState<number[]>([])

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
        // Get restaurant id from restaurantId, restaurant.id, or restaurants array
        const menuAny = menu as any
        const restaurantIdValue = menuAny.restaurantId 
          || menuAny.restaurant?.id 
          || (Array.isArray(menuAny.restaurants) && menuAny.restaurants[0] ? menuAny.restaurants[0] : null)
        setRestaurantId(restaurantIdValue ? String(restaurantIdValue) : '')
        if (Array.isArray(menu.sections) && menu.sections.length > 0) {
          setSectionIds(menu.sections.map((s: any) => Number(s.id)))
        } else if (Array.isArray(menu.sectionIds)) {
          setSectionIds(menu.sectionIds.map((v: any) => Number(v)))
        } else {
          setSectionIds([])
        }
      }
    }).catch((e) => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError(t('common.menuNameRequired')); return }
    const payload: CreateMenuPayload = {
      name: String(name).trim(),
      description: description || undefined,
      sectionIds: sectionIds.map(Number),
      restaurantId: restaurantId ? Number(restaurantId) : undefined,
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          {editing ? t('createForms.editMenu') : t('createForms.createMenu')}
        </h1>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">{t('createForms.loading')}</CardContent>
        </Card>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 max-w-5xl lg:grid-cols-2"
        >
          {/* Basic info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {editing ? t('createForms.updateMenuDetails') : t('createForms.newMenu')}
              </CardTitle>
              <CardDescription>{t('common.fillMenuInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('createForms.menuNameStar')}</Label>
                <Input
                  id="name"
                  className="mt-1.5 w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('common.menuNamePh')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t('common.description')}</Label>
                <Input
                  id="description"
                  className="mt-1.5 w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('common.menuDescPh')}
                />
              </div>

              <div>
                <Label htmlFor="restaurant">{t('common.restaurant')} *</Label>
                <Select
                  id="restaurant"
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.currentTarget.value)}
                  className="mt-1.5 w-full"
                >
                  <option value="">{t('common.selectRestaurant')}</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name || r.id}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sections selector */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('common.sections')}</CardTitle>
              <CardDescription>{t('common.menuSectionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {/* Available Sections */}
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-sm">{t('common.available')}</div>
                  <div className="border rounded p-2 h-40 overflow-y-auto bg-white dark:bg-slate-900">
                    {sections.filter((s) => !sectionIds.includes(Number(s.id))).length === 0 && (
                      <div className="text-xs text-gray-400">{t('common.noMoreSections')}</div>
                    )}
                    {sections
                      .filter((s) => !sectionIds.includes(Number(s.id)))
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer group"
                        >
                          <span>{s.name || s.id}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-green-600 hover:text-green-800 text-xs font-bold opacity-80 group-hover:opacity-100"
                            onClick={() =>
                              setSectionIds((ids) => [...ids.map(Number), Number(s.id)])
                            }
                          >
                            {t('common.add')}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
                {/* Selected Sections */}
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-sm">{t('common.selected')}</div>
                  <div className="border rounded p-2 h-40 overflow-y-auto bg-white dark:bg-slate-900">
                    {sectionIds.length === 0 && (
                      <div className="text-xs text-gray-400">{t('common.noSectionsSelected')}</div>
                    )}
                    {sections
                      .filter((s) => sectionIds.includes(Number(s.id)))
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer group"
                        >
                          <span>{s.name || s.id}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-red-600 hover:text-red-800 text-xs font-bold opacity-80 group-hover:opacity-100"
                            onClick={() =>
                              setSectionIds((ids) =>
                                ids.map(Number).filter((id) => id !== Number(s.id)),
                              )
                            }
                          >
                            {t('common.remove')}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {t('common.pickerHintAddRemove')}
              </p>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="default"
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? t('common.saving') : editing ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
