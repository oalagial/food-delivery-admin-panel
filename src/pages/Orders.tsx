import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { getOrderStatuses, getOrdersList, printOrder, updateOrder } from '../utils/api'
import type { OrderItem } from '../utils/api'
import {
  ORDER_STATUS_FILTER_FALLBACK,
  orderStatusFilterOptionLabel,
} from '../utils/orderStatusFilter'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { OrderTableSortHeadCell } from '../components/OrderTableSortHeadCell'
import { OrderDetailsPanel } from '../components/OrderDetailsPanel'
import { OrderRowStatusSelect } from '../components/OrderRowStatusSelect'
import {
  toggleOrderTableSort,
  type OrderTableSortDir,
  type OrderTableSortKey,
} from '../utils/orderTableSort'
import { hasOrdersMutationUiAccess } from '../utils/permissions'
import i18n from '../i18n'

function formatOrderBusinessDate(value: string | number | undefined | null): string {
  const dash = i18n.t('common.emDash')
  if (value == null || value === '') return dash
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? dash : d.toLocaleDateString()
}

type OrderRowProps = {
  order: OrderItem
  isOpen: boolean
  onToggle: () => void
  statusOptions: string[]
  canEditStatus: boolean
  statusPatchingId: string | null
  onStatusCommit: (id: string, status: string) => Promise<void>
}

type OrderCardProps = OrderRowProps

function OrderPrintButton({ orderId }: { orderId: string | number | undefined }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onPrint = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (orderId === undefined || orderId === null || String(orderId) === '') return
    setErr(null)
    setLoading(true)
    try {
      await printOrder(orderId)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[4.5rem]">
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={loading || orderId == null || String(orderId) === ''}
        aria-label={t('ordersPage.printAria')}
        onClick={onPrint}
      >
        {loading ? t('ordersPage.printing') : t('ordersPage.print')}
      </Button>
      {err ? <p className="text-[10px] text-red-600 text-center leading-tight max-w-[9rem]">{err}</p> : null}
    </div>
  )
}

