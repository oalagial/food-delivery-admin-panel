import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createProduct, getProductById, updateProduct, getTypesList, getExtrasByProduct, createProductExtra } from '../utils/api'
import type { CreateProductExtraPayload, CreateProductPayload, ProductExtra } from '../utils/api'
import { Select } from '../components/ui/select';

export default function ProductCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  

  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [productExtras, setProductExtras] = useState<ProductExtra[]>([])
  
  // Keep a raw ingredients text input so typing a trailing comma doesn't get trimmed away
  const [ingredientsInput, setIngredientsInput] = useState('')

  const [form, setForm] = useState<Partial<CreateProductPayload>>({
    name: '',
    description: '',
    image: '',
    typeId: undefined,
    ingredients: [],
    price: undefined,
    isAvailable: true,
  })

  useEffect(() => {
    let mounted = true
    getTypesList()
      .then((data) => { if (!mounted) return; setTypes(data) })
      .catch(() => { if (!mounted) return; setTypes([]) })
      .finally(() => { if (mounted) setTypesLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true;

    Promise.all([
      id ? getProductById(id).catch(() => null) : Promise.resolve(null),
      id ? getExtrasByProduct(id).catch(() => []) : Promise.resolve(null)
    ]).then(([product, productExtras]) => {
      if (product) {
        setForm({
          name: product.name,
          description: product.description,
          image: product.image,
          typeId: product.typeId,
          ingredients: product.ingredients ?? [],
          price: product.price,
          isAvailable: product.isAvailable,
        })
        setIngredientsInput(Array.isArray(product.ingredients) ? product.ingredients.join(', ') : '')
      }

      if (productExtras) {
        setProductExtras(productExtras.map(extra => ({
          productId: extra.productId,
          name: extra.name,
          price: extra.price
        })))
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
        productId: id ? Number(id) : undefined,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload: CreateProductPayload = {
      name: String(form.name ?? '').trim(),
      description: String(form.description ?? '').trim(),
      image: String(form.image ?? '').trim(),
      typeId: form.typeId,
      ingredients: ingredientsInput.split(',').map((x) => x.trim()).filter(Boolean),
      price: form.price !== undefined ? Number(form.price) : undefined,
      isAvailable: !!form.isAvailable,
    }

    try {
      if (id) {
        await updateProduct(id, payload)
        await Promise.all(productExtras.map(async (extra: any) => {
          createProductExtra(extra)
        }))
      } else {
        await createProduct(payload)
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
                <Label htmlFor="price">Price ($)</Label>
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
                <Label htmlFor="image">Image URL</Label>
                <div className="mt-2 flex items-center gap-4">
                  <input id="images" type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files)} />
                  <label htmlFor="images"><Button variant="primary" type="button">Choose Images</Button></label>
                  <span className="text-sm text-gray-600">{files && files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}</span>
                </div>
                {/* <Input 
                  id="image"
                  className="mt-2 w-full"
                  value={form.image as string} 
                  onChange={(e)=> setForm(s=>({...s, image: e.target.value}))} 
                  placeholder="https://example.com/image.jpg" 
                /> */}
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
                <div>
                  <Button
                    className='mb-2'
                    type="button" 
                    onClick={addExtra}
                  > Add Extra
                  </Button>

                  </div>
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
                        <Label htmlFor={`productExtraPrice-${index}`}>Extra Price</Label>
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
