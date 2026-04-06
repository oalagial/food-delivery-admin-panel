import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle } from 'react-icons/fi'
import { getTypesList, deleteType } from '../utils/api'
import { perm } from '../utils/permissions'
import type { TypeItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { TableItemsPerPageSelect, DEFAULT_TABLE_PAGE_SIZE } from '../components/TableItemsPerPageSelect'
import { PageHeader, PageToolbarCard } from '../components/page-layout'

export default function Types() {
  const { t: tr } = useTranslation()
  const [types, setTypes] = useState<TypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
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

  const totalPages = Math.max(1, Math.ceil(types.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedTypes = useMemo(() => {
    const start = (page - 1) * pageSize
    return types.slice(start, start + pageSize)
  }, [types, page, pageSize])

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
      <div className="space-y-5">
        <PageHeader
          title={tr('typesPage.title')}
          subtitle={tr('typesPage.subtitle')}
          helpTooltip={tr('common.toolbarHintDefault')}
          helpAriaLabel={tr('common.moreInfo')}
        />
        {perm('types', 'create') ? (
          <PageToolbarCard>
            <div className="flex flex-wrap justify-end gap-3">
              <Link to="/types/creation" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                  className="h-9 w-full justify-center px-4 text-sm sm:w-auto sm:px-6"
                >
                  <span className="sm:inline">{tr('typesPage.create')}</span>
                </Button>
              </Link>
            </div>
          </PageToolbarCard>
        ) : null}
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
              paginatedTypes.map((ty) => (
                <Card key={ty.id ?? ty.name} className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold">
                      {ty.name ?? ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-2 pt-0 space-y-1">

                    <p className="text-xs">
                      {ty.description || tr('common.noDescription')}
                    </p>
                    {ty.createdAt && (
                      <p className="text-[11px]">
                        {tr('common.created')}: {new Date(String(ty.createdAt)).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                    {perm('types', 'update') ? (
                      <Link to={`/types/creation/${encodeURIComponent(String(ty.id ?? ''))}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiEdit className="w-4 h-4" />}
                        />
                      </Link>
                    ) : null}
                    {perm('types', 'delete') ? (
                      <Button
                        variant="danger"
                        size="sm"
                        className="p-2 text-xs"
                        icon={<FiTrash className="w-4 h-4" />}
                        onClick={() => handleDelete(ty.id, ty.name)}
                        disabled={deletingId === ty.id}
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

                {paginatedTypes.map((ty) => (
                  <TableRow key={ty.id ?? ty.name}>
                    <TableCell>{ty.name ?? ''}</TableCell>
                    <TableCell>{ty.tag ?? ''}</TableCell>
                    <TableCell>{ty.description ?? ''}</TableCell>
                    <TableCell>{ty.createdAt ? new Date(String(ty.createdAt)).toLocaleString() : ''}</TableCell>
                    <TableCell>
                      {perm('types', 'update') ? (
                        <Link
                          to={`/types/creation/${encodeURIComponent(String(ty.id ?? ''))}`}
                          className='mr-2'
                        >
                          <Button
                            variant="ghost"
                            className='p-2'
                            size="sm"
                            icon={<FiEdit className="w-4 h-4" />}
                          />
                        </Link>
                      ) : null}
                      {perm('types', 'delete') ? (
                        <Button
                          variant="danger"
                          size="sm"
                          className='p-2'
                          icon={<FiTrash className="w-4 h-4" />}
                          onClick={() => handleDelete(ty.id, ty.name)}
                          disabled={deletingId === ty.id}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {types.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="text-gray-600 dark:text-slate-400 text-sm">
                  {tr('common.paginationSummary', { page, totalPages, total: types.length })}
                </div>
                <TableItemsPerPageSelect
                  id="types-page-size"
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
                  aria-label={tr('common.firstPage')}
                >
                  «
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label={tr('common.prevPage')}
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
                  aria-label={tr('common.nextPage')}
                >
                  ›
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  aria-label={tr('common.lastPage')}
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
