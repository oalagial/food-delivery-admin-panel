import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { createProduct, getProductById, updateProduct, getTypesList } from '../utils/api'
import type { CreateProductPayload } from '../utils/api'

export default function ProductCreate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  

  const [types, setTypes] = useState<any[]>([])
  const [typesLoading, setTypesLoading] = useState(true)

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
      ingredients: Array.isArray(form.ingredients) ? form.ingredients : [],
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
      <h1 className="text-2xl font-semibold">{id ? 'Edit Product' : 'Create Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input value={form.name as string} onChange={(e) => setForm(s => ({...s, name: e.target.value}))} placeholder="Product name" className="w-full" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          {typesLoading ? <div className="text-sm text-gray-500">Loading types...</div> : (
            <select
              value={form.typeId !== undefined && form.typeId !== null ? String(form.typeId) : ''}
              onChange={(e) => setForm(s => ({ ...s, typeId: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select a type</option>
              {types.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <Input
            value={form.price !== undefined ? String(form.price) : ''}
            onChange={(e) => {
              const v = e.target.value;
              setForm(s => ({ ...s, price: v === '' ? undefined : Number(v) }));
            }}
            placeholder="Price"
            type="number"
            step="0.01"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma separated)</label>
          <Input
            value={Array.isArray(form.ingredients) ? (form.ingredients as string[]).join(', ') : ''}
            onChange={(e)=> setForm(s=>({...s, ingredients: String(e.target.value).split(',').map(x=>x.trim()).filter(Boolean)}))}
            placeholder="Tomato, Cheese"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <Input value={form.image as string} onChange={(e)=> setForm(s=>({...s, image: e.target.value}))} placeholder="Image url" className="w-full" />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.isAvailable} onChange={(e)=> setForm(s=>({...s, isAvailable: e.target.checked}))} />
            <span className="text-sm">Available</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/products')}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>

      {error && <div className="text-red-600">{error}</div>}
    </div>
  )
}
