import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createProduct, getProductById, updateProduct, getTypesList } from '../utils/api'
import type { CreateProductPayload } from '../utils/api'
import { Select } from '../components/ui/select';

export default function ProductCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  

  const [types, setTypes] = useState<any[]>([])
  const [typesLoading, setTypesLoading] = useState(true)

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
    if (!id) return
    let mounted = true
    getProductById(id)
      .then((data) => {
        if (!mounted) return
        if (data) {
          setForm({
            name: data.name,
            description: data.description,
            image: data.image,
            typeId: data.typeId,
            ingredients: data.ingredients ?? [],
            price: data.price,
            isAvailable: data.isAvailable,
          })
          setIngredientsInput(Array.isArray(data.ingredients) ? data.ingredients.join(', ') : '')
        }
      })
      .catch((err) => { if (!mounted) return; setError(err?.message || 'Failed to load product') })
    return () => { mounted = false }
  }, [id])

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
              {typesLoading ? (
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
    </div>
  )
}
