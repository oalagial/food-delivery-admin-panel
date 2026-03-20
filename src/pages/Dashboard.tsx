import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { FiCheckCircle, FiSlash } from 'react-icons/fi'
import { Card, CardContent } from '../components/ui/card'
import Table, { TableBody, TableHead, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'

import { API_BASE } from '../config'
import { getCurrentUserRole, OrderStatus, updateOrder } from '../utils/api'
import { UserRole } from '../utils/userRoles'
import { OrderTableSortHeadCell } from '../components/OrderTableSortHeadCell'
import {
  sortOrdersByColumn,
  toggleOrderTableSort,
  type OrderTableSortDir,
  type OrderTableSortKey,
} from '../utils/orderTableSort'

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

function OrderDetails({ order }: { order: DashboardOrder }) {
  return (
    <div className="p-4 space-y-4 text-sm text-left">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pb-3 border-b">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Payment</p>
          <p className="text-sm font-semibold mt-0.5">{order.paymentMethod ?? '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Payment Status</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-yellow-100 text-yellow-800 inline-block mt-0.5">
            {order.paymentStatus ?? '-'}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Fee</p>
          <p className="text-sm font-semibold mt-0.5">{formatMoney(order.deliveryFee)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Discount</p>
          <p className="text-sm font-semibold text-red-600 mt-0.5">{formatMoney(order.discount)}</p>
        </div>
        <div className="text-left">
          <p className="text-xs uppercase font-semibold mb-1 tracking-wide text-slate-600 dark:text-slate-400">Customer</p>
          <p className="font-semibold text-base">{order.customer?.name ?? order.customerName ?? '-'}</p>
          <p className="text-xs mt-0.5">{order.customer?.email ?? order.email ?? '-'}</p>
          <p className="text-xs">{order.customer?.phone ?? '-'}</p>
        </div>
        <div className="text-left">
          <p className="text-xs uppercase font-semibold mb-1 tracking-wide text-slate-600 dark:text-slate-400">Delivery</p>
          <p className="font-semibold text-sm">
            {order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : '-'}
          </p>
          {order.notes && <p className="text-xs italic mt-1">Note: {order.notes}</p>}
        </div>
      </div>

      <div className="space-y-4 pb-3 border-b text-left">
        <div className="space-y-3">
          {order.products && order.products.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2 tracking-wide text-slate-600 dark:text-slate-400">
                Products ({order.products.length})
              </p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 list-none p-0 m-0">
                {order.products.map((p) => {
                  const removed = (p.removedIngredients ?? p.removed_ingredients ?? []) as string[]
                  const hasRemoved = Array.isArray(removed) && removed.length > 0
                  return (
                    <li
                      key={String(p.id ?? '')}
                      className="rounded-lg border border-slate-200 bg-gray-50 p-3 dark:border-slate-600 dark:bg-slate-800/80"
                    >
                      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-start">
                        <div className="min-w-0">
                          <p className="text-base sm:text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                            {p.name ?? ''}
                          </p>
                          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
                            ×{String(p.quantity ?? '')}
                          </p>
                        </div>
                        <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatMoney(p.total ?? null)}
                        </p>
                      </div>
                      {hasRemoved && (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                          Without: {removed.join(', ')}
                        </p>
                      )}
                      {p.extras && p.extras.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs leading-relaxed border-t border-slate-200/80 dark:border-slate-600 pt-2">
                          {p.extras.map((extra) => (
                            <div key={String(extra.id ?? '')}>
                              • {extra.name ?? ''}{' '}
                              <span className="font-semibold tabular-nums">×{String(extra.quantity ?? '')}</span>{' '}
                              <span>({formatMoney(extra.price ?? null)})</span>
                            </div>
                          ))}
                          {p.extrasPrice != null && Number(p.extrasPrice) > 0 && (
                            <div className="font-semibold text-sm pt-0.5">Extras Total: {formatMoney(p.extrasPrice)}</div>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {order.offers && order.offers.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2 tracking-wide text-slate-600 dark:text-slate-400">
                Offers ({order.offers.length})
              </p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 list-none p-0 m-0">
                {order.offers.map((o) => (
                  <li
                    key={String(o.id ?? '')}
                    className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/30"
                  >
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-start">
                      <div className="min-w-0">
                        <p className="text-base sm:text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                          {o.name ?? ''}
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
                          ×{String(o.quantity ?? '')}
                        </p>
                      </div>
                      <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatMoney(o.total ?? null)}
                      </p>
                    </div>
                    {o.groups && o.groups.length > 0 && (
                      <div className="mt-2 text-xs space-y-0.5 leading-relaxed border-t border-purple-200/80 dark:border-purple-900 pt-2">
                        {o.groups.map((g) => (
                          <div key={String(g.groupId ?? '')}>
                            {g.groupName ?? ''}: <strong>{g.selectedItem?.name ?? ''}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-6 sm:gap-10 text-sm">
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">Subtotal</p>
          <p className="font-semibold text-base">{formatMoney(order.subtotal)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">Fee</p>
          <p className="font-semibold text-base">{formatMoney(order.deliveryFee)}</p>
        </div>
        {Number(order.discount ?? 0) > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-600 dark:text-slate-400">Discount</p>
            <p className="font-semibold text-base text-red-600">-{formatMoney(order.discount)}</p>
          </div>
        )}
        <div className="text-right border-l border-slate-200 dark:border-slate-600 pl-6 sm:pl-10">
          <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
          <p className="text-xl font-bold text-green-600">{formatMoney(order.total ?? order.amount)}</p>
        </div>
      </div>
    </div>
  )
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

function formatMoney(value?: number | string | null): string {
  if (value == null) return '-'
  const n = Number(value)
  return Number.isFinite(n) ? `€${n.toFixed(2)}` : '-'
}

function formatOrderBusinessDate(value: string | number | undefined | null): string {
  if (value == null || value === '') return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [todayOrders, setTodayOrders] = useState<DashboardOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<OrderTableSortKey>('createdAt')
  const [sortDir, setSortDir] = useState<OrderTableSortDir>('desc')
  const [patchingOrderId, setPatchingOrderId] = useState<string | null>(null)
  const [orderActionError, setOrderActionError] = useState<string | null>(null)
  const previousTodayCountRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const refreshTodayOrdersRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const displayedOrders = useMemo(
    () => sortOrdersByColumn(todayOrders, sortKey, sortDir),
    [todayOrders, sortKey, sortDir]
  )

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
          throw new Error(`Failed to fetch orders (${r.status})`)
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Today&apos;s Orders</h1>

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
                <TableHeadCell>Order id</TableHeadCell>
                <TableHeadCell>Order number</TableHeadCell>
                <TableHeadCell>Order date</TableHeadCell>
                <TableHeadCell>Restaurant</TableHeadCell>
                <TableHeadCell>Delivery Location</TableHeadCell>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Price</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
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
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No orders for today</div>
              ) : (
                displayedOrders.map((o, i) => {
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
                            Order number {o.orderNumber != null ? o.orderNumber : '—'} · {formatOrderBusinessDate(o.orderDate)}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-200 truncate">{customer}</div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{total} <span className="font-normal">(Subtotal {subtotal})</span></span>
                            <span>{created}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex flex-nowrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {isChef ? (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={!!patchingOrderId || chefCannotMarkReady(status)}
                                aria-label="Ready"
                                onClick={() => markOrderReady(String(o.id ?? ''))}
                              >
                                Ready
                              </Button>
                            ) : isDeliveryMan ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkOnTheWay(status)}
                                  aria-label="On the way"
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.ON_THE_WAY)
                                  }
                                >
                                  On the way
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkDelivered(status)}
                                  aria-label="Delivered"
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.DELIVERED)
                                  }
                                >
                                  Delivered
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<FiCheckCircle className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  onClick={() => confirmOrder(String(o.id ?? ''))}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<FiSlash className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  onClick={() => cancelOrder(String(o.id ?? ''))}
                                />
                              </>
                            )}
                          </div>
                        </div>
                        {openRowId === String(o.id ?? '') && (
                          <div
                            className="border-t border-gray-100 pt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <OrderDetails order={o} />
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
                      label="Order id"
                      colKey="createdAt"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <OrderTableSortHeadCell
                      label="Order number"
                      colKey="orderNumber"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <OrderTableSortHeadCell
                      label="Order date"
                      colKey="orderDate"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <OrderTableSortHeadCell
                      label="Restaurant"
                      colKey="restaurant"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <OrderTableSortHeadCell
                      label="Delivery Location"
                      colKey="deliveryLocation"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <OrderTableSortHeadCell
                      label="Customer"
                      colKey="customer"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <OrderTableSortHeadCell
                      label="Price"
                      colKey="price"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <OrderTableSortHeadCell
                      label="Status"
                      colKey="status"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSortColumn}
                    />
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {displayedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>No orders for today</TableCell>
                    </TableRow>
                  )}
                  {displayedOrders.map((o, i) => (
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
                            {o.orderNumber != null ? o.orderNumber : '—'}
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
                          <p className="text-xs">Subtotal: {formatMoney(o.subtotal)}</p>
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
                            {isChef ? (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={!!patchingOrderId || chefCannotMarkReady(o.status)}
                                aria-label="Ready"
                                onClick={() => markOrderReady(String(o.id ?? ''))}
                              >
                                Ready
                              </Button>
                            ) : isDeliveryMan ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkOnTheWay(o.status)}
                                  aria-label="On the way"
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.ON_THE_WAY)
                                  }
                                >
                                  On the way
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={!!patchingOrderId || !deliveryCanMarkDelivered(o.status)}
                                  aria-label="Delivered"
                                  onClick={() =>
                                    patchOrderStatusWithRefresh(String(o.id ?? ''), OrderStatus.DELIVERED)
                                  }
                                >
                                  Delivered
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<FiCheckCircle className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  onClick={() => confirmOrder(String(o.id ?? ''))}
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<FiSlash className="w-4 h-4" />}
                                  disabled={!!patchingOrderId}
                                  onClick={() => cancelOrder(String(o.id ?? ''))}
                                />
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {openRowId === String(o.id ?? '') && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-left align-top">
                            <OrderDetails order={o} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
