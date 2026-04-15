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
import { getSectionById, createSection, updateSection, getTypesList, getAllProductsForSelection } from '../utils/api'
import { canSubmitResourceForm } from '../utils/permissions'
import { FormSaveBarrier } from '../components/FormSaveBarrier'
import type { TypeItem, Product } from '../utils/api'
import { Select } from '../components/ui/select';
import { TransferList } from '../components/ui/transfer-list'

export default function SectionCreate(){
  const { t } = useTranslation()
  const params = useParams<{id?: string}>()
  const navigate = useNavigate()
  const canSave = canSubmitResourceForm('sections', !!params.id)
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
    getAllProductsForSelection().then(d=>{ if(mounted) setProducts(d)}).catch(()=>{})
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
    if (!canSave) return
    setLoading(true)
    setError(null)
    const payload = {
      name,
      description: String(description || ''),
      typeId: typeof typeId === 'string' ? Number(typeId) : typeId,
      productsIds,
      orderedProducts: productsIds.map((productId, index) => ({
        productId: Number(productId),
        sortOrder: index + 1,
      })),
    }
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
        <FormSaveBarrier canSave={canSave} alertClassName="lg:col-span-2">
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
              <TransferList
                items={products.map((product) => ({
                  id: product.id,
                  label: String(product.name ?? product.id),
                }))}
                selectedIds={productsIds}
                onChange={setProductsIds}
                availableTitle={t('common.available')}
                selectedTitle={t('common.selected')}
                availableEmptyText={t('createForms.noMoreProducts')}
                selectedEmptyText={t('createForms.noProductsSelected')}
                searchPlaceholder={t('common.search')}
                noDataText={t('common.noData')}
                hintText={t('common.pickerHintAddRemoveReorder')}
                clearLabel={t('common.clearField')}
                reorder
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        </FormSaveBarrier>
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 lg:col-span-2">
          <Button type="button" variant="default" onClick={()=>navigate('/sections')}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={!canSave || loading}>{loading ? t('common.saving') : params.id ? t('common.update') : t('common.create')}</Button>
        </div>
      </form>
    </div>
  )
}
