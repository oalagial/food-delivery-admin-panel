import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { FiCheckCircle, FiSlash } from 'react-icons/fi'
import { Card, CardContent } from '../components/ui/card'
import Table, { TableBody, TableHead, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'
import { OrderDetailsPanel } from '../components/OrderDetailsPanel'

import { API_BASE } from '../config'
import { getCurrentUserRole, OrderStatus, updateOrder } from '../utils/api'
import { hasOrdersMutationUiAccess } from '../utils/permissions'
import { UserRole } from '../utils/userRoles'
import { OrderTableSortHeadCell } from '../components/OrderTableSortHeadCell'
import {
  sortOrdersByColumn,
  toggleOrderTableSort,
  type OrderTableSortDir,
  type OrderTableSortKey,
} from '../utils/orderTableSort'
import i18n from '../i18n'

type DashboardOrder = {
  id?: string | number
  restaurant?: { name?: string }
  deliveryLocation?: { name?: string }
  customerName?: string
  customer?: { name?: string; email?: string; phone?: string }
  email?: string
  paymentMethod?: string
  paymentStatus?: string
  deliveryFee?: number | string | null
  discount?: number | string | null
  deliveryTime?: string
  notes?: string
  products?: Array<{
    id?: string | number
    name?: string
    quantity?: number | string
    total?: number | string
    extrasPrice?: number | string | null
    extras?: Array<{
      id?: string | number
      name?: string
      quantity?: number | string
      price?: number | string
    }>
    removedIngredients?: string[]
    removed_ingredients?: string[]
  }>
  offers?: Array<{
    id?: string | number
    name?: string
    quantity?: number | string
    total?: number | string
    groups?: Array<{
      groupId?: string | number
      groupName?: string
      selectedItem?: { name?: string }
    }>
  }>
  subtotal?: number | string | null
  total?: number | string | null
  amount?: number | string | null
  status?: string
  createdAt?: string
  orderNumber?: number
  orderDate?: string
}

function normalizeOrders(payload: unknown): DashboardOrder[] {
  if (Array.isArray(payload)) return payload as DashboardOrder[]
  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: unknown }
    if (Array.isArray(obj.data)) return obj.data as DashboardOrder[]
  }
  return []
}

function isToday(value?: string): boolean {
  if (!value) return false
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function statusClass(status?: string): string {
  if (status === 'DELIVERED') return 'bg-green-100 text-green-800'
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800'
  if (status === 'CANCELLED' || status === 'REJECTED') return 'bg-red-100 text-red-800'
  if (status === 'CONFIRMED') return 'bg-blue-100 text-blue-800'
  return 'bg-blue-100 text-blue-800'
}

const DASHBOARD_STATUS_FILTER_ORDER = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
] as const

const DASHBOARD_PAGE_SIZE = 10

const DASHBOARD_STATUS_LABEL_KEY: Record<(typeof DASHBOARD_STATUS_FILTER_ORDER)[number], string> = {
  [OrderStatus.PENDING]: 'dashboardPage.statusPending',
  [OrderStatus.CONFIRMED]: 'dashboardPage.statusConfirmed',
  [OrderStatus.PREPARING]: 'dashboardPage.statusPreparing',
  [OrderStatus.READY]: 'dashboardPage.statusReady',
  [OrderStatus.ON_THE_WAY]: 'dashboardPage.statusOnTheWay',
  [OrderStatus.DELIVERED]: 'dashboardPage.statusDelivered',
  [OrderStatus.CANCELLED]: 'dashboardPage.statusCancelled',
  [OrderStatus.REJECTED]: 'dashboardPage.statusRejected',
}

function formatMoney(value?: number | string | null): string {
  if (value == null) return '-'
  const n = Number(value)
  return Number.isFinite(n) ? `€${n.toFixed(2)}` : '-'
}

function formatOrderBusinessDate(value: string | number | undefined | null): string {
  const dash = i18n.t('common.emDash')
  if (value == null || value === '') return dash
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? dash : d.toLocaleDateString()
}

