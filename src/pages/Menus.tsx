import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiRotateCw, FiAlertCircle } from 'react-icons/fi'
import { getMenusList, restoreMenu, deleteMenu } from '../utils/api'
import type { MenuItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

export default function Menus() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    type: 'delete' | 'restore' | null
    id: string | number | null
    name: string | null
  }>({
    show: false,
    type: null,
    id: null,
    name: null,
  })

  const loadMenus = () => {
    setLoading(true)
    getMenusList()
      .then((d) => {
        setMenus(d)
        setError(null)
      })
      .catch((e) => {
        setError(String(e))
        setMenus([])
      })
      .finally(() => { setLoading(false) })
  }

  useEffect(() => {
    loadMenus()
  }, [])

  const openConfirmDialog = (type: 'delete' | 'restore', id: string | number, name: string) => {
    setConfirmDialog({
      show: true,
      type,
      id,
      name,
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({
      show: false,
      type: null,
      id: null,
      name: null,
    })
  }

  const handleConfirm = async () => {
    if (!confirmDialog.id || !confirmDialog.type) return

    try {
      if (confirmDialog.type === 'delete') {
        await deleteMenu(confirmDialog.id)
      } else if (confirmDialog.type === 'restore') {
        await restoreMenu(confirmDialog.id)
      }
      // Reload the menus list after successful action
      loadMenus()
      closeConfirmDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${confirmDialog.type} menu`)
      closeConfirmDialog()
    }
  }

  const handleRestore = (id: string | number, name: string) => {
    openConfirmDialog('restore', id, name)
  }

  const handleDelete = (id: string | number, name: string) => {
    openConfirmDialog('delete', id, name)
  }

  // Separate active and deleted menus
  const activeMenus = menus.filter((m) => {
    const anyMenu = m as unknown as Record<string, unknown>
    return !anyMenu.deletedBy
  })
  const deletedMenus = menus.filter((m) => {
    const anyMenu = m as unknown as Record<string, unknown>
    return anyMenu.deletedBy
  })

  return (
    <>
      {/* Confirmation Dialog Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeConfirmDialog}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <Alert variant="default">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {confirmDialog.type === 'delete' ? 'Delete Menu' : 'Restore Menu'}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete' 
                    ? `Are you sure you want to delete "${confirmDialog.name}"?`
                    : `Are you sure you want to restore "${confirmDialog.name}"?`}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog}>
                  Cancel
                </Button>
                <Button 
                  variant={confirmDialog.type === 'delete' ? 'danger' : 'primary'} 
                  onClick={handleConfirm}
                >
                  {confirmDialog.type === 'delete' ? 'Delete' : 'Restore'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menus</h1>
            <p className="text-gray-600 mt-1">Organize products into menus</p>
          </div>
          <Link to="/menus/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Menu</Button></Link>
        </div>

        {loading ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Restaurant</TableHeadCell>
                <TableHeadCell>Sections</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
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
        ) : error ? <div className="text-red-600">{error}</div> : (
          <>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Menus</h2>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell>Restaurant</TableHeadCell>
                    <TableHeadCell>Sections</TableHeadCell>
                    <TableHeadCell>Created</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeMenus.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>No active menus found.</TableCell>
                    </TableRow>
                  )}
                  {activeMenus.map((m) => {
                    const anyMenu = m as unknown as Record<string, unknown>
                    const restaurant = (anyMenu.restaurant as any) || null
                    return (
                      <TableRow key={String(m.id)}>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell>{restaurant?.name || ''}</TableCell>
                        <TableCell>
                          {Array.isArray((m as any).sections) && (m as any).sections.length > 0
                            ? (m as any).sections.map((s: any) => s?.name ?? s?.id).join(', ')
                            : (m.sectionIds || []).length}
                        </TableCell>
                        <TableCell>{m.createdAt ? new Date(String(m.createdAt)).toLocaleString() : ''}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Link to={`/menus/creation/${m.id}`}>
                              <Button size="sm" variant="ghost" icon={<FiEdit className="w-4 h-4" />}></Button>
                            </Link>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              icon={<FiTrash className="w-4 h-4" />} 
                              onClick={() => handleDelete(m.id ?? '', m.name ?? '')}
                            ></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {deletedMenus.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">Deleted Menus</h2>
                <Table>
                  <TableHead>
                    <TableRow className="bg-gray-100">
                      <TableHeadCell className="text-gray-600">Name</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Description</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Restaurant</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Sections</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Created</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Deleted By</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Actions</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deletedMenus.map((m) => {
                      const anyMenu = m as unknown as Record<string, unknown>
                      const restaurant = (anyMenu.restaurant as any) || null
                      return (
                        <TableRow key={String(m.id)} className="bg-gray-50 opacity-75">
                          <TableCell className="text-gray-600">{m.name}</TableCell>
                          <TableCell className="text-gray-600">{m.description}</TableCell>
                          <TableCell className="text-gray-600">{restaurant?.name || ''}</TableCell>
                          <TableCell className="text-gray-600">
                            {Array.isArray((m as any).sections) && (m as any).sections.length > 0
                              ? (m as any).sections.map((s: any) => s?.name ?? s?.id).join(', ')
                              : (m.sectionIds || []).length}
                          </TableCell>
                          <TableCell className="text-gray-600">{m.createdAt ? new Date(String(m.createdAt)).toLocaleString() : ''}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{String(anyMenu.deletedBy ?? '')}</TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className='p-2'
                                onClick={() => handleRestore(m.id ?? '', m.name ?? '')}
                                icon={<FiRotateCw className="w-4 h-4" />}
                              ></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
