import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { getOrdersList } from '../utils/api'
import type { OrderItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { OrderTableSortHeadCell } from '../components/OrderTableSortHeadCell'
import {
  toggleOrderTableSort,
  type OrderTableSortDir,
  type OrderTableSortKey,
} from '../utils/orderTableSort'

function formatOrderBusinessDate(value: string | number | undefined | null): string {
  if (value == null || value === '') return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

type OrderRowProps = {
  order: OrderItem;
  isOpen: boolean;
  onToggle: () => void;
};

type OrderCardProps = OrderRowProps;

type OrderDetailsProps = {
  order: OrderItem;
};

function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="p-4 space-y-4 text-sm text-left">
      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pb-3 border-b">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Payment</p>
          <p className="text-sm font-semibold mt-0.5">{order.paymentMethod}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Payment Status</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-yellow-100 text-yellow-800 inline-block mt-0.5">
            {order.paymentStatus}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Fee</p>
          <p className="text-sm font-semibold mt-0.5">€{order.deliveryFee}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Discount</p>
          <p className="text-sm font-semibold text-red-600 mt-0.5">€{order.discount}</p>
        </div>
        <div className="text-left">
          <p className="text-xs uppercase font-semibold mb-1 tracking-wide text-slate-600 dark:text-slate-400">Customer</p>
          <p className="font-semibold text-base">{order.customer?.name}</p>
          <p className="text-xs mt-0.5">{order.customer?.email}</p>
          <p className="text-xs">{order.customer?.phone}</p>
        </div>
        <div className="text-left">
          <p className="text-xs uppercase font-semibold mb-1 tracking-wide text-slate-600 dark:text-slate-400">Delivery</p>
          <p className="font-semibold text-sm">
            {order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : '-'}
          </p>
          {order.notes && (
            <p className="text-xs italic mt-1">Note: {order.notes}</p>
          )}
        </div>
      </div>

      {/* Line items: responsive grid + summary row below */}
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
                      key={p.id}
                      className="rounded-lg border border-slate-200 bg-gray-50 p-3 dark:border-slate-600 dark:bg-slate-800/80"
                    >
                      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-start">
                        <div className="min-w-0">
                          <p className="text-base sm:text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                            {p.name}
                          </p>
                          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
                            ×{p.quantity}
                          </p>
                        </div>
                        <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          €{p.total}
                        </p>
                      </div>
                      {hasRemoved && (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                          Without: {removed.join(', ')}
                        </p>
                      )}
                      {p.extras && p.extras.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs leading-relaxed border-t border-slate-200/80 dark:border-slate-600 pt-2">
                          {p.extras.map((extra: any) => (
                            <div key={extra.id}>
                              • {extra.name}{' '}
                              <span className="font-semibold tabular-nums">×{extra.quantity}</span>{' '}
                              <span>(€{extra.price})</span>
                            </div>
                          ))}
                          {p.extrasPrice && Number(p.extrasPrice) > 0 && (
                            <div className="font-semibold text-sm pt-0.5">Extras Total: €{p.extrasPrice}</div>
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
                    key={o.id}
                    className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/30"
                  >
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-start">
                      <div className="min-w-0">
                        <p className="text-base sm:text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                          {o.name}
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
                          ×{o.quantity}
                        </p>
                      </div>
                      <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        €{o.total}
                      </p>
                    </div>
                    {o.groups && o.groups.length > 0 && (
                      <div className="mt-2 text-xs space-y-0.5 leading-relaxed border-t border-purple-200/80 dark:border-purple-900 pt-2">
                        {o.groups.map((g: any) => (
                          <div key={g.groupId}>
                            {g.groupName}: <strong>{g.selectedItem?.name}</strong>
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

      {/* Price summary — full width row at bottom */}
      <div className="flex flex-wrap justify-end gap-6 sm:gap-10 text-sm">
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">Subtotal</p>
          <p className="font-semibold text-base">€{order.subtotal}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">Fee</p>
          <p className="font-semibold text-base">€{order.deliveryFee}</p>
        </div>
        {Number(order.discount) > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-600 dark:text-slate-400">Discount</p>
            <p className="font-semibold text-base text-red-600">-€{order.discount}</p>
          </div>
        )}
        <div className="text-right border-l border-slate-200 dark:border-slate-600 pl-6 sm:pl-10">
          <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
          <p className="text-xl font-bold text-green-600">€{order.total}</p>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, isOpen, onToggle }: OrderRowProps) {
  return (
    <>
      {/* Header Row */}
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
            {order.orderNumber != null ? order.orderNumber : '—'}
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
          <p className="text-xs">Subtotal: €{order.subtotal}</p>
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
            }`}>
            {order.status}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {isOpen ? 'Hide' : 'Details'}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expandable Details Row */}
      {isOpen && (
        <TableRow className="bg-gray-50 dark:bg-slate-900">
          <TableCell colSpan={9} className="text-left align-top">
            <OrderDetails order={order} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function OrderCard({ order, isOpen, onToggle }: OrderCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader
        className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
        onClick={onToggle}
      >
        <div>
          <CardTitle className="text-base font-semibold">
            Order id {order.id}{' '}
            <span className="text-xs font-normal">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : ''}
            </span>
          </CardTitle>
          <p className="text-xs">
            {order.restaurant?.name ?? ''} • {order.deliveryLocation?.name ?? ''}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Order number {order.orderNumber != null ? order.orderNumber : '—'} ·{' '}
            {formatOrderBusinessDate(order.orderDate)}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${order.status === 'DELIVERED'
            ? 'bg-green-100 text-green-800'
            : order.status === 'PENDING'
              ? 'bg-yellow-100 text-yellow-800'
              : order.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
        >
          {order.status}
        </span>
      </CardHeader>

      <CardContent className="px-4 pb-2 pt-0 space-y-1" onClick={onToggle}>
        <p className="text-sm">
          <span className="font-semibold">{order.customer?.name}</span>
        </p>
        <p className="text-xs">
          Total:{' '}
          <span className="font-semibold text-green-600">€{order.total}</span>{' '}
          <span>(Subtotal €{order.subtotal})</span>
        </p>
      </CardContent>

      <CardFooter className="flex justify-start items-center px-4 pb-4 pt-0">
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {isOpen ? 'Hide details' : 'Details'}
        </Button>
      </CardFooter>

      {isOpen && (
        <div className="border-t border-gray-100">
          <OrderDetails order={order} />
        </div>
      )}
    </Card>
  );
}

export default function Orders() {
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

  const onSortColumn = (k: OrderTableSortKey) => {
    const next = toggleOrderTableSort(sortKey, sortDir, k)
    setSortKey(next.key)
    setSortDir(next.dir)
    setPage(1)
  }

  const toggleRow = (id: string | number) => {
    setOpenRowId(prev => (prev === String(id) ? null : String(id)))
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    // Simulate paginated API: getOrdersList(page, limit)
    getOrdersList(page, limit, { sortField: sortKey, sortDir })
      .then((res: any) => {
        if (!mounted) return
        // Support both paginated and non-paginated responses
        let data, totalItems, totalPagesVal
        if (res && typeof res === 'object' && 'data' in res && 'totalPages' in res) {
          data = res.data
          totalItems = res.total
          totalPagesVal = res.totalPages
        } else {
          data = Array.isArray(res) ? res : res?.data ?? Object.values(res ?? {})
          totalItems = data.length
          totalPagesVal = 1
        }
        setItems(data)
        setTotal(totalItems)
        setTotalPages(totalPagesVal)
      })
      .catch(e => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [page, limit, sortKey, sortDir])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Orders</h1>
        <p className="text-gray-600 mt-1 dark:text-slate-400">View and manage customer orders</p>
      </div>

      {loading ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Order id</TableHeadCell>
              <TableHeadCell>Order number</TableHeadCell>
              <TableHeadCell>Order date</TableHeadCell>
              <TableHeadCell>Restaurant</TableHeadCell>
              <TableHeadCell>Delivery Location</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Details</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 4 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 9 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
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
            <p>No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {items.map(it => (
              <OrderCard
                key={String(it.id)}
                order={it}
                isOpen={openRowId === String(it.id)}
                onToggle={() => toggleRow(it.id ?? '')}
              />
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableRow>
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
                  <TableHeadCell>Details</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(it => (
                  <OrderRow
                    key={String(it.id)}
                    order={it}
                    isOpen={openRowId === String(it.id)}
                    onToggle={() => toggleRow(it.id ?? '')}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <div className="text-gray-600 text-sm mb-2 sm:mb-0">
              Page {page} of {totalPages} | Total: {total}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="First page"
              >
                «
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
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
                aria-label="Next page"
              >
                ›
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                aria-label="Last page"
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