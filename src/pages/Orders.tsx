import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import {
  getDeliveryLocationsList,
  getOrderStatuses,
  getOrdersList,
  getPaymentStatuses,
  printFiscalOrder,
  printOrder,
  updateOrder,
} from '../utils/api'
import type { OrderItem } from '../utils/api'
import {
  ORDER_STATUS_FILTER_FALLBACK,
  orderStatusFilterOptionLabel,
} from '../utils/orderStatusFilter'
import { PAYMENT_STATUS_FILTER_FALLBACK, paymentStatusFilterOptionLabel } from '../utils/paymentStatusFilter'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { OrderTableSortHeadCell } from '../components/OrderTableSortHeadCell'
import { OrderDetailsPanel } from '../components/OrderDetailsPanel'
import { OrderRowPaymentStatusSelect } from '../components/OrderRowPaymentStatusSelect'
import { OrderRowStatusSelect } from '../components/OrderRowStatusSelect'
import {
  toggleOrderTableSort,
  type OrderTableSortDir,
  type OrderTableSortKey,
} from '../utils/orderTableSort'
import {
  hasOrdersPaymentMutationUiAccess,
  hasOrdersStatusMutationUiAccess,
} from '../utils/permissions'
import i18n from '../i18n'
import { TableItemsPerPageSelect, DEFAULT_TABLE_PAGE_SIZE } from '../components/TableItemsPerPageSelect'
import { PageHeader, PageToolbarCard } from '../components/page-layout'
import { SearchFilterField, SEARCH_FILTER_DEBOUNCE_MS } from '../components/SearchFilterField'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'

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
  paymentOptions: string[]
  canEditOrderStatus: boolean
  canEditPaymentStatus: boolean
  orderStatusPatchingId: string | null
  paymentStatusPatchingId: string | null
  onStatusCommit: (id: string, status: string) => Promise<void>
  onPaymentCommit: (id: string, paymentStatus: string) => Promise<void>
}

type OrderCardProps = OrderRowProps

function OrderPrintButton({ orderId }: { orderId: string | number | undefined }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [fiscalLoading, setFiscalLoading] = useState(false)
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

  const onFiscalPrint = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (orderId === undefined || orderId === null || String(orderId) === '') return
    setErr(null)
    setFiscalLoading(true)
    try {
      await printFiscalOrder(orderId)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setFiscalLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[4.5rem]">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={loading || fiscalLoading || orderId == null || String(orderId) === ''}
          aria-label={t('ordersPage.printAria')}
          onClick={onPrint}
        >
          {loading ? t('ordersPage.printing') : t('ordersPage.print')}
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={loading || fiscalLoading || orderId == null || String(orderId) === ''}
          aria-label="Fiscal Print"
          onClick={onFiscalPrint}
        >
          {fiscalLoading ? 'Printing...' : 'Fiscal Print'}
        </Button>
      </div>
      {err ? <p className="text-[10px] text-red-600 text-center leading-tight max-w-[9rem]">{err}</p> : null}
    </div>
  )
}

