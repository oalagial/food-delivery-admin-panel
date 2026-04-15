import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getAllRestaurantsForSelection, getAllSectionsForSelection, getMenuById, createMenu, updateMenu } from '../utils/api'
import { canSubmitResourceForm } from '../utils/permissions'
import { FormSaveBarrier } from '../components/FormSaveBarrier'
import type { CreateMenuPayload, Restaurant, SectionItem } from '../utils/api'
import { Select } from '../components/ui/select';
import { TransferList } from '../components/ui/transfer-list'

export default function MenuCreate() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editing = !!id
  const canSave = canSubmitResourceForm('menus', editing)

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
      getAllRestaurantsForSelection().catch(() => []),
      getAllSectionsForSelection().catch(() => []),
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
    if (!canSave) return
    setError(null)
    if (!name.trim()) { setError(t('common.menuNameRequired')); return }
    const payload: CreateMenuPayload = {
      name: String(name).trim(),
      description: description || undefined,
      sectionIds: sectionIds.map(Number),
      orderedSections: sectionIds.map((sectionId, index) => ({
        sectionId: Number(sectionId),
        sortOrder: index + 1,
      })),
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
          <FormSaveBarrier canSave={canSave} alertClassName="lg:col-span-2">
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
              <TransferList
                items={sections.map((section) => ({
                  id: Number(section.id),
                  label: String(section.name || section.id),
                }))}
                selectedIds={sectionIds}
                onChange={(ids) => setSectionIds(ids.map((id) => Number(id)))}
                availableTitle={t('common.available')}
                selectedTitle={t('common.selected')}
                availableEmptyText={t('common.noMoreSections')}
                selectedEmptyText={t('common.noSectionsSelected')}
                searchPlaceholder={t('common.search')}
                noDataText={t('common.noData')}
                hintText={t('common.pickerHintAddRemoveReorder')}
                clearLabel={t('common.clearField')}
                reorder
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          </FormSaveBarrier>
          <div className="flex justify-end gap-3 pt-2 lg:col-span-2">
            <Button
              variant="default"
              type="button"
              onClick={() => navigate(-1)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={!canSave || saving}>
              {saving ? t('common.saving') : editing ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
