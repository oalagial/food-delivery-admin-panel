import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'
import { authFetch, downloadCustomersCsv } from '../utils/api'
import { perm } from '../utils/permissions'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

type Customer = {
  id?: number | string
  name?: string
  email?: string
  phone?: string
  createdAt?: string
  [key: string]: unknown
}



export default function CustomerCollection() {
  const { t, i18n } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [exportingCsv, setExportingCsv] = useState(false)
  const canExportCsv = perm('customers', 'read')

  async function fetchCustomers(pageNum = 1) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(limit) })
      const res = await authFetch(`/customers?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      // Support both paginated and non-paginated responses
      let data, totalItems, totalPagesVal
      if (json && typeof json === 'object' && 'data' in json && 'totalPages' in json) {
        data = json.data
        totalItems = json.total
        totalPagesVal = json.totalPages
      } else {
        data = Array.isArray(json) ? json : json?.data ?? Object.values(json ?? {})
        totalItems = data.length
        totalPagesVal = 1
      }
      setCustomers(data)
      setTotal(totalItems)
      setTotalPages(totalPagesVal)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleExportCsv() {
    if (!canExportCsv) return
    setExportingCsv(true)
    setError(null)
    try {
      await downloadCustomersCsv(i18n.language)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setExportingCsv(false)
    }
  }

  useEffect(() => {
    void fetchCustomers(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Filter customers based on search query (client-side)
  const filteredCustomers = customers.filter((customer) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (customer.name && String(customer.name).toLowerCase().includes(q)) ||
      (customer.email && String(customer.email).toLowerCase().includes(q)) ||
      (customer.phone && String(customer.phone).toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('common.customersTitle')}</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">{t('common.customersSubtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {canExportCsv && (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={exportingCsv}
              onClick={() => void handleExportCsv()}
              className="whitespace-nowrap"
            >
              {exportingCsv ? '…' : t('common.exportCustomersCsv')}
            </Button>
          )}
          <Input
            type="text"
            placeholder={t('common.searchCustomersPh')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong className="font-semibold">{t('common.error')}:</strong> {error}
        </div>
      )}

      {/* Loading skeleton (shared) */}
      {loading && customers.length === 0 && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{t('common.name')}</TableHeadCell>
              <TableHeadCell>{t('common.email')}</TableHeadCell>
              <TableHeadCell>{t('common.phone')}</TableHeadCell>
              <TableHeadCell>{t('common.created')}</TableHeadCell>
              <TableHeadCell>{t('common.actions')}</TableHeadCell>
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
            {filteredCustomers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-50">{t('common.noCustomers')}</p>
            ) : (
              filteredCustomers.map((customer) => (
                <Card key={customer.id ?? `${customer.name}-${customer.email}`} className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold">
                      {customer.name || t('common.unnamedCustomer')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-1 text-xs">
                    <p>
                      {t('common.email')}:{' '}
                      <span className="font-medium">
                        {customer.email || t('common.emDash')}
                      </span>
                    </p>
                    <p>
                      {t('common.phone')}:{' '}
                      <span className="font-medium">
                        {customer.phone || t('common.emDash')}
                      </span>
                    </p>
                    <p className="text-[11px]">
                      {t('common.created')}:{' '}
                      {customer.createdAt
                        ? new Date(String(customer.createdAt)).toLocaleDateString()
                        : t('common.emDash')}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>{t('common.name')}</TableHeadCell>
                  <TableHeadCell>{t('common.email')}</TableHeadCell>
                  <TableHeadCell>{t('common.phone')}</TableHeadCell>
                  <TableHeadCell>{t('common.created')}</TableHeadCell>
                  <TableHeadCell>{t('common.actions')}</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>{t('common.noCustomers')}</TableCell>
                  </TableRow>
                )}
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{String(customer.name ?? t('common.emDash'))}</TableCell>
                    <TableCell>{String(customer.email ?? t('common.emDash'))}</TableCell>
                    <TableCell>{String(customer.phone ?? t('common.emDash'))}</TableCell>
                    <TableCell>{customer.createdAt ? new Date(String(customer.createdAt)).toLocaleString() : t('common.emDash')}</TableCell>
                    <TableCell>
                      {/* Actions can be added here if needed */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Enhanced Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
        <div className="text-gray-600 text-sm mb-2 sm:mb-0">
          {t('common.paginationSummary', { page, totalPages, total })}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label={t('common.prevPage')}
          >
            ‹
          </Button>
          {/* Numbered page buttons, show up to 5 around current */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(pn =>
              pn === 1 ||
              pn === totalPages ||
              (pn >= page - 2 && pn <= page + 2)
            )
            .reduce((arr, pn, idx, src) => {
              if (idx > 0 && pn - src[idx - 1] > 1) arr.push('ellipsis')
              arr.push(pn)
              return arr
            }, [] as (number | 'ellipsis')[])
            .map((pn, idx) =>
              pn === 'ellipsis' ? (
                <span key={"ellipsis-" + idx} className="px-2 text-gray-400">…</span>
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
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
    </div>
  )
}
