import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle } from 'react-icons/fi'
import { getSectionsList, deleteSection } from '../utils/api'
import type { SectionItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
            <p className="text-gray-600 mt-1">Organize products into sections</p>
          </div>
          <Link to="/sections/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Section</Button></Link>
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
      )}
      </div>
    </>
  )
}
