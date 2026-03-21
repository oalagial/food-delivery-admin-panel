import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle } from 'react-icons/fi'
import { getTypesList, deleteType } from '../utils/api'
import type { TypeItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'

export default function Types() {
  const { t: tr } = useTranslation()
  const [types, setTypes] = useState<TypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    id: string | number | null
    name: string | null
  }>({
    show: false,
    id: null,
    name: null,
  })

  useEffect(() => {
    let mounted = true
    getTypesList()
      .then((data) => {
        if (!mounted) return
        setTypes(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || tr('common.failedToLoad'))
        setTypes([])
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  const handleDelete = async (id?: string | number, name?: string) => {
    if (!id && id !== 0) return
    setConfirmDialog({
      show: true,
      id,
      name: name ?? null,
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
      setDeletingId(confirmDialog.id)
      await deleteType(confirmDialog.id)
      setTypes((prev) => prev.filter((ty) => ty.id !== confirmDialog.id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('common.failedSave'))
    } finally {
      setDeletingId(null)
      closeConfirmDialog()
    }
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeConfirmDialog}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <Alert variant="default">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>{tr('typesPage.deleteTitle')}</AlertTitle>
                <AlertDescription>
                  {tr('typesPage.deleteConfirm', { name: String(confirmDialog.name ?? confirmDialog.id ?? '') })}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog}>
                  {tr('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirm}
                  disabled={deletingId === confirmDialog.id}
                >
                  {tr('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{tr('typesPage.title')}</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">{tr('typesPage.subtitle')}</p>
        </div>
        <Link to="/types/creation" className="w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:inline">{tr('typesPage.create')}</span>
          </Button>
        </Link>
      </div>

      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{tr('typesPage.name')}</TableHeadCell>
              <TableHeadCell>{tr('typesPage.tag')}</TableHeadCell>
              <TableHeadCell>{tr('typesPage.description')}</TableHeadCell>
              <TableHeadCell>{tr('common.created')}</TableHeadCell>
              <TableHeadCell>{tr('typesPage.actions')}</TableHeadCell>
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
      )}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {types.length === 0 ? (
              <p className="text-sm text-gray-500">{tr('typesPage.noTypes')}</p>
            ) : (
              types.map((t) => (
                <Card key={t.id ?? t.name} className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold">
                      {t.name ?? ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-2 pt-0 space-y-1">

                    <p className="text-xs">
                      {t.description || tr('common.noDescription')}
                    </p>
                    {t.createdAt && (
                      <p className="text-[11px]">
                        {tr('common.created')}: {new Date(String(t.createdAt)).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                    <Link to={`/types/creation/${encodeURIComponent(String(t.id ?? ''))}`}>
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
                      onClick={() => handleDelete(t.id, t.name)}
                      disabled={deletingId === t.id}
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
                  <TableHeadCell>{tr('typesPage.name')}</TableHeadCell>
                  <TableHeadCell>{tr('typesPage.tag')}</TableHeadCell>
                  <TableHeadCell>{tr('typesPage.description')}</TableHeadCell>
                  <TableHeadCell>{tr('common.created')}</TableHeadCell>
                  <TableHeadCell>{tr('typesPage.actions')}</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {types.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>{tr('typesPage.noTypes')}</TableCell>
                  </TableRow>
                )}

                {types.map((t) => (
                  <TableRow key={t.id ?? t.name}>
                    <TableCell>{t.name ?? ''}</TableCell>
                    <TableCell>{t.tag ?? ''}</TableCell>
                    <TableCell>{t.description ?? ''}</TableCell>
                    <TableCell>{t.createdAt ? new Date(String(t.createdAt)).toLocaleString() : ''}</TableCell>
                    <TableCell>
                      <Link
                        to={`/types/creation/${encodeURIComponent(String(t.id ?? ''))}`}
                        className='mr-2'
                      >
                        <Button
                          variant="ghost"
                          className='p-2'
                          size="sm"
                          icon={<FiEdit className="w-4 h-4" />}
                        />
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        className='p-2'
                        icon={<FiTrash className="w-4 h-4" />}
                        onClick={() => handleDelete(t.id, t.name)}
                        disabled={deletingId === t.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
