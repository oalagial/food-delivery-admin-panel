import { Fragment, useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { FiCheckCircle, FiSlash } from 'react-icons/fi'
import { Card, CardContent } from '../components/ui/card'
import Table, { TableBody, TableHead, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'

import { API_BASE } from '../config'

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
}

function OrderDetails({ order }: { order: DashboardOrder }) {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pb-3 border-b">
        <div className="text-center">
          <p className="text-xs uppercase">Payment</p>
          <p className="text-sm font-semibold">{order.paymentMethod ?? '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase">Payment Status</p>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-800 inline-block">
            {order.paymentStatus ?? '-'}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase">Fee</p>
          <p className="text-sm font-semibold">{formatMoney(order.deliveryFee)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase">Discount</p>
          <p className="text-sm font-semibold text-red-600">{formatMoney(order.discount)}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-semibold mb-1">Customer</p>
          <p className="font-semibold">{order.customer?.name ?? order.customerName ?? '-'}</p>
          <p className="text-xs">{order.customer?.email ?? order.email ?? '-'}</p>
          <p className="text-xs">{order.customer?.phone ?? '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-semibold mb-1">Delivery</p>
          <p className="font-semibold">
            {order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : '-'}
          </p>
          {order.notes && <p className="text-xs italic mt-1">Note: {order.notes}</p>}
        </div>
      </div>

      <div className="space-y-2 pb-3 border-b">
        {order.products && order.products.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-1">Products ({order.products.length})</p>
            <div className="space-y-1">
              {order.products.map((p) => (
                <div key={String(p.id ?? '')} className="text-xs p-2 bg-gray-50 rounded dark:bg-slate-800">
                  <div className="flex justify-between">
                    <span>
                      <strong>{p.name ?? ''}</strong> x{String(p.quantity ?? '')}
                    </span>
                    <span className="font-semibold">{formatMoney(p.total ?? null)}</span>
                  </div>
                  {p.extras && p.extras.length > 0 && (
                    <div className="mt-1 ml-2 space-y-0.5">
                      {p.extras.map((extra) => (
                        <div key={String(extra.id ?? '')}>
                          • {extra.name ?? ''} x{String(extra.quantity ?? '')}{' '}
                          <span>({formatMoney(extra.price ?? null)})</span>
                        </div>
                      ))}
                      {p.extrasPrice != null && Number(p.extrasPrice) > 0 && (
                        <div className="font-semibold mt-0.5">Extras Total: {formatMoney(p.extrasPrice)}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {order.offers && order.offers.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-1">Offers ({order.offers.length})</p>
            <div className="space-y-1">
              {order.offers.map((o) => (
                <div key={String(o.id ?? '')} className="text-xs p-2 bg-purple-50 rounded border border-purple-200">
                  <div className="flex justify-between">
                    <span>
                      <strong>{o.name ?? ''}</strong> x{String(o.quantity ?? '')}
                    </span>
                    <span className="font-semibold">{formatMoney(o.total ?? null)}</span>
                  </div>
                  {o.groups && o.groups.length > 0 && (
                    <div className="mt-1 ml-2">
                      {o.groups.map((g) => (
                        <div key={String(g.groupId ?? '')}>
                          {g.groupName ?? ''}: <strong>{g.selectedItem?.name ?? ''}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-8 text-sm">
        <div>
          <p className="text-xs">Subtotal</p>
          <p className="font-semibold">{formatMoney(order.subtotal)}</p>
        </div>
        <div>
          <p className="text-xs">Fee</p>
          <p className="font-semibold">{formatMoney(order.deliveryFee)}</p>
        </div>
        {Number(order.discount ?? 0) > 0 && (
          <div>
            <p className="text-xs">Discount</p>
            <p className="font-semibold text-red-600">-{formatMoney(order.discount)}</p>
          </div>
        )}
        <div className="text-right border-l pl-8">
          <p className="text-xs">Total</p>
          <p className="text-lg font-bold text-green-600">{formatMoney(order.total ?? order.amount)}</p>
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
  if (status === 'CANCELLED') return 'bg-red-100 text-red-800'
  return 'bg-blue-100 text-blue-800'
}

function formatMoney(value?: number | string | null): string {
  if (value == null) return '-'
  const n = Number(value)
  return Number.isFinite(n) ? `€${n.toFixed(2)}` : '-'
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [todayOrders, setTodayOrders] = useState<DashboardOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [openRowId, setOpenRowId] = useState<string | null>(null)

  const toggleRow = (id: string | number) => {
    setOpenRowId((prev) => (prev === String(id) ? null : String(id)))
  }

  const acceptOrder = (id: string) => {
    console.log('Accept Id:', id)
  }

  const rejectOrder = (id: string) => {
    console.log('Reject Id:', id)
  }

  useEffect(() => {
    let mounted = true

    fetch(`${API_BASE}/orders`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`Failed to fetch orders (${r.status})`)
        }
        return r.json()
      })
      .then((payload) => {
        if (!mounted) return
        const orders = normalizeOrders(payload)
        const filtered = orders
          .filter((o) => isToday(o.createdAt))
          .sort((a, b) => new Date(String(b.createdAt ?? '')).getTime() - new Date(String(a.createdAt ?? '')).getTime())
        setTodayOrders(filtered)
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
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Today&apos;s Orders</h1>

      <div className="bg-white rounded-md border shadow-sm dark:bg-slate-900 dark:border-slate-700 overflow-x-auto md:overflow-visible">
        {loading ? (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Order</TableHeadCell>
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
                  {Array.from({ length: 7 }).map((__, c) => (
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
              {todayOrders.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No orders for today</div>
              ) : (
                todayOrders.map((o, i) => {
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
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">#{id || '-'}</div>
                          {status ? (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(status)}`}>
                              {status}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">{restaurant} • {deliveryLocation}</div>
                        <div className="text-sm text-slate-700 dark:text-slate-200 truncate">{customer}</div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{total} <span className="font-normal">(Subtotal {subtotal})</span></span>
                          <span>{created}</span>
                        </div>
                        <div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(o.id ?? '')}
                            >
                              {openRowId === String(o.id ?? '') ? 'Hide' : 'Details'}
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<FiCheckCircle className="w-4 h-4" />}
                              onClick={() => acceptOrder(String(o.id ?? ''))}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<FiSlash className="w-4 h-4" />}
                              onClick={() => rejectOrder(String(o.id ?? ''))}
                            />
                          </div>
                        </div>
                        {openRowId === String(o.id ?? '') && (
                          <div className="border-t border-gray-100 pt-2">
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
                    <TableHeadCell>Order</TableHeadCell>
                    <TableHeadCell>Restaurant</TableHeadCell>
                    <TableHeadCell>Delivery Location</TableHeadCell>
                    <TableHeadCell>Customer</TableHeadCell>
                    <TableHeadCell>Price</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {todayOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>No orders for today</TableCell>
                    </TableRow>
                  )}
                  {todayOrders.map((o, i) => (
                    <Fragment key={String(o.id ?? i)}>
                      <TableRow>
                        <TableCell>
                          <div className="text-sm font-semibold">#{String(o.id ?? '')}</div>
                          <div className="text-xs text-slate-500">{o.createdAt ? new Date(String(o.createdAt)).toLocaleTimeString() : ''}</div>
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
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(o.id ?? '')}
                            >
                              {openRowId === String(o.id ?? '') ? 'Hide' : 'Details'}
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<FiCheckCircle className="w-4 h-4" />}
                              onClick={() => acceptOrder(String(o.id ?? ''))}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<FiSlash className="w-4 h-4" />}
                              onClick={() => rejectOrder(String(o.id ?? ''))}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      {openRowId === String(o.id ?? '') && (
                        <TableRow>
                          <TableCell colSpan={7}>
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
