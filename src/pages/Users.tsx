import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { Skeleton } from '../components/ui/skeleton'
import { FiPlus, FiEdit, FiUserMinus, FiUserPlus } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

type User = {
  id: number | string
  email?: string
  username?: string
  createdAt?: string
  [key: string]: unknown
}

import { API_BASE } from '../config'
import { getRolesList, setUserActive, getCurrentUserId } from '../utils/api'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

export default function Users() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [activatingId, setActivatingId] = useState<string | number | null>(null)
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

  useEffect(() => {
    if (!userToDeactivate) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDeactivate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userToDeactivate])

  if (loading && users.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('usersPage.title')}</h1>
          <Link to="/users/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>{t('usersPage.create')}</Button></Link>
        </div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{t('usersPage.email')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.username')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.role')}</TableHeadCell>
              <TableHeadCell>{t('usersPage.created')}</TableHeadCell>
              <TableHeadCell>{t('common.actions')}</TableHeadCell>
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



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('usersPage.title')}</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">{t('usersPage.subtitle')}</p>
        </div>
        <Link to="/users/creation" className="w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:inline">{t('usersPage.createUser')}</span>
          </Button>
        </Link>
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

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">{t('usersPage.noUsers')}</p>
        ) : (
          users.map((u) => {
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
                <CardFooter className="flex justify-between items-center px-4 pb-4 pt-0 gap-2">
                  <div className="text-[11px]">
                    {u.createdAt && (
                      <span>{t('usersPage.createdLabel')} {new Date(String(u.createdAt)).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/users/creation/${encodeURIComponent(String(u.id ?? ''))}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-xs"
                        icon={<FiEdit className="w-4 h-4" />}
                        title={t('usersPage.editTitle')}
                      />
                    </Link>
                    {isCurrent ? null : active ? (
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
                    )}
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
              <TableHeadCell>{t('common.actions')}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>{t('usersPage.noUsers')}</TableCell>
              </TableRow>
            )}
            {users.map((u) => {
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
                  <TableCell className="flex items-center gap-1">
                    <Link to={`/users/creation/${encodeURIComponent(String(u.id ?? ''))}`}>
                      <Button variant="ghost" className="p-2" size="sm" icon={<FiEdit className="w-4 h-4" />} title={t('usersPage.editTitle')} />
                    </Link>
                    {currentUserId != null && String(u.id) === String(currentUserId) ? null : active ? (
                      <Button variant="danger" size="sm" className="p-2" icon={<FiUserMinus className="w-4 h-4" />} onClick={() => askDeactivate(u)} type="button" title={t('usersPage.deactivateUserTitle')} />
                    ) : (
                      <Button variant="primary" size="sm" className="p-2" icon={<FiUserPlus className="w-4 h-4" />} onClick={() => handleActivate(u)} type="button" disabled={activatingId === u.id} title={t('usersPage.activateUserTitle')} />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
