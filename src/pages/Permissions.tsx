import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import Table, { TableBody, TableCell, TableHead, TableHeadCell, TableRow } from '../components/ui/table'
import {
  fetchPermissionsDefinitions,
  getRolesList,
  type PermissionDefinition,
  type RoleItem,
} from '../utils/api'
import { hasPermission } from '../utils/permissions'
import { PageHeader, PageToolbarCard } from '../components/page-layout'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

function resourceKey(action: string): string {
  const i = action.indexOf('.')
  return i === -1 ? action : action.slice(0, i)
}

function rolesUsingPermissionId(
  roles: RoleItem[],
  permissionId: number,
): string[] {
  const names: string[] = []
  for (const r of roles) {
    const links = r.permissions ?? []
    const has = links.some(
      (l) => l.permission?.id === permissionId || l.permissionId === permissionId,
    )
    if (has && r.name) names.push(String(r.name))
  }
  return names.sort((a, b) => a.localeCompare(b))
}

export default function Permissions() {
  const { t } = useTranslation()
  const [defs, setDefs] = useState<PermissionDefinition[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    Promise.all([fetchPermissionsDefinitions(), getRolesList({ limit: 500 })])
      .then(([d, r]) => {
        if (!mounted) return
        setDefs(d)
        setRoles(r)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return defs
    return defs.filter((d) => {
      const a = d.action.toLowerCase()
      const desc = (d.description ?? '').toLowerCase()
      return a.includes(q) || desc.includes(q)
    })
  }, [defs, query])

  const grouped = useMemo(() => {
    const m = new Map<string, PermissionDefinition[]>()
    for (const d of filtered) {
      const key = resourceKey(d.action)
      const list = m.get(key) ?? []
      list.push(d)
      m.set(key, list)
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.action.localeCompare(b.action))
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permissionsPage.title')}
        subtitle={t('permissionsPage.subtitle')}
        helpTooltip={t('common.toolbarHintDefault')}
        helpAriaLabel={t('common.moreInfo')}
        actions={
          hasPermission('roles.read') ? (
            <Link to="/roles" className="shrink-0">
              <Button variant="primary" className="h-9 w-full sm:w-auto">
                {t('permissionsPage.manageRoles')}
              </Button>
            </Link>
          ) : null
        }
      />

      <Card className="border-blue-100 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('permissionsPage.howItWorksTitle')}</CardTitle>
          <CardDescription className="text-sm text-gray-700 dark:text-slate-300">
            {t('permissionsPage.howItWorksBody')}
          </CardDescription>
        </CardHeader>
      </Card>

      <PageToolbarCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex w-full max-w-md flex-col gap-1.5">
            <Label htmlFor="perm-search" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('permissionsPage.search')}
            </Label>
            <Input
              id="perm-search"
              type="search"
              placeholder={t('permissionsPage.searchPh')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('permissionsPage.count', { n: filtered.length, total: defs.length })}
          </p>
        </div>
      </PageToolbarCard>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && !error && grouped.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('permissionsPage.empty')}</p>
      )}

      {!loading &&
        grouped.map(([resource, rows]) => (
          <Card key={resource} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg capitalize">
                {resource.replace(/_/g, ' ')}
              </CardTitle>
              <CardDescription>
                {t('permissionsPage.groupCount', { n: rows.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeadCell>{t('permissionsPage.colId')}</TableHeadCell>
                      <TableHeadCell>{t('permissionsPage.colAction')}</TableHeadCell>
                      <TableHeadCell>{t('permissionsPage.colDescription')}</TableHeadCell>
                      <TableHeadCell>{t('permissionsPage.colRoles')}</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {rows.map((d) => {
                      const usedBy = rolesUsingPermissionId(roles, d.id)
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-xs">{d.id}</TableCell>
                          <TableCell className="font-mono text-xs">{d.action}</TableCell>
                          <TableCell className="max-w-md text-sm">
                            {d.description ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {usedBy.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span title={usedBy.join(', ')}>{usedBy.join(', ')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {rows.map((d) => {
                  const usedBy = rolesUsingPermissionId(roles, d.id)
                  return (
                    <div
                      key={d.id}
                      className="rounded-lg border border-gray-200 p-3 text-sm dark:border-slate-700"
                    >
                      <div className="font-mono text-xs text-blue-700 dark:text-blue-400">{d.action}</div>
                      <div className="mt-1 text-muted-foreground">{d.description ?? '—'}</div>
                      <div className="mt-2 text-xs text-gray-500">
                        {t('permissionsPage.colRoles')}:{' '}
                        {usedBy.length ? usedBy.join(', ') : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
