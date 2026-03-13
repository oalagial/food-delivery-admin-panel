import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'
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

import { API_BASE } from '../config'

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editing handled by dedicated create/edit page

  async function fetchRoles() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/roles`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = Array.isArray(json) ? json : json?.data ?? Object.values(json ?? {})
      setRoles(data)
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

  // async function handleDelete(id: number | string) {
  //   if (!confirm('Delete this role?')) return
  //   setError(null)
  //   try {
  //     const res = await fetch(`${API_BASE}/roles/delete/${id}`, { method: 'DELETE' })
  //     if (!res.ok) throw new Error(`Delete failed ${res.status}`)
  //     await fetchRoles()
  //   } catch (err: unknown) {
  //     const msg = err instanceof Error ? err.message : String(err)
  //     setError(msg)
  //   }
  // }

  // Editing handled by `/roles/creation/:id`



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Roles</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">Manage user roles and permissions</p>
        </div>
        <Link to="/roles/creation" className="w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:inline">Create Role</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      <div>
        {loading && (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
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
                <p className="text-sm">No roles found.</p>
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
                        {r.description || 'No description'}
                      </p>
                      {r.createdAt && (
                        <p className="text-[11px]">
                          Created: {new Date(String(r.createdAt)).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                      <Link to={`/roles/creation/${encodeURIComponent(String(r.id ?? ''))}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiEdit className="w-4 h-4" />}
                        />
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        className="p-2 text-xs"
                        icon={<FiTrash className="w-4 h-4" />}
                      />
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
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell>Created</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>No roles found.</TableCell>
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
                        <Link to={`/roles/creation/${encodeURIComponent(String(r.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                        <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />}></Button>
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
