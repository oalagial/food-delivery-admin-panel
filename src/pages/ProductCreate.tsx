import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createProduct, getProductById, updateProduct, updateProductImage, getTypesList, getExtrasByProduct, getProductDiscount, ProductAllergy } from '../utils/api'
import type { CreateProductPayload, ProductDiscount, ProductExtra } from '../utils/api'
import { Checkbox } from '../components/ui/checkbox'

const ProductLabel = {
  GLUTEN_FREE: 'GLUTEN_FREE',
  LACTOSE_FREE: 'LACTOSE_FREE',
  VEGAN: 'VEGAN',
  VEGETARIAN: 'VEGETARIAN',
} as const;

type ProductLabel = typeof ProductLabel[keyof typeof ProductLabel];

import { Select } from '../components/ui/select';
import { API_BASE } from '../config';

function utcToLocalDateTimeInput(utc?: string | null): string {
  if (!utc) return ''

  const date = new Date(utc)

  const pad = (n: number) => n.toString().padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}


type ProductDiscountRowProps = {
  discount: ProductDiscount;
  index: number;
  onChange: (index: number, field: keyof ProductDiscount, value: any) => void;
  onRemove: (index: number) => void;
}

function ProductDiscountRow({ discount, index, onChange, onRemove }: ProductDiscountRowProps) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border bg-zinc-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 p-4">
      <div className="flex justify-end">
        <Button
          type="button"
          className="text-red-600 text-xs font-bold dark:text-red-400"
          variant="default"
          onClick={() => onRemove(index)}
        >
          {t('common.remove')} {t('common.discounts')}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_2fr_auto] gap-3 items-end">
        <div className="flex flex-col">
          <Label className="mb-3">{t('common.type')} *</Label>
          <Select
            value={discount.type}
            onChange={(e) => onChange(index, 'type', e.target.value)}
            className="border rounded px-2 py-1 h-9 bg-zinc-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
          >
            <option value="FIXED">{t('common.fixed')}</option>
            <option value="PERCENTAGE">{t('common.percentage')}</option>
          </Select>
        </div>

        <div className="flex flex-col">
          <Label className="mb-2">{discount.type === 'FIXED' ? t('common.fixedDiscountEur') : t('common.discountPercent')}</Label>
          <Input
            type="number"
            step="0.01"
            value={discount.value}
            onChange={(e) => onChange(index, 'value', Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col">
          <Label className="mb-2">{t('common.startsAt')} *</Label>
          <Input
            type="datetime-local"
            value={utcToLocalDateTimeInput(discount.startsAt)}
            onChange={(e) => onChange(index, 'startsAt', e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col">
          <Label className="mb-2">{t('common.endsAt')}</Label>
          <Input
            type="datetime-local"
            value={utcToLocalDateTimeInput(discount.endsAt)}
            onChange={(e) => onChange(index, 'endsAt', e.target.value)}
          />
        </div>

        <div className="flex flex-col w-xs">
          <Label className="mb-5 mt-2">{t('common.active')}</Label>
          <Checkbox
            className="h-4 w-4 rounded border-gray-300 mt-1"
            checked={!!discount.isActive}
            onCheckedChange={(checked) => onChange(index, 'isActive', checked)}
          />
        </div>
      </div>
    </div>)
}

type ProductDiscountsProps = {
  discounts: ProductDiscount[];
  setDiscounts: (discounts: ProductDiscount[]) => void
  productId?: string
}

function ProductDiscounts({ discounts, setDiscounts, productId }: ProductDiscountsProps) {
  const { t } = useTranslation()
  const addDiscount = () => {
    setDiscounts([
      ...discounts,
      {
        productId: productId || '',
        type: 'FIXED',
        value: 0,
        startsAt: '',
        endsAt: undefined,
        isActive: true,
      },
    ])
  }

  const updateDiscount = (index: number, field: keyof ProductDiscount, value: any) => {
    const updated = [...discounts]
    updated[index] = { ...updated[index], [field]: value }
    setDiscounts(updated)
  }

  const removeDiscount = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index))
  }

  return (
    <div>
      <Label className="block mb-2">{t('common.productDiscounts')}</Label>
      {discounts.map((d, idx) => (
        <ProductDiscountRow
          key={idx}
          discount={d}
          index={idx}
          onChange={updateDiscount}
          onRemove={removeDiscount}
        />
      ))}

      <Button
        className='mt-2'
        type="button"
        onClick={addDiscount}>
        {t('common.add')} {t('common.discount')}
      </Button>
    </div>
  )
}

