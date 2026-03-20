import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          {params.id ? t('createForms.editSection') : t('createForms.createSection')}
        </h1>
      </div>
      
      <form
        onSubmit={onSubmit}
        className="grid gap-6 max-w-5xl lg:grid-cols-2"
      >
        {/* Basic info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {params.id ? t('createForms.updateSection') : t('createForms.newSection')}
            </CardTitle>
            <CardDescription>
              {t('createForms.sectionBasicDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('createForms.sectionNameStar')}</Label>
                <Input 
                  id="name"
                  className="mt-1.5 w-full"
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  placeholder={t('common.sectionNamePh')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">{t('common.productType')}</Label>
                <Select 
                  id="type"
                  value={String(typeId)} 
                  onChange={e=>setTypeId(Number(e.target.value))} 
                  className="mt-1.5 w-full"
                >
                  <option value="">{t('common.selectType')}</option>
                  {types.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea 
                id="description"
                className="mt-1.5 w-full"
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
                placeholder={t('createForms.sectionDescPh')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('common.sectionProducts')}</CardTitle>
            <CardDescription>
              {t('createForms.chooseProductsSection')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('common.sectionProducts')}</Label>
              <div className="flex gap-4 mt-2">
                {/* Available Products */}
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-sm">{t('common.available')}</div>
                  <div className="border rounded p-2 h-48 overflow-y-auto bg-white dark:bg-slate-900">
                    {products.filter(p => !productsIds.includes(p.id)).length === 0 && (
                      <div className="text-xs text-gray-400">{t('createForms.noMoreProducts')}</div>
                    )}
                    {products.filter(p => !productsIds.includes(p.id)).map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer group"
                      >
                        <span>{p.name ?? String(p.id)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-green-600 hover:text-green-800 text-xs font-bold opacity-80 group-hover:opacity-100"
                          onClick={() => setProductsIds(ids => [...ids, p.id])}
                        >
                          {t('common.add')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Selected Products */}
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-sm">{t('common.selected')}</div>
                  <div className="border rounded p-2 h-48 overflow-y-auto bg-white dark:bg-slate-900">
                    {productsIds.length === 0 && (
                      <div className="text-xs text-gray-400">{t('createForms.noProductsSelected')}</div>
                    )}
                    {products.filter(p => productsIds.includes(p.id)).map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer group"
                      >
                        <span>{p.name ?? String(p.id)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-red-600 hover:text-red-800 text-xs font-bold opacity-80 group-hover:opacity-100"
                          onClick={() =>
                            setProductsIds(ids => ids.filter(id => id !== p.id))
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="default" onClick={()=>navigate('/sections')}>{t('common.cancel')}</Button>
              <Button type="submit" variant="primary" disabled={loading}>{loading ? t('common.saving') : params.id ? t('common.update') : t('common.create')}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