export default function Dashboard() {
  const { t } = useTranslation()
  const dash = t('common.emDash')
  const [loading, setLoading] = useState(true)
  const [todayOrders, setTodayOrders] = useState<DashboardOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<OrderTableSortKey>('createdAt')
  const [sortDir, setSortDir] = useState<OrderTableSortDir>('desc')
  const [patchingOrderId, setPatchingOrderId] = useState<string | null>(null)
  const [orderActionError, setOrderActionError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [listPage, setListPage] = useState(1)
  const previousTodayCountRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const refreshTodayOrdersRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const filteredTodayOrders = useMemo(() => {
    if (!statusFilter) return todayOrders
    return todayOrders.filter((o) => String(o.status ?? '') === statusFilter)
  }, [todayOrders, statusFilter])

  const displayedOrders = useMemo(
    () => sortOrdersByColumn(filteredTodayOrders, sortKey, sortDir),
    [filteredTodayOrders, sortKey, sortDir]
  )

  const totalListPages = Math.max(1, Math.ceil(displayedOrders.length / DASHBOARD_PAGE_SIZE))

  useEffect(() => {
    setListPage(1)
  }, [statusFilter])

  useEffect(() => {
    setListPage((p) => Math.min(p, totalListPages))
  }, [totalListPages])

  const paginatedOrders = useMemo(() => {
    const start = (listPage - 1) * DASHBOARD_PAGE_SIZE
    return displayedOrders.slice(start, start + DASHBOARD_PAGE_SIZE)
  }, [displayedOrders, listPage])

  const listPageNumbers = useMemo(() => {
    return Array.from({ length: totalListPages }, (_, i) => i + 1)
      .filter(
        (pn) =>
          pn === 1 ||
          pn === totalListPages ||
          (pn >= listPage - 2 && pn <= listPage + 2)
      )
      .reduce((arr: (number | 'ellipsis')[], pn, idx, src) => {
        if (idx > 0 && pn - (src[idx - 1] as number) > 1) arr.push('ellipsis')
        arr.push(pn)
        return arr
      }, [])
  }, [listPage, totalListPages])

  const onSortColumn = (k: OrderTableSortKey) => {
    const next = toggleOrderTableSort(sortKey, sortDir, k)
    setSortKey(next.key)
    setSortDir(next.dir)
  }

  const toggleRow = (id: string | number) => {
    setOpenRowId((prev) => (prev === String(id) ? null : String(id)))
  }

  const patchOrderStatus = async (id: string, status: typeof OrderStatus.CONFIRMED | typeof OrderStatus.CANCELLED) => {
    if (!id || patchingOrderId) return
    setPatchingOrderId(id)
    setOrderActionError(null)
    try {
      await updateOrder(id, { status })
      setTodayOrders((prev) => prev.map((o) => (String(o.id) === id ? { ...o, status } : o)))
    } catch (e) {
      setOrderActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setPatchingOrderId(null)
    }
  }

  const markOrderReady = async (id: string) => {
    if (!id || patchingOrderId) return
    setPatchingOrderId(id)
    setOrderActionError(null)
    try {
      await updateOrder(id, { status: OrderStatus.READY })
      await refreshTodayOrdersRef.current()
    } catch (e) {
      setOrderActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setPatchingOrderId(null)
    }
  }

  const patchOrderStatusWithRefresh = async (
    id: string,
    status: typeof OrderStatus.ON_THE_WAY | typeof OrderStatus.DELIVERED,
  ) => {
    if (!id || patchingOrderId) return
    setPatchingOrderId(id)
    setOrderActionError(null)
    try {
      await updateOrder(id, { status })
      await refreshTodayOrdersRef.current()
    } catch (e) {
      setOrderActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setPatchingOrderId(null)
    }
  }

  const confirmOrder = (id: string) => patchOrderStatus(id, OrderStatus.CONFIRMED)

  const cancelOrder = (id: string) => patchOrderStatus(id, OrderStatus.CANCELLED)

  const isChef = getCurrentUserRole() === UserRole.CHEF
  const isDeliveryMan = getCurrentUserRole() === UserRole.DELIVERY_MAN
  const canMutateOrders = hasOrdersMutationUiAccess()

  const deliveryCanMarkOnTheWay = (status: string | undefined) => (status ?? '') === OrderStatus.READY

  const deliveryCanMarkDelivered = (status: string | undefined) =>
    (status ?? '') === OrderStatus.ON_THE_WAY

  const chefCannotMarkReady = (status: string | undefined) => {
    const s = status ?? ''
    return (
      s === OrderStatus.READY ||
      s === OrderStatus.ON_THE_WAY ||
      s === OrderStatus.DELIVERED ||
      s === OrderStatus.CANCELLED ||
      s === OrderStatus.REJECTED
    )
  }

  const playNewOrderSound = () => {
    try {
      if (typeof window === 'undefined' || !window.AudioContext) return

      if (!audioCtxRef.current) {
        audioCtxRef.current = new window.AudioContext()
      }

      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const start = ctx.currentTime
      const ringDuration = 1
      const ringGap = 0.1
      const repeatCount = 2
      const master = ctx.createGain()
      master.gain.setValueAtTime(1.6, start)
      master.connect(ctx.destination)

      // Bell-like timbre: layered sine partials with different decay rates.
      const createPartial = (baseTime: number, frequency: number, peak: number, decaySeconds: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(frequency, baseTime)

        gain.gain.setValueAtTime(0.0001, baseTime)
        gain.gain.exponentialRampToValueAtTime(peak, baseTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, baseTime + decaySeconds)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(baseTime)
        osc.stop(baseTime + ringDuration)
      }

      for (let i = 0; i < repeatCount; i++) {
        const t = start + i * (ringDuration + ringGap)
        createPartial(t, 880, 0.22, 1.2)
        createPartial(t, 1320, 0.12, 0.95)
        createPartial(t, 1760, 0.08, 0.75)
      }
    } catch {
      // Ignore audio errors; polling should continue even if sound fails.
    }
  }

  useEffect(() => {
    let mounted = true

    const refreshTodayOrders = async () => {
      try {
        const r = await fetch(`${API_BASE}/orders`)
        if (!r.ok) {
          throw new Error(i18n.t('dashboardPage.fetchFailed', { status: r.status }))
        }

        const payload = await r.json()
        if (!mounted) return

        const orders = normalizeOrders(payload)
        const filtered = orders.filter((o) => isToday(o.createdAt))

        const previousCount = previousTodayCountRef.current
        const nextCount = filtered.length
         if (previousCount !== null && nextCount > previousCount) {
          playNewOrderSound()
        }
        previousTodayCountRef.current = nextCount

        setTodayOrders(filtered)
        setError(null)
      } catch (e) {
        if (mounted) setError(String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    refreshTodayOrdersRef.current = refreshTodayOrders
    refreshTodayOrders()
    const intervalId = window.setInterval(() => void refreshTodayOrdersRef.current(), 30_000)

    return () => {
      mounted = false
      refreshTodayOrdersRef.current = () => Promise.resolve()
      window.clearInterval(intervalId)
      if (audioCtxRef.current) {
        void audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [])

  const noOrdersLabel =
    todayOrders.length === 0 ? t('dashboardPage.noOrdersToday') : t('dashboardPage.noOrdersForStatus')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">{t('dashboardPage.title')}</h1>
        <div className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[11rem]">
          <label htmlFor="dashboard-status-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('dashboardPage.filterByStatus')}
          </label>
          <select
            id="dashboard-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('dashboardPage.statusAll')}</option>
            {DASHBOARD_STATUS_FILTER_ORDER.map((s) => (
              <option key={s} value={s}>
                {t(DASHBOARD_STATUS_LABEL_KEY[s])}
              </option>
            ))}
          </select>
        </div>
      </div>

      {orderActionError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          {orderActionError}
        </div>
      ) : null}

      <div className="bg-white rounded-md border shadow-sm dark:bg-slate-900 dark:border-slate-700 overflow-x-auto md:overflow-visible">
        {loading ? (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>{t('ordersPage.orderId')}</TableHeadCell>
                <TableHeadCell>{t('ordersPage.orderNumber')}</TableHeadCell>
                <TableHeadCell>{t('ordersPage.orderDate')}</TableHeadCell>
                <TableHeadCell>{t('ordersPage.restaurant')}</TableHeadCell>
                <TableHeadCell>{t('ordersPage.deliveryLocation')}</TableHeadCell>
                <TableHeadCell>{t('ordersPage.customer')}</TableHeadCell>
                <TableHeadCell>{t('ordersPage.price')}</TableHeadCell>
                <TableHeadCell>{t('ordersPage.status')}</TableHeadCell>
                <TableHeadCell>{t('dashboardPage.actions')}</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, r) => (
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
          <div className="p-4 text-red-600">{error}</div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {displayedOrders.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">{noOrdersLabel}</div>
              ) : (
                paginatedOrders.map((o, i) => {
                  const id = String(o.id ?? '')
                  const restaurant = o.restaurant?.name ?? '-'
                  const deliveryLocation = o.deliveryLocation?.name ?? '-'
                  const customer = o.customerName ?? o.customer?.name ?? o.email ?? '-'
                  const total = formatMoney(o.total ?? o.amount)
                  const subtotal = formatMoney(o.subtotal)
                  const created = o.createdAt ? new Date(String(o.createdAt)).toLocaleTimeString() : ''
                  const status = o.status ?? ''

                  return (
                    <Card
                      key={String(o.id ?? i)}
                      className="rounded-none border-0 border-b last:border-b-0 bg-white dark:bg-slate-900"
                    >
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div
                          className="flex flex-col gap-2 cursor-pointer rounded-md -m-1 p-1 hover:bg-slate-50 dark:hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                          onClick={() => toggleRow(o.id ?? '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              toggleRow(o.id ?? '')
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-expanded={openRowId === String(o.id ?? '')}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Order id {id || '—'}
                            </div>
                            {status ? (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(status)}`}>
                                {status}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">{restaurant} • {deliveryLocation}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {t('dashboardPage.orderNumberMobile', {
                              num: o.orderNumber != null ? String(o.orderNumber) : dash,
                              date: formatOrderBusinessDate(o.orderDate),
                            })}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-200 truncate">{customer}</div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {total}{' '}
                              <span className="font-normal">{t('dashboardPage.subtotalMobile', { sub: subtotal })}</span>
                            </span>
                            <span>{created}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex flex-nowrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {canMutateOrders && isChef ? (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={!!patchingOrderId || chefCannotMarkReady(status)}
                                aria-label={t('dashboardPage.ariaReady')}
                                onClick={() => markOrderReady(String(o.id ?? ''))}
                              >
                                {t('dashboardPage.ready')}
                              </Button>
                            ) : canMutateOrders && isDeliveryMan ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkOnTheWay(status)}
                                  aria-label={t('dashboardPage.ariaOnTheWay')}
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.ON_THE_WAY)
                                  }
                                >
                                  {t('dashboardPage.onTheWay')}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkDelivered(status)}
                                  aria-label={t('dashboardPage.ariaDelivered')}
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.DELIVERED)
                                  }
                                >
                                  {t('dashboardPage.delivered')}
                                </Button>
                              </>
                            ) : canMutateOrders ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<FiCheckCircle className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  aria-label={t('dashboardPage.confirmOrder')}
                                  onClick={() => confirmOrder(String(o.id ?? ''))}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<FiSlash className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  aria-label={t('dashboardPage.cancelOrder')}
                                  onClick={() => cancelOrder(String(o.id ?? ''))}
                                />
                              </>
                            ) : null}
                          </div>
                        </div>
                        {openRowId === String(o.id ?? '') && (
                          <div
                            className="border-t border-gray-100 pt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <OrderDetailsPanel order={o} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <tr>
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
                    <TableHeadCell>{t('dashboardPage.actions')}</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {displayedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>{noOrdersLabel}</TableCell>
                    </TableRow>
                  )}
                  {paginatedOrders.map((o, i) => (
                    <Fragment key={String(o.id ?? i)}>
                      <TableRow
                        onClick={() => toggleRow(o.id ?? '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleRow(o.id ?? '')
                          }
                        }}
                        tabIndex={0}
                        aria-expanded={openRowId === String(o.id ?? '')}
                        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        <TableCell>
                          <div className="text-sm font-semibold">{String(o.id ?? '')}</div>
                          <div className="text-xs text-slate-500">{o.createdAt ? new Date(String(o.createdAt)).toLocaleTimeString() : ''}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold tabular-nums">
                            {o.orderNumber != null ? o.orderNumber : dash}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatOrderBusinessDate(o.orderDate)}</span>
                        </TableCell>
                        <TableCell>{o.restaurant?.name ?? '-'}</TableCell>
                        <TableCell>{o.deliveryLocation?.name ?? '-'}</TableCell>
                        <TableCell>{o.customerName ?? o.customer?.name ?? o.email ?? '-'}</TableCell>
                        <TableCell>
                          <p className="font-semibold">{formatMoney(o.total ?? o.amount)}</p>
                          <p className="text-xs">
                            {t('common.subtotal')}: {formatMoney(o.subtotal)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusClass(o.status)}`}>
                            {o.status ?? ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex flex-nowrap justify-center items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            role="presentation"
                          >
                            {canMutateOrders && isChef ? (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={!!patchingOrderId || chefCannotMarkReady(o.status)}
                                aria-label={t('dashboardPage.ariaReady')}
                                onClick={() => markOrderReady(String(o.id ?? ''))}
                              >
                                {t('dashboardPage.ready')}
                              </Button>
                            ) : canMutateOrders && isDeliveryMan ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkOnTheWay(o.status)}
                                  aria-label={t('dashboardPage.ariaOnTheWay')}
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.ON_THE_WAY)
                                  }
                                >
                                  {t('dashboardPage.onTheWay')}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkDelivered(o.status)}
                                  aria-label={t('dashboardPage.ariaDelivered')}
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.DELIVERED)
                                  }
                                >
                                  {t('dashboardPage.delivered')}
                                </Button>
                              </>
                            ) : canMutateOrders ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<FiCheckCircle className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  aria-label={t('dashboardPage.confirmOrder')}
                                  onClick={() => confirmOrder(String(o.id ?? ''))}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<FiSlash className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  aria-label={t('dashboardPage.cancelOrder')}
                                  onClick={() => cancelOrder(String(o.id ?? ''))}
                                />
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                      {openRowId === String(o.id ?? '') && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-left align-top">
                            <OrderDetailsPanel order={o} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {displayedOrders.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
                <div className="text-slate-600 dark:text-slate-400 text-sm">
                  {t('common.paginationSummary', {
                    page: listPage,
                    totalPages: totalListPages,
                    total: displayedOrders.length,
                  })}
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setListPage(1)}
                    disabled={listPage === 1}
                    aria-label={t('common.firstPage')}
                  >
                    «
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    disabled={listPage === 1}
                    aria-label={t('common.prevPage')}
                  >
                    ‹
                  </Button>
                  {listPageNumbers.map((pn, idx) =>
                    pn === 'ellipsis' ? (
                      <span key={`dash-ellipsis-${idx}`} className="px-2 text-slate-400 dark:text-slate-500">
                        …
                      </span>
                    ) : (
                      <Button
                        key={pn}
                        variant={pn === listPage ? 'primary' : 'default'}
                        size="sm"
                        onClick={() => setListPage(pn as number)}
                        disabled={pn === listPage}
                        aria-current={pn === listPage ? 'page' : undefined}
                      >
                        {pn}
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setListPage((p) => Math.min(totalListPages, p + 1))}
                    disabled={listPage === totalListPages}
                    aria-label={t('common.nextPage')}
                  >
                    ›
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setListPage(totalListPages)}
                    disabled={listPage === totalListPages}
                    aria-label={t('common.lastPage')}
                  >
                    »
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
