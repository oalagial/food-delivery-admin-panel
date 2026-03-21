import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getRoleById } from '../utils/api'
import { API_BASE } from '../config'

export default function RoleCreate() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (!id) return
    let mounted = true
    getRoleById(id)
      .then((data) => {
        if (!mounted) return
        if (data) {
          setForm((s) => ({
            ...s,
            name: String(data.name ?? ''),
            description: String(data.description ?? '')

          })
        )} else {
          setError(t('common.roleNotFound'))
        }
      })
      .catch((err) => {
        setError(err?.message || t('common.failedLoadRole'))
      })
    // ;(async () => {
    //   try {
    //     // const res = await fetch(`${API_BASE}/roles?id=${id}`)
    //     const res = await getRoleById(id); 
    //     // if (!res.ok) throw new Error(`Failed to load role: ${res.status}`)
    //     // const json = await res.json()
    //     // if (!mounted) return
    //     setForm({ name: String(json.name ?? ''), description: String(json.description ?? '') })
    //   } catch (err: unknown) {
    //     if (!mounted) return
    //     setError(err instanceof Error ? err.message : String(err))
    //   }
    // })()

    // return () => { mounted = false }
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { name: String(form.name).trim(), description: String(form.description).trim() }
      if (!payload.name) {
        setError(t('common.validationNameRequired'))
        setSaving(false)
        return
      }

      if (id) {
        const res = await fetch(`${API_BASE}/roles/update/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(`Update failed ${res.status}`)
      } else {
        const res = await fetch(`${API_BASE}/roles/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(`Create failed ${res.status}`)
      }

      navigate('/roles')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{id ? t('createForms.editRole') : t('createForms.createRole')}</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{id ? t('createForms.editRole') : t('createForms.newRole')}</CardTitle>
          <CardDescription>{t('common.roleDetails')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="name">{t('common.roleName')} *</Label>
              <Input 
                id="name"
                className="mt-2 w-full"
                value={form.name} 
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} 
                placeholder={t('common.roleNamePh')} 
                required 
              />
            </div>

            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea 
                id="description"
                className="mt-2 w-full"
                value={form.description} 
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} 
                placeholder={t('common.roleDescPh')}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to="/roles"><Button variant="default" type="button">{t('common.cancel')}</Button></Link>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? (id ? t('common.saving') : t('common.creating')) : (id ? t('common.update') : t('common.create'))}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
