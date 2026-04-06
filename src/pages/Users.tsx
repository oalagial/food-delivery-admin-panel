import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { Skeleton } from '../components/ui/skeleton'
import { FiPlus, FiEdit, FiUserMinus, FiUserPlus, FiTrash2 } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

type User = {
  id: number | string
  email?: string
  username?: string
  createdAt?: string
  [key: string]: unknown
}

import { API_BASE } from '../config'
import { getRolesList, setUserActive, getCurrentUserId, deleteUser } from '../utils/api'
import { perm } from '../utils/permissions'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { TableItemsPerPageSelect, DEFAULT_TABLE_PAGE_SIZE } from '../components/TableItemsPerPageSelect'
import { PageHeader, PageToolbarCard } from '../components/page-layout'

export default function Users() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [activatingId, setActivatingId] = useState<string | number | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const currentUserId = getCurrentUserId()

  // Use dedicated create/edit page instead of inline editing

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/users`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = Array.isArray(json) ? json : json?.data ?? Object.values(json ?? {})
      setUsers(data)
      // fetch roles map to show role names (use api helper)
      try {
        const roles = await getRolesList()
        const map: Record<string, string> = {}
        roles.forEach((role) => { if (role && role.id !== undefined) map[String(role.id)] = String(role.name ?? role.id) })
        setRolesMap(map)
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsers()
  }, [])

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return users.slice(start, start + pageSize)
  }, [users, page, pageSize])

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(
        (pn) =>
          pn === 1 ||
          pn === totalPages ||
          (pn >= page - 2 && pn <= page + 2)
      )
      .reduce((arr: (number | 'ellipsis')[], pn, idx, src) => {
        if (idx > 0 && pn - (src[idx - 1] as number) > 1) arr.push('ellipsis')
        arr.push(pn)
        return arr
      }, [])
  }, [page, totalPages])

  useEffect(() => {
    if (!userToDeactivate) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDeactivate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userToDeactivate])

  useEffect(() => {
    if (!userToDelete) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userToDelete])

  if (loading && users.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('usersPage.title')}</h1>
          {perm('users', 'create') ? (
            <Link to="/users/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>{t('usersPage.create')}</Button></Link>
          ) : null}
        </div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{t('usersPage.email')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.username')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.role')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.created')}</TableHeadCell>
              <TableHeadCell className="text-center">{t('common.actions')}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 6 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }



  function askDeactivate(user: User) {
    setError(null)
    setUserToDeactivate(user)
  }

  function cancelDeactivate() {
    setUserToDeactivate(null)
  }

  async function confirmDeactivate() {
    if (!userToDeactivate) return
    setError(null)
    setDeactivating(true)
    try {
      await setUserActive(userToDeactivate.id, false)
      setUserToDeactivate(null)
      await fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setDeactivating(false)
    }
  }

  function isUserActive(u: User): boolean {
    const v = (u as Record<string, unknown>).isActive
    if (v === undefined || v === null) return true
    return v === true || v === 'true' || String(v) === '1'
  }

  async function handleActivate(user: User) {
    setError(null)
    setActivatingId(user.id)
    try {
      await setUserActive(user.id, true)
      await fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setActivatingId(null)
    }
  }

  function askDelete(user: User) {
    setError(null)
    setUserToDelete(user)
  }

  function cancelDelete() {
    setUserToDelete(null)
  }

  async function confirmDelete() {
    if (!userToDelete) return
    setError(null)
    setDeletingUser(true)
    try {
      await deleteUser(userToDelete.id)
      setUserToDelete(null)
      await fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setDeletingUser(false)
    }
  }



  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <PageHeader
          title={t('usersPage.title')}
          subtitle={t('usersPage.subtitle')}
          helpTooltip={t('common.toolbarHintDefault')}
          helpAriaLabel={t('common.moreInfo')}
        />
        {perm('users', 'create') ? (
          <PageToolbarCard>
            <div className="flex flex-wrap justify-end gap-3">
              <Link to="/users/creation" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                  className="h-9 w-full justify-center px-4 text-sm sm:w-auto sm:px-6"
                >
                  <span className="sm:inline">{t('usersPage.createUser')}</span>
                </Button>
              </Link>
            </div>
          </PageToolbarCard>
        ) : null}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('usersPage.errorTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {userToDeactivate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && cancelDeactivate()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-user-title"
        >
          <Card className="w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle id="deactivate-user-title">{t('usersPage.deactivateTitle')}</CardTitle>
              <CardDescription>
                {t('usersPage.deactivateDesc', { id: userToDeactivate.email ?? userToDeactivate.username ?? userToDeactivate.id })}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="default" onClick={cancelDeactivate} disabled={deactivating}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDeactivate} disabled={deactivating}>
                {deactivating ? t('usersPage.deactivating') : t('usersPage.deactivate')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && !deletingUser && cancelDelete()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
        >
          <Card className="w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle id="delete-user-title">{t('usersPage.deleteTitle')}</CardTitle>
              <CardDescription>
                {t('usersPage.deleteDesc', { id: userToDelete.email ?? userToDelete.username ?? userToDelete.id })}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="default" onClick={cancelDelete} disabled={deletingUser}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deletingUser}>
                {deletingUser ? t('usersPage.deleting') : t('usersPage.delete')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">{t('usersPage.noUsers')}</p>
        ) : (
          paginatedUsers.map((u) => {
            const active = isUserActive(u)
            const roleLabel = (() => {
              const rec = u as unknown as Record<string, unknown>
              if (Array.isArray(rec.roles) && rec.roles.length > 0) {
                return rec.roles
                  .map((role: any) => role?.name || rolesMap[String(role?.id)] || String(role?.id || ''))
                  .filter(Boolean)
                  .join(', ')
              }
              const roleObj = rec.role
              if (roleObj && typeof roleObj === 'object' && (roleObj as Record<string, unknown>).name)
                return String((roleObj as Record<string, unknown>).name)
              const rId = rec.roleId ?? rec.role_id ?? rec.roleId
              if (rId !== undefined && rId !== null && String(rId) !== '')
                return rolesMap[String(rId)] ?? String(rId)
              return ''
            })()

            const isCurrent = currentUserId != null && String(u.id) === String(currentUserId)

            return (
              <Card key={u.id} className="shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold flex items-center justify-between gap-2">
                    <span className="truncate">{u.email ?? u.username ?? u.id}</span>
                    <span
                      className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                      {active ? t('common.active') : t('common.inactive')}
                    </span>
                  </CardTitle>
                  <p className="text-xs">
                    {u.username && u.username !== u.email ? u.username : roleLabel || t('common.emDash')}
                  </p>
                </CardHeader>
                <CardFooter className="flex flex-col items-center gap-3 px-4 pb-4 pt-0 sm:flex-row sm:justify-between sm:items-center">
                  <div className="text-[11px] text-center sm:text-left">
                    {u.createdAt && (
                      <span>{t('usersPage.createdLabel')} {new Date(String(u.createdAt)).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {perm('users', 'update') ? (
                      <Link to={`/users/creation/${encodeURIComponent(String(u.id ?? ''))}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiEdit className="w-4 h-4" />}
                          title={t('usersPage.editTitle')}
                        />
                      </Link>
                    ) : null}
                    {perm('users', 'update') && !isCurrent ? (
                      active ? (
                        <Button
                          variant="danger"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiUserMinus className="w-4 h-4" />}
                          onClick={() => askDeactivate(u)}
                          type="button"
                          title={t('usersPage.deactivateUserTitle')}
                        />
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiUserPlus className="w-4 h-4" />}
                          onClick={() => handleActivate(u)}
                          type="button"
                          disabled={activatingId === u.id}
                          title={t('usersPage.activateUserTitle')}
                        />
                      )
                    ) : null}
                    {perm('users', 'delete') && !isCurrent ? (
                      <Button
                        variant="danger"
                        size="sm"
                        className="p-2 text-xs"
                        icon={<FiTrash2 className="w-4 h-4" />}
                        onClick={() => askDelete(u)}
                        type="button"
                        title={t('usersPage.deleteUserTitle')}
                      />
                    ) : null}
                  </div>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{t('usersPage.email')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.username')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.role')}</TableHeadCell>
              <TableHeadCell>{t('common.status')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.created')}</TableHeadCell>
              <TableHeadCell className="text-center">{t('common.actions')}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>{t('usersPage.noUsers')}</TableCell>
              </TableRow>
            )}
            {paginatedUsers.map((u) => {
              const active = isUserActive(u)
              return (
                <TableRow key={u.id}>
                  <TableCell>{String(u.email ?? '')}</TableCell>
                  <TableCell>{String(u.username ?? '')}</TableCell>
                  <TableCell>{(() => {
                    const rec = u as unknown as Record<string, unknown>
                    if (Array.isArray(rec.roles) && rec.roles.length > 0) {
                      return rec.roles
                        .map((role: any) => role?.name || rolesMap[String(role?.id)] || String(role?.id || ''))
                        .filter(Boolean)
                        .join(', ')
                    }
                    const roleObj = rec.role
                    if (roleObj && typeof roleObj === 'object' && (roleObj as Record<string, unknown>).name) return String((roleObj as Record<string, unknown>).name)
                    const rId = rec.roleId ?? rec.role_id ?? rec.roleId
                    if (rId !== undefined && rId !== null && String(rId) !== '') return rolesMap[String(rId)] ?? String(rId)
                    return ''
                  })()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                      {active ? t('common.active') : t('common.inactive')}
                    </span>
                  </TableCell>
                  <TableCell>{u.createdAt ? new Date(String(u.createdAt)).toLocaleString() : ''}</TableCell>
                  <TableCell className="flex items-center justify-center gap-1">
                    {perm('users', 'update') ? (
                      <Link to={`/users/creation/${encodeURIComponent(String(u.id ?? ''))}`}>
                        <Button variant="ghost" className="p-2" size="sm" icon={<FiEdit className="w-4 h-4" />} title={t('usersPage.editTitle')} />
                      </Link>
                    ) : null}
                    {perm('users', 'update') && !(currentUserId != null && String(u.id) === String(currentUserId)) ? (
                      active ? (
                        <Button variant="danger" size="sm" className="p-2" icon={<FiUserMinus className="w-4 h-4" />} onClick={() => askDeactivate(u)} type="button" title={t('usersPage.deactivateUserTitle')} />
                      ) : (
                        <Button variant="primary" size="sm" className="p-2" icon={<FiUserPlus className="w-4 h-4" />} onClick={() => handleActivate(u)} type="button" disabled={activatingId === u.id} title={t('usersPage.activateUserTitle')} />
                      )
                    ) : null}
                    {perm('users', 'delete') && !(currentUserId != null && String(u.id) === String(currentUserId)) ? (
                      <Button variant="danger" size="sm" className="p-2" icon={<FiTrash2 className="w-4 h-4" />} onClick={() => askDelete(u)} type="button" title={t('usersPage.deleteUserTitle')} />
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {users.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-gray-600 dark:text-slate-400 text-sm">
              {t('common.paginationSummary', { page, totalPages, total: users.length })}
            </div>
            <TableItemsPerPageSelect
              id="users-page-size"
              value={pageSize}
              onChange={setPageSize}
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label={t('common.firstPage')}
            >
              «
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label={t('common.prevPage')}
            >
              ‹
            </Button>
            {pageNumbers.map((pn, idx) =>
              pn === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-slate-500">
                  …
                </span>
              ) : (
                <Button
                  key={pn}
                  variant={pn === page ? 'primary' : 'default'}
                  size="sm"
                  onClick={() => setPage(pn as number)}
                  disabled={pn === page}
                  aria-current={pn === page ? 'page' : undefined}
                >
                  {pn}
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label={t('common.nextPage')}
            >
              ›
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              aria-label={t('common.lastPage')}
            >
              »
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
