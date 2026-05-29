import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle } from 'react-icons/fi'
import { getNfcTagsListPaginated, deleteNfcTag } from '../utils/api'
import { perm } from '../utils/permissions'
import type { NfcTagItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { TableItemsPerPageSelect, DEFAULT_TABLE_PAGE_SIZE } from '../components/TableItemsPerPageSelect'
import { PageHeader, PageToolbarCard } from '../components/page-layout'

function tagDisplayName(tag: NfcTagItem): string {
  if (tag.label?.trim()) return tag.label.trim()
  return tag.mac ?? String(tag.id ?? '')
}

export default function NfcTags() {
  const { t: tr } = useTranslation()
  const [tags, setTags] = useState<NfcTagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
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
    setLoading(true)
    getNfcTagsListPaginated({ page, limit: pageSize })
      .then((res) => {
        if (!mounted) return
        setTags(res.data)
        setTotalItems(res.total)
        setTotalPages(Math.max(1, res.totalPages))
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || tr('common.failedToLoad'))
        setTags([])
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [page, pageSize, tr])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

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

  const handleDelete = (id?: string | number, name?: string) => {
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
      await deleteNfcTag(confirmDialog.id)
      setTags((prev) => prev.filter((tag) => tag.id !== confirmDialog.id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('common.failedSave'))
    } finally {
      setDeletingId(null)
      closeConfirmDialog()
    }
  }

  const formatOrder = (tag: NfcTagItem) => {
    if (tag.order?.orderNumber != null) {
      return `#${tag.order.orderNumber}`
    }
    if (tag.orderId != null) return String(tag.orderId)
    return '—'
  }

  return (
    <div className="space-y-6">
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeConfirmDialog}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <Alert variant="default">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>{tr('nfcTagsPage.deleteTitle')}</AlertTitle>
                <AlertDescription>
                  {tr('nfcTagsPage.deleteConfirm', { name: String(confirmDialog.name ?? confirmDialog.id ?? '') })}
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
          title={tr('nfcTagsPage.title')}
          subtitle={tr('nfcTagsPage.subtitle')}
          helpTooltip={tr('common.toolbarHintDefault')}
          helpAriaLabel={tr('common.moreInfo')}
        />
        {perm('nfc_tags', 'create') ? (
          <PageToolbarCard>
            <div className="flex flex-wrap justify-end gap-3">
              <Link to="/nfc-tags/creation" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                  className="h-9 w-full justify-center px-4 text-sm sm:w-auto sm:px-6"
                >
                  <span className="sm:inline">{tr('nfcTagsPage.create')}</span>
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
              <TableHeadCell>{tr('nfcTagsPage.mac')}</TableHeadCell>
              <TableHeadCell>{tr('nfcTagsPage.label')}</TableHeadCell>
              <TableHeadCell>{tr('nfcTagsPage.order')}</TableHeadCell>
              <TableHeadCell>{tr('common.created')}</TableHeadCell>
              <TableHeadCell>{tr('nfcTagsPage.actions')}</TableHeadCell>
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
      {error && <p className="text-red-600">{error}</p>}

      {!loading && (
        <>
          <div className="space-y-3 md:hidden">
            {tags.length === 0 ? (
              <p className="text-sm text-gray-500">{tr('nfcTagsPage.noTags')}</p>
            ) : (
              tags.map((tag) => (
                <Card key={tag.id ?? tag.mac} className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold">
                      {tag.mac ?? ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-2 pt-0 space-y-1">
                    <p className="text-xs">
                      {tr('nfcTagsPage.label')}: {tag.label || '—'}
                    </p>
                    <p className="text-xs">
                      {tr('nfcTagsPage.order')}: {formatOrder(tag)}
                    </p>
                    {tag.createdAt && (
                      <p className="text-[11px]">
                        {tr('common.created')}: {new Date(String(tag.createdAt)).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                    {perm('nfc_tags', 'update') ? (
                      <Link to={`/nfc-tags/creation/${encodeURIComponent(String(tag.id ?? ''))}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiEdit className="w-4 h-4" />}
                        />
                      </Link>
                    ) : null}
                    {perm('nfc_tags', 'delete') ? (
                      <Button
                        variant="danger"
                        size="sm"
                        className="p-2 text-xs"
                        icon={<FiTrash className="w-4 h-4" />}
                        onClick={() => handleDelete(tag.id, tagDisplayName(tag))}
                        disabled={deletingId === tag.id}
                      />
                    ) : null}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>{tr('nfcTagsPage.mac')}</TableHeadCell>
                  <TableHeadCell>{tr('nfcTagsPage.label')}</TableHeadCell>
                  <TableHeadCell>{tr('nfcTagsPage.order')}</TableHeadCell>
                  <TableHeadCell>{tr('common.created')}</TableHeadCell>
                  <TableHeadCell>{tr('nfcTagsPage.actions')}</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {tags.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>{tr('nfcTagsPage.noTags')}</TableCell>
                  </TableRow>
                )}

                {tags.map((tag) => (
                  <TableRow key={tag.id ?? tag.mac}>
                    <TableCell>{tag.mac ?? ''}</TableCell>
                    <TableCell>{tag.label ?? '—'}</TableCell>
                    <TableCell>{formatOrder(tag)}</TableCell>
                    <TableCell>{tag.createdAt ? new Date(String(tag.createdAt)).toLocaleString() : ''}</TableCell>
                    <TableCell>
                      {perm('nfc_tags', 'update') ? (
                        <Link
                          to={`/nfc-tags/creation/${encodeURIComponent(String(tag.id ?? ''))}`}
                          className="mr-2"
                        >
                          <Button
                            variant="ghost"
                            className="p-2"
                            size="sm"
                            icon={<FiEdit className="w-4 h-4" />}
                          />
                        </Link>
                      ) : null}
                      {perm('nfc_tags', 'delete') ? (
                        <Button
                          variant="danger"
                          size="sm"
                          className="p-2"
                          icon={<FiTrash className="w-4 h-4" />}
                          onClick={() => handleDelete(tag.id, tagDisplayName(tag))}
                          disabled={deletingId === tag.id}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="text-gray-600 dark:text-slate-400 text-sm">
                  {tr('common.paginationSummary', { page, totalPages, total: totalItems })}
                </div>
                <TableItemsPerPageSelect
                  id="nfc-tags-page-size"
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