function OrderRow({
  order,
  isOpen,
  onToggle,
  statusOptions,
  canEditStatus,
  statusPatchingId,
  onStatusCommit,
}: OrderRowProps) {
  const { t } = useTranslation()
  const dash = t('common.emDash')
  return (
    <>
      <TableRow onClick={onToggle} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
        <TableCell>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold">{order.id}</p>
              <p className="text-xs">{new Date(order.createdAt || '').toLocaleDateString()}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm font-semibold tabular-nums">
            {order.orderNumber != null ? order.orderNumber : dash}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm">{formatOrderBusinessDate(order.orderDate)}</span>
        </TableCell>
        <TableCell>{order.restaurant?.name ?? ''}</TableCell>
        <TableCell>{order.deliveryLocation?.name ?? ''}</TableCell>
        <TableCell>{order.customer?.name}</TableCell>
        <TableCell>
          <p className="font-semibold">€{order.total}</p>
          <p className="text-xs">{t('ordersPage.subtotalLine', { amount: order.subtotal })}</p>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <OrderRowStatusSelect
            orderId={order.id}
            value={order.status}
            options={statusOptions}
            getOptionLabel={(s) => orderStatusFilterOptionLabel(s, t)}
            canEdit={canEditStatus}
            locked={!!statusPatchingId && statusPatchingId !== String(order.id ?? '')}
            saving={statusPatchingId === String(order.id ?? '')}
            onCommit={onStatusCommit}
          />
        </TableCell>
        <TableCell>
          <div className="flex justify-center items-start" onClick={(e) => e.stopPropagation()}>
            <OrderPrintButton orderId={order.id} />
          </div>
        </TableCell>
      </TableRow>

      {isOpen && (
        <TableRow className="bg-gray-50 dark:bg-slate-900">
          <TableCell colSpan={9} className="text-left align-top">
            <OrderDetailsPanel order={order} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function OrderCard({
  order,
  isOpen,
  onToggle,
  statusOptions,
  canEditStatus,
  statusPatchingId,
  onStatusCommit,
}: OrderCardProps) {
  const { t } = useTranslation()
  const dash = t('common.emDash')
  return (
    <Card className="shadow-sm">
      <CardHeader
        className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
        onClick={onToggle}
      >
        <div>
          <CardTitle className="text-base font-semibold">
            {t('ordersPage.orderIdCard', { id: String(order.id ?? '') })}{' '}
            <span className="text-xs font-normal">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
            </span>
          </CardTitle>
          <p className="text-xs">
            {order.restaurant?.name ?? ''} • {order.deliveryLocation?.name ?? ''}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('ordersPage.orderNumberLine', {
              num: order.orderNumber != null ? String(order.orderNumber) : dash,
              date: formatOrderBusinessDate(order.orderDate),
            })}
          </p>
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <OrderRowStatusSelect
            orderId={order.id}
            value={order.status}
            options={statusOptions}
            getOptionLabel={(s) => orderStatusFilterOptionLabel(s, t)}
            canEdit={canEditStatus}
            locked={!!statusPatchingId && statusPatchingId !== String(order.id ?? '')}
            saving={statusPatchingId === String(order.id ?? '')}
            onCommit={onStatusCommit}
            triggerClassName="max-w-[11rem]"
          />
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-2 pt-0 space-y-1" onClick={onToggle}>
        <p className="text-sm">
          <span className="font-semibold">{order.customer?.name}</span>
        </p>
        <p className="text-xs">
          {t('ordersPage.totalLine')}{' '}
          <span className="font-semibold text-green-600">€{order.total}</span>{' '}
          <span>{t('ordersPage.subtotalParen', { amount: order.subtotal })}</span>
        </p>
      </CardContent>

      <CardFooter className="flex justify-start items-center px-4 pb-4 pt-0" onClick={(e) => e.stopPropagation()}>
        <OrderPrintButton orderId={order.id} />
      </CardFooter>

      {isOpen && (
        <div className="border-t border-gray-100">
          <OrderDetailsPanel order={order} />
        </div>
      )}
    </Card>
  )
}

export default function Orders() {
  const { t } = useTranslation()
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortKey, setSortKey] = useState<OrderTableSortKey>('createdAt')
  const [sortDir, setSortDir] = useState<OrderTableSortDir>('desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [statusFilterOptions, setStatusFilterOptions] = useState<string[]>(() => [
    ...ORDER_STATUS_FILTER_FALLBACK,
  ])
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [orderStatusPatchId, setOrderStatusPatchId] = useState<string | null>(null)
  const [orderStatusError, setOrderStatusError] = useState<string | null>(null)

  const canEditOrderStatus = hasOrdersMutationUiAccess()

  const commitOrderListStatus = async (id: string, status: string) => {
    setOrderStatusPatchId(id)
    setOrderStatusError(null)
    try {
      await updateOrder(id, { status })
      setItems((prev) =>
        prev.map((o) => (String(o.id) === id ? { ...o, status: status as OrderItem['status'] } : o)),
      )
    } catch (e) {
      setOrderStatusError(e instanceof Error ? e.message : String(e))
    } finally {
      setOrderStatusPatchId(null)
    }
  }

  useEffect(() => {
    let mounted = true
    void getOrderStatuses()
      .then((list) => {
        if (!mounted || !list.length) return
        setStatusFilterOptions(list)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, debouncedSearch])

  const onSortColumn = (k: OrderTableSortKey) => {
    const next = toggleOrderTableSort(sortKey, sortDir, k)
    setSortKey(next.key)
    setSortDir(next.dir)
    setPage(1)
  }

  const toggleRow = (id: string | number) => {
    setOpenRowId((prev) => (prev === String(id) ? null : String(id)))
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    getOrdersList(
      page,
      limit,
      { sortField: sortKey, sortDir },
      {
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      },
    )
      .then((res: unknown) => {
        if (!mounted) return
        let data: OrderItem[]
        let totalItems: number
        let totalPagesVal: number
        if (res && typeof res === 'object' && 'data' in res && 'totalPages' in res) {
          const r = res as { data: OrderItem[]; total: number; totalPages: number }
          data = r.data
          totalItems = r.total
          totalPagesVal = r.totalPages
        } else {
          data = Array.isArray(res)
            ? (res as OrderItem[])
            : (res as { data?: OrderItem[] })?.data ?? Object.values((res as object) ?? {})
          totalItems = data.length
          totalPagesVal = 1
        }
        setItems(data)
        setTotal(totalItems)
        setTotalPages(totalPagesVal)
      })
      .catch((e) => {
        if (mounted) setError(String(e))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [page, limit, sortKey, sortDir, statusFilter, debouncedSearch])

  const hasActiveFilters = Boolean(statusFilter || debouncedSearch)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('ordersPage.title')}</h1>
        <p className="text-gray-600 mt-1 dark:text-slate-400">{t('ordersPage.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-1 flex-col gap-1 sm:min-w-[12rem] sm:max-w-md">
          <label htmlFor="orders-list-search" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('common.search')}
          </label>
          <input
            id="orders-list-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('common.searchOrdersPh')}
            autoComplete="off"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[11rem]">
          <label htmlFor="orders-status-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('dashboardPage.filterByStatus')}
          </label>
          <select
            id="orders-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('dashboardPage.statusAll')}</option>
            {statusFilterOptions.map((s) => (
              <option key={s} value={s}>
                {orderStatusFilterOptionLabel(s, t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {orderStatusError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          {orderStatusError}
        </div>
      ) : null}

      {loading ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>{t('ordersPage.orderId')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.orderNumber')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.orderDate')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.restaurant')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.deliveryLocation')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.customer')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.price')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.status')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.print')}</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 4 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 9 }).map((__, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-600">{error}</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>{hasActiveFilters ? t('ordersPage.noOrdersMatchFilters') : t('ordersPage.noOrders')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((it) => (
              <OrderCard
                key={String(it.id)}
                order={it}
                isOpen={openRowId === String(it.id)}
                onToggle={() => toggleRow(it.id ?? '')}
                statusOptions={statusFilterOptions}
                canEditStatus={canEditOrderStatus}
                statusPatchingId={orderStatusPatchId}
                onStatusCommit={commitOrderListStatus}
              />
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableRow>
                  <OrderTableSortHeadCell
                    label={t('ordersPage.orderId')}
                    colKey="createdAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.orderNumber')}
                    colKey="orderNumber"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.orderDate')}
                    colKey="orderDate"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.restaurant')}
                    colKey="restaurant"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.deliveryLocation')}
                    colKey="deliveryLocation"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.customer')}
                    colKey="customer"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.price')}
                    colKey="price"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.status')}
                    colKey="status"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <TableHeadCell>{t('ordersPage.print')}</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it) => (
                  <OrderRow
                    key={String(it.id)}
                    order={it}
                    isOpen={openRowId === String(it.id)}
                    onToggle={() => toggleRow(it.id ?? '')}
                    statusOptions={statusFilterOptions}
                    canEditStatus={canEditOrderStatus}
                    statusPatchingId={orderStatusPatchId}
                    onStatusCommit={commitOrderListStatus}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <div className="text-gray-600 text-sm mb-2 sm:mb-0">
              {t('ordersPage.pagination', { page, totalPages, total })}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label={t('common.prevPage')}
              >
                ‹
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((pn) => pn === 1 || pn === totalPages || (pn >= page - 2 && pn <= page + 2))
                .reduce(
                  (arr, pn, idx, src) => {
                    if (idx > 0 && pn - src[idx - 1] > 1) arr.push('ellipsis')
                    arr.push(pn)
                    return arr
                  },
                  [] as (number | 'ellipsis')[]
                )
                .map((pn, idx) =>
                  pn === 'ellipsis' ? (
                    <span key={'ellipsis-' + idx} className="px-2 text-gray-400">
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
        </>
      )}
    </div>
  )
}
