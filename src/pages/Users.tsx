import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { Skeleton } from '../components/ui/skeleton'
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

type User = {
  id: number | string
  email?: string
  username?: string
  createdAt?: string
  [key: string]: unknown
}

import { API_BASE } from '../config'
import { getRolesList } from '../utils/api'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  

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

    if (loading && users.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Users</h1>
          <Link to="/users/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>Create</Button></Link>
        </div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Username</TableHeadCell>
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
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

  

  // async function handleDelete(id: number | string) {
  //   if (!confirm('Delete this user?')) return
  //   setError(null)
  //   try {
  //     const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' })
  //     if (!res.ok) throw new Error(`Delete failed ${res.status}`)
  //     await fetchUsers()
  //   } catch (err: unknown) {
  //     const msg = err instanceof Error ? err.message : String(err)
  //     setError(msg)
  //   }
  // }

  // Editing now handled by `/users/creation/:id` page

  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users and accounts</p>
        </div>
        <Link to="/users/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create User</Button></Link>
      </div>

      {error && <div style={{ color: 'crimson' }}><strong>Error:</strong> {error}</div>}

      <div>
          <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Username</TableHeadCell>
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No users found.</TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{String(u.email ?? '')}</TableCell>
                <TableCell>{String(u.username ?? '')}</TableCell>
                  <TableCell>{(() => {
                    const rec = u as unknown as Record<string, unknown>
                    // Handle array of roles
                    if (Array.isArray(rec.roles) && rec.roles.length > 0) {
                      return rec.roles
                        .map((role: any) => role?.name || rolesMap[String(role?.id)] || String(role?.id || ''))
                        .filter(Boolean)
                        .join(', ')
                    }
                    // Fallback to single role object
                    const roleObj = rec.role
                    if (roleObj && typeof roleObj === 'object' && (roleObj as Record<string, unknown>).name) return String((roleObj as Record<string, unknown>).name)
                    const rId = rec.roleId ?? rec.role_id ?? rec.roleId
                    if (rId !== undefined && rId !== null && String(rId) !== '') return rolesMap[String(rId)] ?? String(rId)
                    return ''
                  })()}</TableCell>
                <TableCell>{u.createdAt ? new Date(String(u.createdAt)).toLocaleString() : ''}</TableCell>
                <TableCell>
                  <Link to={`/users/creation/${encodeURIComponent(String(u.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                  <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />}></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
