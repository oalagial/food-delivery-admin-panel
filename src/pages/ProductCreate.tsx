import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createProduct, getProductById, updateProduct, updateProductImage, getTypesList, getExtrasByProduct, getProductDiscount } from '../utils/api'
import type { CreateProductPayload, ProductDiscount, ProductExtra } from '../utils/api'

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
  return (
      <div className="rounded-lg border bg-gray-300 p-4">
          <div className="flex justify-end">
            <Button
              type="button"
              className="text-red-600 text-xs font-bold"
              variant="default"
              onClick={() => onRemove(index)}
            >
              Remove Discount
            </Button>
          </div>
        <div className="grid grid-cols-[1fr_1fr_2fr_2fr_auto] gap-2 items-end">
          <div className="flex flex-col">
            <Label className="mb-3">Type *</Label>
            <select
              value={discount.type}
              onChange={(e) => onChange(index, 'type', e.target.value)}
              className="border rounded px-2 py-1 h-9"
            >
              <option value="FIXED">Fixed</option>
              <option value="PERCENTAGE">Percentage</option>
            </select>
          </div>

          <div className="flex flex-col">
            <Label className="mb-2">{ discount.type === 'FIXED' ? 'Fixed Discount (€)' : 'Discount (%)' }</Label>
            <Input
              type="number"
              step="0.01"
              value={discount.value}
              onChange={(e) => onChange(index, 'value', Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col">
            <Label className="mb-2">Starts At *</Label>
            <Input
              type="datetime-local"
              value={utcToLocalDateTimeInput(discount.startsAt)}
              onChange={(e) => onChange(index, 'startsAt', e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col">
            <Label className="mb-2">Ends At</Label>
            <Input
              type="datetime-local"
              value={utcToLocalDateTimeInput(discount.endsAt)}
              onChange={(e) => onChange(index, 'endsAt', e.target.value)}
            />
          </div>

          <div className="flex flex-col w-xs">
            <Label className="mb-5 mt-2">Active</Label>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 mt-1"
              checked={!!discount.isActive}
              onChange={(e) => onChange(index, 'isActive', e.target.checked)}
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
      <Label className="block mb-2">Product Discounts</Label>
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
        Add Discount
      </Button>
    </div>
  )
}

export default function ProductCreate() {
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

  const [form, setForm] = useState<Partial<CreateProductPayload> & { labels: ProductLabel[] }>({
    name: '',
    description: '',
    image: '',
    typeId: undefined,
    ingredients: [],
    price: undefined,
    isAvailable: true,
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
          price: p.price,
          isAvailable: p.isAvailable,
          vatRate: p.vatRate,
          labels: (Array.isArray(p.labels) ? p.labels : []) as ProductLabel[],
        })
        setIngredientsInput(Array.isArray(p.ingredients) ? p.ingredients.join(', ') : '')
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
    .finally(() => { if (mounted) setLoading(false) } )
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
      price: form.price !== undefined ? Number(form.price) : undefined,
      isAvailable: !!form.isAvailable,
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
        
        // Pass the selected file if one was chosen
        const createdProduct = await createProduct(payload, selectedFile || undefined)
        console.log('Created product:', createdProduct);
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
        <h1 className="text-3xl font-bold">{id ? 'Edit Product' : 'Create Product'}</h1>
      </div>

      {loading ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">Loading...</CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">  
          <CardHeader>
            <CardTitle>{id ? 'Update Product' : 'New Product'}</CardTitle>
            <CardDescription>Fill in the product details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input 
                  id="name"
                  className="mt-2 w-full"
                  value={form.name as string} 
                  onChange={(e) => setForm(s => ({...s, name: e.target.value}))} 
                  placeholder="Product name" 
                  required 
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="mt-2 w-full border rounded px-3 py-2 min-h-[100px] resize-y"
                  value={form.description as string}
                  onChange={(e) => setForm(s => ({...s, description: e.target.value}))}
                  placeholder="Product description"
                />
              </div>

              <div>
                <Label htmlFor="type">Product Type</Label>
                {loading ? (
                  <div className="mt-2 text-sm text-gray-500">Loading types...</div>
                ) : (
                  <Select
                    id="type"
                    className="mt-2 w-full"
                    value={form.typeId !== undefined && form.typeId !== null ? String(form.typeId) : ''}
                    onChange={(e) => setForm(s => ({ ...s, typeId: e.target.value ? Number(e.target.value) : undefined }))}
                  >
                    <option value="">Select a type</option>
                    {types.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price (€)</Label>
                <Input
                  id="price"
                  className="mt-2 w-full"
                  value={form.price !== undefined ? String(form.price) : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm(s => ({ ...s, price: v === '' ? undefined : Number(v) }));
                  }}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="vatRate">VAT Rate</Label>
                <Select
                  id="vatRate"
                  className="mt-2 w-full"
                  value={form.vatRate || ''}
                  onChange={(e) => setForm(s => ({ ...s, vatRate: e.target.value ? e.target.value as 'FOUR' | 'FIVE' | 'TEN' | 'TWENTY_TWO' : undefined }))}
                >
                  <option value="">Select VAT Rate</option>
                  <option value="FOUR">4%</option>
                  <option value="FIVE">5%</option>
                  <option value="TEN">10%</option>
                  <option value="TWENTY_TWO">22%</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="ingredients">Ingredients (comma separated)</Label>
                <Input
                  id="ingredients"
                  className="mt-2 w-full"
                  value={ingredientsInput}
                  onChange={(e)=> setIngredientsInput(e.target.value)}
                  placeholder="Tomato, Cheese, Basil"
                />
              </div>

              <div>
                <Label>Product Labels</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.values(ProductLabel).map(label => (
                    <label key={label} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.labels?.includes(label)}
                        onChange={e => {
                          setForm(s => {
                            const labels = s.labels || [];
                            if (e.target.checked) {
                              return { ...s, labels: [...labels, label] };
                            } else {
                              return { ...s, labels: labels.filter(l => l !== label) };
                            }
                          });
                        }}
                      />
                      <span className="text-xs">{label.replace('_', ' ').replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="image">Image</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center gap-4">
                    <input 
                      ref={fileInputRef}
                      id="image-input" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileSelect} 
                    />
                    <Button 
                      variant="primary" 
                      type="button" 
                      onClick={handleChooseImageClick}
                    >
                      Choose Image
                    </Button>
                    {selectedFile && (
                      <span className="text-sm text-gray-600">{selectedFile.name}</span>
                    )}
                    {!selectedFile && form.image && (
                      <span className="text-sm text-gray-500">Using existing image</span>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {!imagePreview && form.image && (
                    <div className="mt-2">
                      <img 
                        src={`${API_BASE}/images/${form.image}`} 
                        alt="Current" 
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-end gap-3">
                <input 
                  id="available"
                  type="checkbox" 
                  checked={!!form.isAvailable} 
                  onChange={(e)=> setForm(s=>({...s, isAvailable: e.target.checked}))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="available" className="mb-0 cursor-pointer">Available for order</Label>
              </div>
              
              <div className="col-span-2">
                <Label className="block mb-2">Product Extras</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  {productExtras.map((extra, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-gray-300 p-4"
                    >
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="default"
                          className="text-red-600 text-xs font-bold"
                          onClick={() => removeExtra(index)}
                        >
                          Remove Extra
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor={`productExtraName-${index}`}>Extra Name</Label>
                        <Input
                          id={`productExtraName-${index}`}
                          value={extra.name}
                          onChange={e => {
                            const value = e.target.value;
                            updateProductExtra(index, 'name', value)
                          }}
                          placeholder="e.g. Extra cheese"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`productExtraPrice-${index}`}>Extra Price (€)</Label>
                        <Input
                          id={`productExtraPrice-${index}`}
                          type="number"
                          step="0.01"
                          value={extra.price}
                          onChange={e => {
                            const value = Number(e.target.value);
                            updateProductExtra(index, 'price', value)
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Button
                    className='mt-2'
                    type="button" 
                    onClick={addExtra}
                  > Add Extra
                  </Button>

                </div>
              </div>

              <div className="col-span-2">
                <ProductDiscounts
                  discounts={productDiscount}
                  setDiscounts={setProductDiscount}
                  productId={id}
                />
              
              </div>  



              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="col-start-2 flex justify-end gap-3 pt-4">
                <Button variant="default" type="button" onClick={() => navigate('/products')}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : id ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </CardContent>
        </Card> 
      )
      }

     
      
    </div>
  )
}
