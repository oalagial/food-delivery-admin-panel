import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiDownload } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'
import { getCustomersList, downloadCustomersCsv } from '../utils/api'
import { perm } from '../utils/permissions'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { TableItemsPerPageSelect, DEFAULT_TABLE_PAGE_SIZE } from '../components/TableItemsPerPageSelect'
import { PageHeader, PageToolbarCard } from '../components/page-layout'
import { SearchFilterField, SEARCH_FILTER_DEBOUNCE_MS } from '../components/SearchFilterField'

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
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [debouncedName, setDebouncedName] = useState('')
  const [debouncedEmail, setDebouncedEmail] = useState('')
  const filtersRef = useRef({ name: '', email: '' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [exportingCsv, setExportingCsv] = useState(false)
  const canExportCsv = perm('customers', 'read')

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedName(nameInput.trim())
    }, SEARCH_FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [nameInput])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedEmail(emailInput.trim())
    }, SEARCH_FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [emailInput])

  useEffect(() => {
    let cancelled = false

    const filtersChanged =
      filtersRef.current.name !== debouncedName ||
      filtersRef.current.email !== debouncedEmail

    if (filtersChanged) {
      filtersRef.current = { name: debouncedName, email: debouncedEmail }
      if (page !== 1) {
        setPage(1)
        return
      }
    }

    setLoading(true)
    setError(null)
    void getCustomersList({
      page,
      limit,
      name: debouncedName || undefined,
      email: debouncedEmail || undefined,
    })
      .then((res) => {
        if (cancelled) return
        setCustomers(res.data as Customer[])
        setTotal(res.total)
        setTotalPages(res.totalPages)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, limit, debouncedName, debouncedEmail])

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

  const showSkeleton = loading && customers.length === 0

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <PageHeader
          title={t('common.customersTitle')}
          subtitle={t('common.customersSubtitle')}
          helpTooltip={t('common.toolbarHintCustomers')}
          helpAriaLabel={t('common.moreInfo')}
        />

        <PageToolbarCard>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end sm:gap-5">
            {canExportCsv && (
              <div className="flex flex-col gap-1.5 sm:col-span-3">
                <span className="invisible block text-sm font-medium leading-none select-none" aria-hidden>
                  .
                </span>
                <Button
                  type="button"
                  variant="default"
                  disabled={exportingCsv}
                  onClick={() => void handleExportCsv()}
                  className="h-9 w-full shrink-0 justify-center gap-2 px-3 text-sm font-medium"
                  icon={<FiDownload className="h-4 w-4" aria-hidden />}
                >
                  {exportingCsv ? '…' : t('common.exportCustomersCsv')}
                </Button>
              </div>
            )}
            <div className={canExportCsv ? 'sm:col-span-4' : 'sm:col-span-6'}>
              <SearchFilterField
                id="customer-search-name"
                label={t('common.name')}
                value={nameInput}
                onChange={setNameInput}
                placeholder={t('common.customerSearchNamePh')}
              />
            </div>
            <div className={canExportCsv ? 'sm:col-span-5' : 'sm:col-span-6'}>
              <SearchFilterField
                id="customer-search-email"
                label={t('common.email')}
                value={emailInput}
                onChange={setEmailInput}
                placeholder={t('common.customerSearchEmailPh')}
                inputMode="email"
              />
            </div>
          </div>
        </PageToolbarCard>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200">
          <strong className="font-semibold">{t('common.error')}:</strong> {error}
        </div>
      )}

      {showSkeleton && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{t('common.name')}</TableHeadCell>
              <TableHeadCell>{t('common.email')}</TableHeadCell>
              <TableHeadCell>{t('common.phone')}</TableHeadCell>
              <TableHeadCell>{t('common.created')}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 4 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200 dark:bg-slate-700" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!showSkeleton && (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {customers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('common.noCustomers')}</p>
            ) : (
              customers.map((customer) => (
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
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>{t('common.name')}</TableHeadCell>
                  <TableHeadCell>{t('common.email')}</TableHeadCell>
                  <TableHeadCell>{t('common.phone')}</TableHeadCell>
                  <TableHeadCell>{t('common.created')}</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>{t('common.noCustomers')}</TableCell>
                  </TableRow>
                )}
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{String(customer.name ?? t('common.emDash'))}</TableCell>
                    <TableCell>{String(customer.email ?? t('common.emDash'))}</TableCell>
                    <TableCell>{String(customer.phone ?? t('common.emDash'))}</TableCell>
                    <TableCell>{customer.createdAt ? new Date(String(customer.createdAt)).toLocaleString() : t('common.emDash')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Enhanced Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="text-gray-600 dark:text-slate-400 text-sm">
            {t('common.paginationSummary', { page, totalPages, total })}
          </div>
          <TableItemsPerPageSelect
            id="customers-page-size"
            value={limit}
            onChange={(n) => {
              setLimit(n)
              setPage(1)
            }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            aria-label={t('common.firstPage')}
          >
            «
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            aria-label={t('common.prevPage')}
          >
            ‹
          </Button>
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
                <span key={"ellipsis-" + idx} className="px-2 text-gray-400 dark:text-slate-500">…</span>
              ) : (
                <Button
                  key={pn}
                  variant={pn === page ? 'primary' : 'default'}
                  size="sm"
                  onClick={() => setPage(pn as number)}
                  disabled={pn === page || loading}
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
            disabled={page === totalPages || loading}
            aria-label={t('common.nextPage')}
          >
            ›
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || loading}
            aria-label={t('common.lastPage')}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  )
}
