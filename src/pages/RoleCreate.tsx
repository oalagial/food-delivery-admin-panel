import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Checkbox } from '../components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import {
  createRole,
  fetchPermissionsDefinitions,
  getRoleById,
  updateRole,
  type PermissionDefinition,
} from '../utils/api'
import { canSubmitResourceForm } from '../utils/permissions'
import { FormSaveBarrier } from '../components/FormSaveBarrier'

function permissionResourceKey(action: string): string {
  const i = action.indexOf('.')
  return i === -1 ? action : action.slice(0, i)
}

/** Matches backend catalog: `*.read`, `orders.read_status.*`, `orders.read_payment.*` — not `*`. */
function isCatalogReadPermission(action: string): boolean {
  if (action === '*') return false
  if (action.endsWith('.read')) return true
  if (action.startsWith('orders.read_status.')) return true
  if (action.startsWith('orders.read_payment.')) return true
  return false
}

export default function RoleCreate() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [catalog, setCatalog] = useState<PermissionDefinition[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const canSave = canSubmitResourceForm('roles', !!id)

  const grouped = useMemo(() => {
    const m = new Map<string, PermissionDefinition[]>()
    for (const def of catalog) {
      const key = permissionResourceKey(def.action)
      const list = m.get(key) ?? []
      list.push(def)
      m.set(key, list)
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.action.localeCompare(b.action))
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [catalog])

  useEffect(() => {
    let mounted = true
    setCatalogLoading(true)
    fetchPermissionsDefinitions()
      .then((rows) => {
        if (mounted) setCatalog(rows)
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (mounted) setCatalogLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!id) {
      setSelectedIds(new Set())
      return
    }
    let mounted = true
    getRoleById(id)
      .then((data) => {
        if (!mounted) return
        if (data) {
          setForm({
            name: String(data.name ?? ''),
            description: String(data.description ?? ''),
          })
          const ids = (data.permissions ?? [])
            .map((rp) => rp.permission?.id ?? rp.permissionId)
            .filter((x): x is number => typeof x === 'number' && !Number.isNaN(x))
          setSelectedIds(new Set(ids))
        } else {
          setError(t('common.roleNotFound'))
        }
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : t('common.failedLoadRole'))
      })
    return () => {
      mounted = false
    }
  }, [id, t])

  function toggleId(permId: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(permId)
      else next.delete(permId)
      return next
    })
  }

  function selectAllInCatalog() {
    setSelectedIds(new Set(catalog.map((c) => c.id)))
  }

  function clearAllPermissions() {
    setSelectedIds(new Set())
  }

  /** Adds every catalog permission that is read-only (keeps existing selections). */
  function selectAllReadPermissions() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const c of catalog) {
        if (isCatalogReadPermission(c.action)) next.add(c.id)
      }
      return next
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: String(form.name).trim(),
        description: String(form.description).trim(),
        permissionIds: [...selectedIds],
      }
      if (!payload.name) {
        setError(t('common.validationNameRequired'))
        setSaving(false)
        return
      }

      if (id) {
        await updateRole(id, payload)
      } else {
        await createRole(payload)
      }

      navigate('/roles')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const starDef = catalog.find((c) => c.action === '*')

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

            <FormSaveBarrier canSave={canSave}>
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

              <div className="space-y-3 border-t pt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t('common.permissionMatrix')}</h3>
                    <p className="text-sm text-muted-foreground">{t('common.permissionMatrixDesc')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="default" size="sm" onClick={selectAllInCatalog} disabled={catalogLoading}>
                      {t('common.selectAllPermissions')}
                    </Button>
                    <Button type="button" variant="default" size="sm" onClick={selectAllReadPermissions} disabled={catalogLoading}>
                      {t('common.selectAllReadPermissions')}
                    </Button>
                    <Button type="button" variant="default" size="sm" onClick={clearAllPermissions} disabled={catalogLoading}>
                      {t('common.clearPermissions')}
                    </Button>
                  </div>
                </div>

                {catalogLoading && (
                  <p className="text-sm text-muted-foreground">{t('common.loadingPermissions')}</p>
                )}

                {!catalogLoading && starDef && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                    <Checkbox
                      checked={selectedIds.has(starDef.id)}
                      onCheckedChange={(v) => toggleId(starDef.id, v)}
                    />
                    <span>
                      <span className="font-medium">{starDef.action}</span>
                      {starDef.description ? (
                        <span className="ml-2 text-sm text-muted-foreground">{starDef.description}</span>
                      ) : null}
                    </span>
                  </label>
                )}

                {!catalogLoading &&
                  grouped.map(([resource, defs]) => {
                    const withoutStar = defs.filter((d) => d.action !== '*')
                    if (withoutStar.length === 0) return null
                    return (
                      <div key={resource} className="rounded-md border p-4">
                        <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                          {resource.replace(/_/g, ' ')}
                        </h4>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {withoutStar.map((def) => (
                            <li key={def.id}>
                              <label className="flex cursor-pointer items-start gap-2 text-sm">
                                <Checkbox
                                  checked={selectedIds.has(def.id)}
                                  onCheckedChange={(v) => toggleId(def.id, v)}
                                />
                                <span>
                                  <span className="font-mono text-xs">{def.action}</span>
                                  {def.description ? (
                                    <span className="mt-0.5 block text-muted-foreground">{def.description}</span>
                                  ) : null}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
              </div>
            </FormSaveBarrier>

            <div className="flex justify-end gap-3 pt-4">
              <Link to="/roles">
                <Button variant="default" type="button">
                  {t('common.cancel')}
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={!canSave || saving || catalogLoading}>
                {saving ? (id ? t('common.saving') : t('common.creating')) : id ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