export default function ProductCreate() {
  const { t: tr } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [productExtras, setProductExtras] = useState<ProductExtra[]>([])
  const [productDiscount, setProductDiscount] = useState<ProductDiscount[]>([]);

  // Keep a raw ingredients text input so typing a trailing comma doesn't get trimmed away
  const [ingredientsInput, setIngredientsInput] = useState('')
  const [selectedAllergies, setSelectedAllergies] = useState<ProductAllergy[]>([])

  const [form, setForm] = useState<Partial<CreateProductPayload> & { labels: ProductLabel[] }>({
    name: '',
    description: '',
    image: '',
    typeId: undefined,
    ingredients: [],
    allergies: [],
    price: undefined,
    isAvailable: true,
    stockQuantity: undefined,
    vatRate: undefined,
    labels: [] as ProductLabel[],
  })

  useEffect(() => {
    let mounted = true
    getTypesList()
      .then((data) => { if (!mounted) return; setTypes(data) })
      .catch(() => { if (!mounted) return; setTypes([]) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true;

    Promise.all([
      id ? getProductById(id).catch(() => null) : Promise.resolve(null),
      id ? getExtrasByProduct(id).catch(() => []) : Promise.resolve(null),
      id ? getProductDiscount(id).catch(() => []) : Promise.resolve([]),
    ]).then(([p, pe, pd]) => {
      if (p) {
        setForm({
          name: p.name,
          description: p.description,
          image: p.image,
          typeId: p.typeId,
          ingredients: p.ingredients ?? [],
          allergies: p.allergies ?? [],
          price: p.price,
          isAvailable: p.isAvailable,
          stockQuantity:
            typeof p.stockQuantity === 'number'
              ? p.stockQuantity
              : undefined,
          vatRate: p.vatRate,
          labels: (Array.isArray(p.labels) ? p.labels : []) as ProductLabel[],
        })
        setIngredientsInput(Array.isArray(p.ingredients) ? p.ingredients.join(', ') : '')
        setSelectedAllergies(Array.isArray(p.allergies) ? p.allergies : [])
      }

      if (pe) {
        setProductExtras(pe.map(e => ({
          id: e.id,
          productId: e.productId,
          name: e.name,
          price: e.price
        })))
      }

      if (pd) {
        setProductDiscount(pd.map(d => ({
          id: d.id,
          productId: d.productId,
          type: d.type,
          value: d.value,
          startsAt: d.startsAt,
          endsAt: d.endsAt,
          isActive: d.isActive,
        })));
      }
    })
      .catch((e) => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  const addExtra = () => {
    setProductExtras(prev => [
      ...prev,
      {
        productId: id ? String(id) : undefined,
        name: '',
        price: 0
      }
    ]);
  };

  const removeExtra = (index: number) => {
    setProductExtras(prev => prev.filter((_, i) => i !== index));
  };

  const updateProductExtra = (index: number, field: keyof ProductExtra, value: string | number) => {
    setProductExtras(prev => prev.map((extra, i) => i === index ? { ...extra, [field]: value } : extra));
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChooseImageClick = () => {
    fileInputRef.current?.click()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload: CreateProductPayload = {
      name: String(form.name ?? '').trim(),
      description: String(form.description ?? '').trim(),
      image: form.image, // Keep existing image if no new file is selected
      typeId: form.typeId,
      ingredients: ingredientsInput.split(',').map((x) => x.trim()).filter(Boolean),
      allergies: selectedAllergies,
      price: form.price !== undefined ? Number(form.price) : undefined,
      isAvailable: !!form.isAvailable,
      stockQuantity: form.stockQuantity != null ? Number(form.stockQuantity) : null,
      vatRate: form.vatRate,
      labels: form.labels || [],
    }

    try {
      if (id) {
        // Include extras and discounts in the payload when editing
        payload.extras = productExtras
          .filter(extra => extra.name.trim() !== '') // Only include extras with names
          .map(extra => ({
            id: extra.id ? Number(extra.id) : undefined,
            name: extra.name,
            price: Number(extra.price)
          }))

        payload.discounts = productDiscount
          .map(discount => ({
            id: discount.id ? Number(discount.id) : undefined,
            type: discount.type,
            value: Number(discount.value),
            startsAt: new Date(discount.startsAt).toISOString(),
            endsAt: discount.endsAt ? new Date(discount.endsAt).toISOString() : undefined,
            isActive: discount.isActive
          }))

        // Remove image from payload - it will be sent separately if needed
        delete payload.image

        // First, update product data without image (classic JSON request)
        await updateProduct(id, payload)

        // Then, if there's an image, upload it separately using FormData
        if (selectedFile) {
          await updateProductImage(id, selectedFile)
        }
      } else {
        // For new products, include extras and discounts in the payload
        payload.extras = productExtras
          .filter(extra => extra.name.trim() !== '') // Only include extras with names
          .map(extra => ({
            name: extra.name,
            price: Number(extra.price)
          }))

        payload.discounts = productDiscount
          .map(discount => ({
            type: discount.type,
            value: Number(discount.value),
            startsAt: new Date(discount.startsAt).toISOString(),
            endsAt: discount.endsAt ? new Date(discount.endsAt).toISOString() : undefined,
            isActive: discount.isActive
          }))

        // Remove image from payload - it will be sent separately if needed
        delete payload.image

        // First, create product without image (JSON request)
        const createdProduct = await createProduct(payload, undefined)

        // Extract the product ID from the response
        const createdProductId = (createdProduct as any)?.id || (createdProduct as any)?.data?.id

        // Then, if there's an image, upload it separately using FormData
        if (selectedFile && createdProductId) {
          await updateProductImage(createdProductId, selectedFile)
        }
      }
      navigate('/products')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{id ? tr('createForms.editProduct') : tr('createForms.createProduct')}</h1>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">{tr('createForms.loading')}</CardContent>
        </Card>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 max-w-5xl lg:grid-cols-2"
        >
          {/* Basic info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tr('common.basicInfo')}</CardTitle>
              <CardDescription>{tr('common.name')}, {tr('common.description').toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{tr('common.productNameStar')}</Label>
                <Input
                  id="name"
                  className="mt-1.5 w-full"
                  value={form.name as string}
                  onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))}
                  placeholder={tr('common.productName')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">{tr('common.description')}</Label>
                <Textarea
                  id="description"
                  className="mt-1.5 w-full"
                  value={form.description as string}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(s => ({ ...s, description: e.target.value }))}
                  placeholder={tr('common.productDescPh')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Price & availability */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tr('common.priceAvailability')}</CardTitle>
              <CardDescription>{tr('common.priceAvailabilityDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">{tr('common.productType')}</Label>
                  {loading ? (
                    <div className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">{tr('common.loading')}</div>
                  ) : (
                    <Select
                      id="type"
                      className="mt-1.5 w-full"
                      value={form.typeId !== undefined && form.typeId !== null ? String(form.typeId) : ''}
                      onChange={(e) => setForm(s => ({ ...s, typeId: e.target.value ? Number(e.target.value) : undefined }))}
                    >
                      <option value="">{tr('common.selectType')}</option>
                      {types.map((ty) => <option key={ty.id} value={String(ty.id)}>{ty.name}</option>)}
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="price">{tr('common.priceEuro')}</Label>
                  <Input
                    id="price"
                    className="mt-1.5 w-full"
                    value={form.price !== undefined ? String(form.price) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm(s => ({ ...s, price: v === '' ? undefined : Number(v) }));
                    }}
                    placeholder={tr('common.priceZeroPh')}
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="stockQuantity">{tr('common.stockQuantity')}</Label>
                  <Input
                    id="stockQuantity"
                    className="mt-1.5 w-full"
                    value={form.stockQuantity != null ? String(form.stockQuantity) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm(s => ({ ...s, stockQuantity: v === '' ? undefined : Number(v) }));
                    }}
                    placeholder={tr('common.noLimitStockPh')}
                    type="number"
                    min={0}
                    step={1}
                  />
                </div>
                <div>
                  <Label htmlFor="vatRate">{tr('common.vat')}</Label>
                  <Select
                    id="vatRate"
                    className="mt-1.5 w-full"
                    value={form.vatRate || ''}
                    onChange={(e) => setForm(s => ({ ...s, vatRate: e.target.value ? e.target.value as 'FOUR' | 'FIVE' | 'TEN' | 'TWENTY_TWO' : undefined }))}
                  >
                    <option value="">{tr('common.selectVat')}</option>
                    <option value="FOUR">4%</option>
                    <option value="FIVE">5%</option>
                    <option value="TEN">10%</option>
                    <option value="TWENTY_TWO">22%</option>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Checkbox
                  id="available"
                  checked={!!form.isAvailable}
                  onCheckedChange={(checked) => setForm(s => ({ ...s, isAvailable: checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="available" className="mb-0 cursor-pointer text-sm">{tr('common.availableForOrder')}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients & diet */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tr('common.ingredientsDiet')}</CardTitle>
              <CardDescription>{tr('common.ingredientsDietDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="ingredients">{tr('common.ingredientsComma')}</Label>
                <Input
                  id="ingredients"
                  className="mt-1.5 w-full"
                  value={ingredientsInput}
                  onChange={(e) => setIngredientsInput(e.target.value)}
                  placeholder={tr('common.ingredientsPh')}
                />
              </div>
              <div>
                <Label className="block mb-2">{tr('common.allergies')}</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {Object.values(ProductAllergy).map((allergy) => (
                    <div key={allergy} className="flex items-center gap-2">
                      <Checkbox
                        id={`allergy-${allergy}`}
                        checked={selectedAllergies.includes(allergy)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAllergies([...selectedAllergies, allergy])
                          } else {
                            setSelectedAllergies(selectedAllergies.filter(a => a !== allergy))
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`allergy-${allergy}`} className="mb-0 cursor-pointer text-sm">
                        {allergy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>{tr('common.productLabels')}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.values(ProductLabel).map(label => (
                    <label key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm">
                      <Checkbox
                        checked={form.labels?.includes(label)}
                        onCheckedChange={(checked) => {
                          setForm(s => {
                            const labels = s.labels || [];
                            if (checked) {
                              return { ...s, labels: [...labels, label] };
                            } else {
                              return { ...s, labels: labels.filter(l => l !== label) };
                            }
                          });
                        }}
                      />
                      <span>{label.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tr('common.image')}</CardTitle>
              <CardDescription>{tr('common.productPhoto')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <input
                  ref={fileInputRef}
                  id="image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button variant="primary" type="button" onClick={handleChooseImageClick}>
                  {tr('common.chooseImage')}
                </Button>
                {selectedFile && (
                  <span className="text-sm text-gray-600 dark:text-slate-400">{selectedFile.name}</span>
                )}
                {!selectedFile && form.image && (
                  <span className="text-sm text-gray-500 dark:text-slate-500">{tr('common.existingImage')}</span>
                )}
              </div>
              {(imagePreview || form.image) && (
                <div className="pt-1">
                  <img
                    src={imagePreview ?? (form.image ? `${API_BASE}/images/${form.image}` : '')}
                    alt={tr('common.productPhoto')}
                    className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extras */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tr('common.productExtras')}</CardTitle>
              <CardDescription>{tr('common.productExtrasDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {productExtras.map((extra, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-4"
                  >
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[140px]">
                        <Label htmlFor={`productExtraName-${index}`}>{tr('common.extraName')}</Label>
                        <Input
                          id={`productExtraName-${index}`}
                          className="mt-1"
                          value={extra.name}
                          onChange={e => updateProductExtra(index, 'name', e.target.value)}
                          placeholder={tr('common.extraNamePh')}
                        />
                      </div>
                      <div className="w-28">
                        <Label htmlFor={`productExtraPrice-${index}`}>{tr('common.priceEuro')}</Label>
                        <Input
                          id={`productExtraPrice-${index}`}
                          className="mt-1"
                          type="number"
                          step="0.01"
                          value={extra.price}
                          onChange={e => updateProductExtra(index, 'price', Number(e.target.value))}
                          placeholder={tr('common.priceZeroPh')}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 shrink-0"
                        onClick={() => removeExtra(index)}
                      >
                        {tr('common.remove')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="default" size="sm" onClick={addExtra}>
                {tr('common.add')} {tr('common.extras')}
              </Button>
            </CardContent>
          </Card>

          {/* Discounts */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tr('common.discounts')}</CardTitle>
              <CardDescription>{tr('common.discountScheduleDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductDiscounts
                discounts={productDiscount}
                setDiscounts={setProductDiscount}
                productId={id}
              />
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="lg:col-span-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2 lg:col-span-2">
            <Button variant="default" type="button" onClick={() => navigate('/products')}>
              {tr('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? tr('common.saving') : id ? tr('common.update') : tr('common.create')}
            </Button>
          </div>
        </form>
      )}

    </div>
  )
}
