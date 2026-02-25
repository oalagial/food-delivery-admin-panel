import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle } from 'react-icons/fi'
import { getSectionsList, deleteSection } from '../utils/api'
import type { SectionItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'

export default function Sections() {
  const [items, setItems] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    id: string | number | null
    name: string | null
  }>({
    show: false,
    id: null,
    name: null,
  })

  const loadSections = () => {
    setLoading(true)
    getSectionsList()
      .then((d) => {
        setItems(d)
        setError(null)
      })
      .catch((e) => {
        setError(String(e))
        setItems([])
      })
      .finally(() => { setLoading(false) })
  }

  useEffect(() => {
    loadSections()
  }, [])

  const openConfirmDialog = (id: string | number, name: string) => {
    setConfirmDialog({
      show: true,
      id,
      name,
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({
      show: false,
      id: null,
      name: null,
    })
  }

  const handleConfirm = async () => {
    if (!confirmDialog.id) return

    try {
      await deleteSection(confirmDialog.id)
      // Reload the sections list after successful deletion
      loadSections()
      closeConfirmDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section')
      closeConfirmDialog()
    }
  }

  const handleDelete = (id: string | number, name: string) => {
    openConfirmDialog(id, name)
  }

  return (
    <>
      {/* Confirmation Dialog Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeConfirmDialog}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <Alert variant="default">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>Delete Section</AlertTitle>
                <AlertDescription>
                  Are you sure you want to delete "{confirmDialog.name}"? This action cannot be undone.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleConfirm}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
            <p className="text-gray-600 mt-1">Organize products into sections</p>
          </div>
          <Link to="/sections/creation" className="w-full sm:w-auto">
            <Button
              variant="primary"
              icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              <span className="sm:inline">Create Section</span>
            </Button>
          </Link>
        </div>

      {loading ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Products</TableHeadCell>
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
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No sections found.</p>
            ) : (
              items.map(it => {
                const rec = it as unknown as Record<string, unknown>
                const prods = rec.products
                const productsLabel = Array.isArray(prods)
                  ? (prods as Array<Record<string, unknown>>)
                      .map(p => String(p.name ?? p.id ?? ''))
                      .join(', ')
                  : (it.productsIds || []).length

                return (
                  <Card key={String(it.id)} className="shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-semibold">
                        {it.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 pt-0 space-y-1 text-xs text-gray-700">
                      <p>
                        Type:{' '}
                        <span className="font-medium">{String(it.typeId ?? '—')}</span>
                      </p>
                      <p>
                        Products:{' '}
                        <span className="font-medium">
                          {productsLabel || '—'}
                        </span>
                      </p>
                      <p>{it.description ?? 'No description'}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 px-4 pb-4 pt-0">
                      <Link to={`/sections/creation/${it.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 text-xs"
                          icon={<FiEdit className="w-4 h-4" />}
                        >
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="p-2 text-xs"
                        icon={<FiTrash className="w-4 h-4" />} 
                        onClick={() => handleDelete(it.id ?? '', it.name ?? '')}
                      >
                        Delete
                      </Button>
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
                <TableRow>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                  <TableHeadCell>Products</TableHeadCell>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell>Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>No sections found.</TableCell>
                  </TableRow>
                )}
                {items.map(it => (
                  <TableRow key={String(it.id)}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell>{it.typeId}</TableCell>
                    <TableCell>{(() => {
                      const rec = it as unknown as Record<string, unknown>
                      const prods = rec.products
                      if (Array.isArray(prods)) {
                        return (prods as Array<Record<string, unknown>>).map(p => String(p.name ?? p.id ?? '')).join(', ')
                      }
                      return (it.productsIds || []).length
                    })()}</TableCell>
                    <TableCell>{it.description ?? ''}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Link to={`/sections/creation/${it.id}`}>
                          <Button size="sm" variant="ghost" icon={<FiEdit className="w-4 h-4" />}></Button>
                        </Link>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          icon={<FiTrash className="w-4 h-4" />} 
                          onClick={() => handleDelete(it.id ?? '', it.name ?? '')}
                        ></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      </div>
    </>
  )
}