function OrderRow({
  order,
  isOpen,
  onToggle,
  statusOptions,
  paymentOptions,
  canEditOrderStatus,
  canEditPaymentStatus,
  orderStatusPatchingId,
  paymentStatusPatchingId,
  onStatusCommit,
  onPaymentCommit,
}: OrderRowProps) {
  const { t } = useTranslation()
  const dash = t('common.emDash')
  const rowId = String(order.id ?? '')
  const lockedOther =
    (orderStatusPatchingId !== null && orderStatusPatchingId !== rowId) ||
    (paymentStatusPatchingId !== null && paymentStatusPatchingId !== rowId)
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
          <OrderRowPaymentStatusSelect
            orderId={order.id}
            value={order.paymentStatus}
            options={paymentOptions}
            getOptionLabel={(s) => paymentStatusFilterOptionLabel(s, t)}
            canEdit={canEditPaymentStatus}
            locked={lockedOther}
            saving={paymentStatusPatchingId === rowId}
            onCommit={onPaymentCommit}
          />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <OrderRowStatusSelect
            orderId={order.id}
            value={order.status}
            options={statusOptions}
            getOptionLabel={(s) => orderStatusFilterOptionLabel(s, t)}
            canEdit={canEditOrderStatus}
            locked={lockedOther}
            saving={orderStatusPatchingId === rowId}
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
          <TableCell colSpan={10} className="text-left align-top">
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
  paymentOptions,
  canEditOrderStatus,
  canEditPaymentStatus,
  orderStatusPatchingId,
  paymentStatusPatchingId,
  onStatusCommit,
  onPaymentCommit,
}: OrderCardProps) {
  const { t } = useTranslation()
  const dash = t('common.emDash')
  const rowId = String(order.id ?? '')
  const lockedOther =
    (orderStatusPatchingId !== null && orderStatusPatchingId !== rowId) ||
    (paymentStatusPatchingId !== null && paymentStatusPatchingId !== rowId)
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
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row" onClick={(e) => e.stopPropagation()}>
          <OrderRowPaymentStatusSelect
            orderId={order.id}
            value={order.paymentStatus}
            options={paymentOptions}
            getOptionLabel={(s) => paymentStatusFilterOptionLabel(s, t)}
            canEdit={canEditPaymentStatus}
            locked={lockedOther}
            saving={paymentStatusPatchingId === rowId}
            onCommit={onPaymentCommit}
            triggerClassName="max-w-[10rem]"
          />
          <OrderRowStatusSelect
            orderId={order.id}
            value={order.status}
            options={statusOptions}
            getOptionLabel={(s) => orderStatusFilterOptionLabel(s, t)}
            canEdit={canEditOrderStatus}
            locked={lockedOther}
            saving={orderStatusPatchingId === rowId}
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
  const [limit, setLimit] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortKey, setSortKey] = useState<OrderTableSortKey>('createdAt')
  const [sortDir, setSortDir] = useState<OrderTableSortDir>('desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [statusFilterOptions, setStatusFilterOptions] = useState<string[]>(() => [
    ...ORDER_STATUS_FILTER_FALLBACK,
  ])
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [debouncedName, setDebouncedName] = useState('')
  const [debouncedEmail, setDebouncedEmail] = useState('')
  const [deliveryLocations, setDeliveryLocations] = useState<Array<{ id?: string | number; name?: string }>>([])
  const [locationFilter, setLocationFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [paymentStatusFilterOptions, setPaymentStatusFilterOptions] = useState<string[]>(() => [
    ...PAYMENT_STATUS_FILTER_FALLBACK,
  ])
  const [orderStatusPatchingId, setOrderStatusPatchingId] = useState<string | null>(null)
  const [paymentStatusPatchingId, setPaymentStatusPatchingId] = useState<string | null>(null)
  const [orderStatusError, setOrderStatusError] = useState<string | null>(null)

  const canEditOrderStatus = hasOrdersStatusMutationUiAccess()
  const canEditPaymentStatus = hasOrdersPaymentMutationUiAccess()

  const commitOrderListStatus = async (id: string, status: string) => {
    setOrderStatusPatchingId(id)
    setOrderStatusError(null)
    try {
      await updateOrder(id, { status })
      setItems((prev) =>
        prev.map((o) => (String(o.id) === id ? { ...o, status: status as OrderItem['status'] } : o)),
      )
    } catch (e) {
      setOrderStatusError(e instanceof Error ? e.message : String(e))
    } finally {
      setOrderStatusPatchingId(null)
    }
  }

  const commitOrderListPaymentStatus = async (id: string, paymentStatus: string) => {
    setPaymentStatusPatchingId(id)
    setOrderStatusError(null)
    try {
      await updateOrder(id, { paymentStatus })
      setItems((prev) =>
        prev.map((o) =>
          String(o.id) === id ? { ...o, paymentStatus: paymentStatus as OrderItem['paymentStatus'] } : o,
        ),
      )
    } catch (e) {
      setOrderStatusError(e instanceof Error ? e.message : String(e))
    } finally {
      setPaymentStatusPatchingId(null)
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
    let mounted = true
    void getDeliveryLocationsList()
      .then((list) => {
        if (!mounted) return
        const sorted = [...list].sort((a, b) =>
          String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' }),
        )
        setDeliveryLocations(sorted)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    void getPaymentStatuses()
      .then((list) => {
        if (!mounted || !list.length) return
        setPaymentStatusFilterOptions(list)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedName(nameInput.trim()), SEARCH_FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [nameInput])

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedEmail(emailInput.trim()), SEARCH_FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [emailInput])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, debouncedName, debouncedEmail, locationFilter, paymentStatusFilter])

  useEffect(() => {
    setPage(1)
  }, [limit])

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
        customerName: debouncedName || undefined,
        customerEmail: debouncedEmail || undefined,
        deliveryLocationId: locationFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
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
  }, [page, limit, sortKey, sortDir, statusFilter, debouncedName, debouncedEmail, locationFilter, paymentStatusFilter])

  const hasActiveFilters = Boolean(
    statusFilter || debouncedName || debouncedEmail || locationFilter || paymentStatusFilter,
  )

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <PageHeader
          title={t('ordersPage.title')}
          subtitle={t('ordersPage.subtitle')}
          helpTooltip={t('common.toolbarHintOrdersSearch')}
          helpAriaLabel={t('common.moreInfo')}
        />
        <PageToolbarCard>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end lg:gap-3 xl:gap-4">
            <div className="min-w-0">
              <SearchFilterField
                id="orders-search-customer-name"
                label={t('common.name')}
                value={nameInput}
                onChange={setNameInput}
                placeholder={t('common.customerSearchNamePh')}
              />
            </div>
            <div className="min-w-0">
              <SearchFilterField
                id="orders-search-customer-email"
                label={t('common.email')}
                value={emailInput}
                onChange={setEmailInput}
                placeholder={t('common.customerSearchEmailPh')}
                inputMode="email"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="orders-status-filter" className="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                {t('dashboardPage.filterByStatus')}
              </Label>
              <Select
                id="orders-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1.5 h-9 w-full"
              >
                <option value="">{t('dashboardPage.statusAll')}</option>
                {statusFilterOptions.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusFilterOptionLabel(s, t)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="orders-location-filter" className="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                {t('common.filterByLocation')}
              </Label>
              <Select
                id="orders-location-filter"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="mt-1.5 h-9 w-full"
              >
                <option value="">{t('common.allLocations')}</option>
                {deliveryLocations
                  .filter((loc) => loc.id != null && String(loc.id) !== '')
                  .map((loc) => {
                    const id = String(loc.id)
                    return (
                      <option key={id} value={id}>
                        {loc.name ?? id}
                      </option>
                    )
                  })}
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="orders-payment-status-filter" className="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                {t('common.paymentStatus')}
              </Label>
              <Select
                id="orders-payment-status-filter"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="mt-1.5 h-9 w-full"
              >
                <option value="">{t('dashboardPage.statusAll')}</option>
                {paymentStatusFilterOptions.map((ps) => (
                  <option key={ps} value={ps}>
                    {paymentStatusFilterOptionLabel(ps, t)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </PageToolbarCard>
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
              <TableHeadCell>{t('common.paymentStatus')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.status')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.print')}</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 4 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 10 }).map((__, c) => (
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
                paymentOptions={paymentStatusFilterOptions}
                canEditOrderStatus={canEditOrderStatus}
                canEditPaymentStatus={canEditPaymentStatus}
                orderStatusPatchingId={orderStatusPatchingId}
                paymentStatusPatchingId={paymentStatusPatchingId}
                onStatusCommit={commitOrderListStatus}
                onPaymentCommit={commitOrderListPaymentStatus}
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
                    label={t('common.paymentStatus')}
                    colKey="paymentStatus"
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
                    paymentOptions={paymentStatusFilterOptions}
                    canEditOrderStatus={canEditOrderStatus}
                    canEditPaymentStatus={canEditPaymentStatus}
                    orderStatusPatchingId={orderStatusPatchingId}
                    paymentStatusPatchingId={paymentStatusPatchingId}
                    onStatusCommit={commitOrderListStatus}
                    onPaymentCommit={commitOrderListPaymentStatus}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="text-gray-600 dark:text-slate-400 text-sm">
                {t('ordersPage.pagination', { page, totalPages, total })}
              </div>
              <TableItemsPerPageSelect
                id="orders-page-size"
                value={limit}
                onChange={setLimit}
              />
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
