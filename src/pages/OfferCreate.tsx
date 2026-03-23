import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import { createOffer, getOfferById, getProductsList, getRestaurantsList, updateOffer, updateOfferImage, type CreateOfferPayload, type OfferGroup, type Product, type Restaurant } from "../utils/api"
import { API_BASE } from "../config"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Alert, AlertDescription } from "../components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function OfferCreate () {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const editing = !!id;
  const navigate = useNavigate()

  const [createError, setCreateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<Boolean>(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<{
    name: string;
    description: string;
    price: number;
    restaurantId: string;
    menuId: string;
    isActive: boolean;
    image: string;
    groups: OfferGroup[];
  }>({
    name: '',
    description: '',
    price: 0,
    restaurantId: '',
    menuId: '',
    isActive: true,
    image: '',
    groups: []
  });

  const addProductToGroup = (groupIndex: number, productId: number | string | undefined) => {
    if (productId === undefined || productId === null) return
    const productIdNum = Number(productId)
    if (isNaN(productIdNum)) return
    setForm(prev => ({
      ...prev,
      groups: prev.groups.map((g, i) =>
        i === groupIndex
          ? { ...g, productsIds: [...g.productsIds, productIdNum] }
          : g
      )
    }));
  };

  const removeProductFromGroup = (groupIndex: number, productId: number | string | undefined) => {
    if (productId === undefined || productId === null) return
    const productIdNum = Number(productId)
    if (isNaN(productIdNum)) return
    setForm(prev => ({
      ...prev,
      groups: prev.groups.map((g, i) =>
        i === groupIndex
          ? { ...g, productsIds: g.productsIds.filter(id => id !== productIdNum) }
          : g
      )
    }));
  };


  useEffect(() => {
    let mounted = true
    
    Promise.all([
      getRestaurantsList('deletedBy=null').catch(() => []),
      getProductsList().catch(() => []),
      id ? getOfferById(id).catch(() => null) : Promise.resolve(null)
    ]).then(([rs, pr, offer]) => {
      if (!mounted) return
      setRestaurants(rs || [])
      setProducts(pr || [])
      if (offer) {
        setForm({
          name: offer.name || '',
          description: offer.description || '',
          price: Number(offer.price),
          restaurantId: String(offer.restaurantId) || '',
          menuId: String(offer.menuId) || '',
          isActive: Boolean(offer.isActive),
          image: typeof offer.image === 'string' ? offer.image : '',
          groups: offer.groups.map(g => ({
            name: g.name,
            minItems: g.minItems,
            maxItems: g.maxItems,
            productsIds: g.offerGroupProducts?.map(p => Number(p.product?.id || p.productId || p.id)).filter((id): id is number => !isNaN(id)) || []
          }))

        });

      }

    }).catch((e) => { if (mounted) setCreateError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) } )
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    setSelectedRestaurant(null);
    const selectedRestaurant = restaurants.find(r => String(r.id) === form.restaurantId);
    if (selectedRestaurant?.menu) {
      setSelectedRestaurant(selectedRestaurant)
    }
  }, [form.restaurantId, restaurants])

  useEffect(() => {
    if (!id) {
      setSelectedFile(null)
      setImagePreview(null)
    }
  }, [id])

  const handleOfferImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setCreateError(t('common.selectImageFile'))
        return
      }
      setCreateError(null)
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const addGroup = () => {
    setForm(prev => ({
      ...prev,
      groups: [
        ...prev.groups,
        {
          name: '',
          description: '',
          minItems: 0,
          maxItems: 0,
          productsIds: []
        }
      ]
    }));
  };

  const removeGroup = (index: number) => {
    setForm(prev => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !==index)
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setSaving(true)

    try {
      const payload: CreateOfferPayload = {
        name: String(form.name).trim(),
        description: String(form.description).trim(),
        price: Number(form.price),
        restaurantId: Number(form.restaurantId),
        menuId: Number(form.menuId),
        isActive: form.isActive,
        groups: form.groups
      }
      if (editing && id) {
        await updateOffer(Number(id), payload)
        if (selectedFile) {
          await updateOfferImage(Number(id), selectedFile)
        }
      } else {
        const created = await createOffer(payload)
        const newId =
          (created as { id?: string | number })?.id ??
          (created as { data?: { id?: string | number } })?.data?.id
        if (selectedFile && newId != null && String(newId) !== '') {
          await updateOfferImage(newId, selectedFile)
        }
      }
      navigate('/offers')

    } 
    catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err))
    }
    finally {
      setSaving(false)
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          {editing ? t('createForms.editOffer') : t('createForms.createOffer')}
        </h1>
      </div>
      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">{t('common.loading')}</CardContent>
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
                {editing ? t('createForms.updateOffer') : t('createForms.newOffer')}
              </CardTitle>
              <CardDescription>{t('common.fillOfferDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('createForms.offerNameStar')}</Label>
                <Input
                  id="name"
                  className="mt-1.5 w-full"
                  value={
                    form.name !== undefined && form.name !== null
                      ? String(form.name)
                      : ''
                  }
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder={t('createForms.offerNamePh')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t('common.description')}</Label>
                <Input
                  id="description"
                  className="mt-1.5 w-full"
                  value={form.description}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder={t('common.offerDescriptionPh')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">{t('createForms.offerPriceStar')}</Label>
                  <Input
                    id="price"
                    type="number"
                    className="mt-1.5 w-full"
                    value={form.price}
                    step={0.01}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        price: Number(e.target.value),
                      }))
                    }
                    placeholder={t('common.offerPricePh')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="restaurant">{t('common.restaurant')} *</Label>
                  <Select
                    id="restaurant"
                    className="mt-1.5 w-full"
                    value={String(form.restaurantId ?? '')}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        restaurantId: String(e.target.value),
                      }))
                    }
                    required
                  >
                    <option value="">{t('common.selectRestaurant')}</option>
                    {restaurants.map((r) => (
                      <option key={String(r.id)} value={String(r.id)}>
                        {r.name ?? t('common.idDisplay', { id: r.id })}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="menu">{t('createForms.menuFieldStar')}</Label>
                  <Select
                    id="menu"
                    className="mt-1.5 w-full"
                    value={String(form.menuId ?? '')}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        menuId: String(e.target.value),
                      }))
                    }
                    required
                    disabled={!form.restaurantId}
                  >
                    <option value="">{t('common.selectMenu')}</option>
                    {selectedRestaurant?.menu &&
                      (Array.isArray(selectedRestaurant.menu) ? (
                        selectedRestaurant.menu.map((m) => (
                          <option key={String(m.id)} value={String(m.id)}>
                            {m.name ?? String(m.id)}
                          </option>
                        ))
                      ) : (
                        <option
                          key={String((selectedRestaurant.menu as any).id)}
                          value={String((selectedRestaurant.menu as any).id)}
                        >
                          {(selectedRestaurant.menu as any).name ??
                            String((selectedRestaurant.menu as any).id)}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Checkbox
                  id="available"
                  checked={!!form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((s) => ({ ...s, isActive: checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="available"
                  className="mb-0 cursor-pointer text-sm"
                >
                  {t('common.activeOffer')}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Main image — same flow as products */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('common.image')}</CardTitle>
              <CardDescription>{t('common.offerPhoto')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <input
                  ref={imageInputRef}
                  id="offer-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleOfferImageSelect}
                />
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                >
                  {t('common.chooseImage')}
                </Button>
                {selectedFile && (
                  <span className="text-sm text-gray-600 dark:text-slate-400">
                    {selectedFile.name}
                  </span>
                )}
                {!selectedFile && form.image && (
                  <span className="text-sm text-gray-500 dark:text-slate-500">
                    {t('common.existingImage')}
                  </span>
                )}
              </div>
              {(imagePreview || form.image) && (
                <div className="pt-1">
                  <img
                    src={
                      imagePreview ??
                      (form.image ? `${API_BASE}/images/${form.image}` : '')
                    }
                    alt={t('common.offerPhoto')}
                    className="h-32 w-32 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Groups & products */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('common.offerGroups')}</CardTitle>
              <CardDescription>
                {t('common.offerGroupsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}

              <Button type="button" variant="default" size="sm" onClick={addGroup}>
                {t('createForms.addGroup')}
              </Button>

              <div className="space-y-4">
                {form.groups.map((g, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">
                          {t('common.groupNumber', { n: index + 1 })}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 text-xs font-semibold"
                          onClick={() => removeGroup(index)}
                        >
                          {t('createForms.removeGroup')}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`groupName-${index}`}>{t('createForms.groupName')}</Label>
                          <Input
                            id={`groupName-${index}`}
                            className="mt-1"
                            value={g.name}
                            onChange={(e) => {
                              const value = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index ? { ...group, name: value } : group,
                                ),
                              }))
                            }}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`minItems-${index}`}>{t('offersPage.minSelected')}</Label>
                          <Input
                            id={`minItems-${index}`}
                            className="mt-1"
                            type="number"
                            value={g.minItems}
                            onChange={(e) => {
                              const value = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index
                                    ? { ...group, minItems: Number(value) }
                                    : group,
                                ),
                              }))
                            }}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`maxItems-${index}`}>{t('offersPage.maxSelected')}</Label>
                          <Input
                            id={`maxItems-${index}`}
                            className="mt-1"
                            type="number"
                            value={g.maxItems}
                            onChange={(e) => {
                              const value = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                groups: prev.groups.map((group, i) =>
                                  i === index
                                    ? { ...group, maxItems: Number(value) }
                                    : group,
                                ),
                              }))
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>{t('common.products')}</Label>
                        <div className="flex gap-4 mt-2">
                          {/* Available */}
                          <div className="flex-1">
                            <div className="font-semibold mb-1 text-sm">
                              {t('common.available')}
                            </div>
                            <div className="border rounded p-2 h-48 overflow-y-auto bg-white dark:bg-slate-900">
                              {products.filter(
                                (p) => !g.productsIds.includes(Number(p.id)),
                              ).length === 0 && (
                                <div className="text-xs text-gray-400">
                                  {t('createForms.noMoreProducts')}
                                </div>
                              )}

                              {products
                                .filter(
                                  (p) => !g.productsIds.includes(Number(p.id)),
                                )
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded group"
                                  >
                                    <span>{p.name ?? p.id}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600 text-xs font-bold"
                                      onClick={() => addProductToGroup(index, p.id)}
                                    >
                                      {t('common.add')}
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Selected */}
                          <div className="flex-1">
                            <div className="font-semibold mb-1 text-sm">
                              {t('common.selected')}
                            </div>
                            <div className="border rounded p-2 h-48 overflow-y-auto bg-white dark:bg-slate-900">
                              {g.productsIds.length === 0 && (
                                <div className="text-xs text-gray-400">
                                  {t('createForms.noProductsSelected')}
                                </div>
                              )}

                              {products
                                .filter((p) =>
                                  g.productsIds.includes(Number(p.id)),
                                )
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded group"
                                  >
                                    <span>{p.name ?? p.id}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 text-xs font-bold"
                                      onClick={() =>
                                        removeProductFromGroup(index, p.id)
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Link to="/offers">
                  <Button variant="default" type="button">
                    {t('common.cancel')}
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? id
                      ? t('common.saving')
                      : t('common.creating')
                    : id
                    ? t('common.update')
                    : t('common.create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}