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
import { Select } from '../components/ui/select';

export default function SectionCreate(){
  const params = useParams<{id?: string}>()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [typeId, setTypeId] = useState<number | ''>('')
  const [productsIds, setProductsIds] = useState<any[]>([])
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
        // Support both productsIds (array of ids) and products (array of objects with id)
        let ids: number[] = []
        if (Array.isArray(s.productsIds) && s.productsIds.length > 0) {
          ids = s.productsIds.map((p: any) => Number(p))
        } else if (Array.isArray(s.products) && s.products.length > 0) {
          ids = s.products.map((p: any) => Number(p.id))
        }
        setProductsIds(ids)
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
    <div className="space-y-6">
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
            <div className="grid grid-cols-2 gap-4">

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
                <Select 
                  id="type"
                  value={String(typeId)} 
                  onChange={e=>setTypeId(Number(e.target.value))} 
                  className="mt-2 w-full"
                >
                  <option value="">Select a type</option>
                  {types.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
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
              <Label>Products</Label>
              <div className="flex gap-4 mt-2">
                {/* Available Products */}
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-sm">Available</div>
                  <div className="border rounded p-2 h-48 overflow-y-auto bg-white">
                    {products.filter(p => !productsIds.includes(p.id)).length === 0 && (
                      <div className="text-xs text-gray-400">No more products</div>
                    )}
                    {products.filter(p => !productsIds.includes(p.id)).map(p => (
                      <div key={p.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded cursor-pointer group">
                        <span>{p.name ?? String(p.id)}</span>
                        <button type="button" className="ml-2 text-green-600 hover:text-green-800 text-xs font-bold opacity-80 group-hover:opacity-100" onClick={() => setProductsIds(ids => [...ids, p.id])}>Add</button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Selected Products */}
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-sm">Selected</div>
                  <div className="border rounded p-2 h-48 overflow-y-auto bg-white">
                    {productsIds.length === 0 && (
                      <div className="text-xs text-gray-400">No products selected</div>
                    )}
                    {products.filter(p => productsIds.includes(p.id)).map(p => (
                      <div key={p.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded cursor-pointer group">
                        <span>{p.name ?? String(p.id)}</span>
                        <button type="button" className="ml-2 text-red-600 hover:text-red-800 text-xs font-bold opacity-80 group-hover:opacity-100" onClick={() => setProductsIds(ids => ids.filter(id => id !== p.id))}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Click "Add" to select, "Remove" to unselect.</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="default" onClick={()=>navigate('/sections')}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : params.id ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
