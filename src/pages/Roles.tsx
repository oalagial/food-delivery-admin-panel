import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { FiAlertCircle, FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'

type Role = {
  id: number | string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

import { deleteRole, getRolesList } from '../utils/api'
import { perm } from '../utils/permissions'
import { PageHeader, PageToolbarCard } from '../components/page-layout'

export default function Roles() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    id: string | number | null
    name: string | null
  }>({ show: false, id: null, name: null })
  const [error, setError] = useState<string | null>(null)

  // Editing handled by dedicated create/edit page

  async function fetchRoles() {
    setLoading(true)
    setError(null)
    try {
      const data = await getRolesList({ page: 1, limit: 200 })
      setRoles(data as Role[])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchRoles()
  }, [])

  function openConfirmDialog(r: Role) {
    const id = r.id
    const name = String(r.name ?? '').trim() || `#${String(id)}`
    setConfirmDialog({ show: true, id, name })
  }

  function closeConfirmDialog() {
    setConfirmDialog({ show: false, id: null, name: null })
  }

  async function handleConfirmDelete() {
    const id = confirmDialog.id
    if (id === null || id === undefined) return
    setError(null)
    setDeletingId(id)
    try {
      await deleteRole(id)
      await fetchRoles()
      closeConfirmDialog()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      closeConfirmDialog()
    } finally {
      setDeletingId(null)
    }
  }



  return (
    <div className="space-y-6">
      {confirmDialog.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
          onClick={closeConfirmDialog}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <Alert variant="destructive">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>{t('rolesPage.deleteTitle')}</AlertTitle>
                <AlertDescription>
                  {t('rolesPage.deleteConfirm', {
                    name: confirmDialog.name ?? '',
                  })}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog} disabled={deletingId !== null}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void handleConfirmDelete()}
                  disabled={deletingId !== null}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <PageHeader
          title={t('rolesPage.title')}
          subtitle={t('rolesPage.subtitle')}
          helpTooltip={t('common.toolbarHintDefault')}
          helpAriaLabel={t('common.moreInfo')}
        />
        {perm('roles', 'create') ? (
          <PageToolbarCard>
            <div className="flex flex-wrap justify-end gap-3">
              <Link to="/roles/creation" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                  className="h-9 w-full justify-center px-4 text-sm sm:w-auto sm:px-6"
                >
                  <span className="sm:inline">{t('rolesPage.create')}</span>
                </Button>
              </Link>
            </div>
          </PageToolbarCard>
        ) : null}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong className="font-semibold">{t('common.error')}:</strong> {error}
        </div>
      )}

      <div>
        {loading && (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>{t('rolesPage.name')}</TableHeadCell>
                <TableHeadCell>{t('rolesPage.description')}</TableHeadCell>
                <TableHeadCell>{t('common.created')}</TableHeadCell>
                <TableHeadCell>{t('rolesPage.actions')}</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, r) => (
                <TableRow key={r} className="animate-pulse">
                  {Array.from({ length: 5 }).map((__, c) => (
                    <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {roles.length === 0 ? (
                <p className="text-sm">{t('rolesPage.noRoles')}</p>
              ) : (
                roles.map((r) => (
                  <Card key={r.id} className="shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-semibold">
                        {r.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 pt-0 space-y-1">
                      <p className="text-xs">
                        {r.description || t('common.noDescription')}
                      </p>
                      {r.createdAt && (
                        <p className="text-[11px]">
                          {t('common.created')}: {new Date(String(r.createdAt)).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                      {perm('roles', 'update') ? (
                        <Link to={`/roles/creation/${encodeURIComponent(String(r.id ?? ''))}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-xs"
                            icon={<FiEdit className="w-4 h-4" />}
                          />
                        </Link>
                      ) : null}
                      {perm('roles', 'delete') ? (
                        <Button
                          variant="danger"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiTrash className="w-4 h-4" />}
                          disabled={deletingId !== null}
                          aria-label={t('rolesPage.deleteTitle')}
                          onClick={() => openConfirmDialog(r)}
                        />
                      ) : null}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeadCell>{t('rolesPage.name')}</TableHeadCell>
                    <TableHeadCell>{t('rolesPage.description')}</TableHeadCell>
                    <TableHeadCell>{t('common.created')}</TableHeadCell>
                    <TableHeadCell>{t('rolesPage.actions')}</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>{t('rolesPage.noRoles')}</TableCell>
                    </TableRow>
                  )}
                  {roles.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>
                        {r.description ?? ''}
                      </TableCell>
                      <TableCell>{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</TableCell>
                      <TableCell>
                        {perm('roles', 'update') ? (
                          <Link to={`/roles/creation/${encodeURIComponent(String(r.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                        ) : null}
                        {perm('roles', 'delete') ? (
                          <Button
                            variant="danger"
                            size="sm"
                            className="p-2"
                            icon={<FiTrash className="w-4 h-4" />}
                            disabled={deletingId !== null}
                            aria-label={t('rolesPage.deleteTitle')}
                            onClick={() => openConfirmDialog(r)}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
