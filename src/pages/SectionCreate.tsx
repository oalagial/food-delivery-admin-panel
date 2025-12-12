import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getSectionById, createSection, updateSection, getTypesList, getProductsList } from '../utils/api'
import type { TypeItem, Product } from '../utils/api'

export default function SectionCreate(){
  const params = useParams<{id?: string}>()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [typeId, setTypeId] = useState<number | ''>('')
  const [productsIds, setProductsIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [types, setTypes] = useState<TypeItem[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(()=>{
    let mounted = true
    getTypesList().then(d=>{ if(mounted) setTypes(d)}).catch(()=>{})
    getProductsList().then(d=>{ if(mounted) setProducts(d)}).catch(()=>{})
    if(params.id){
      getSectionById(Number(params.id)).then((s) => {
        if (!s) return
        setName(s.name || '')
        setDescription(String(s.description || ''))
        setTypeId(s.typeId !== undefined && s.typeId !== null && String(s.typeId) !== '' ? Number(s.typeId) : '')
        setProductsIds((s.productsIds || []).map(p => Number(p)))
      }).catch(e=>setError(String(e)))
    }
    return ()=>{ mounted = false }
  }, [params.id])

  async function onSubmit(e: FormEvent<HTMLFormElement>){
    e.preventDefault()
    setLoading(true)
    setError(null)
    const payload = { name, description: String(description || ''), typeId: typeof typeId === 'string' ? Number(typeId) : typeId, productsIds }
    try{
      if(params.id){
        await updateSection(Number(params.id), payload)
      } else {
        await createSection(payload)
      }
      navigate('/sections')
    }catch(err: unknown){ setError(String(err)) }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">{params.id ? 'Edit Section' : 'Create Section'}</h1>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{params.id ? 'Update Section' : 'New Section'}</CardTitle>
          <CardDescription>Define section details and associated products</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Section Name *</Label>
              <Input 
                id="name"
                className="mt-2 w-full"
                value={name} 
                onChange={e=>setName(e.target.value)} 
                placeholder="Section name"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Product Type</Label>
              <select 
                id="type"
                value={String(typeId)} 
                onChange={e=>setTypeId(Number(e.target.value))} 
                className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a type</option>
                {types.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                className="mt-2 w-full"
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
                placeholder="Describe this section..."
              />
            </div>

            <div>
              <Label htmlFor="products">Products</Label>
              <select 
                id="products"
                multiple 
                value={productsIds.map(String)} 
                onChange={e=>{
                  const opts = Array.from(e.currentTarget.selectedOptions).map(o => Number(o.value))
                  setProductsIds(opts)
                }} 
                className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name ?? String(p.id)}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={()=>navigate('/sections')}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : params.id ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
