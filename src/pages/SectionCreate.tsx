import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { getSectionById, createSection, updateSection, getTypesList } from '../utils/api'
import type { TypeItem } from '../utils/api'

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

  useEffect(()=>{
    let mounted = true
    getTypesList().then(d=>{ if(mounted) setTypes(d)}).catch(()=>{})
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
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">{params.id ? 'Edit' : 'Create'} Section</h1>
      <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input value={name} onChange={e=>setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select value={String(typeId)} onChange={e=>setTypeId(Number(e.target.value))} className="w-full rounded border px-2 py-1">
            <option value="">Select a type</option>
            {types.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full rounded border px-2 py-1" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Product IDs (comma separated)</label>
          <Input value={productsIds.join(',')} onChange={e=>setProductsIds(e.target.value.split(',').map(s=>Number(s.trim())).filter(Boolean))} />
        </div>

        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          <Button type="button" variant="ghost" onClick={()=>navigate('/sections')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
