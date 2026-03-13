import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { FiCheckCircle, FiSlash } from 'react-icons/fi'
import { getOrdersList } from '../utils/api'
import type { OrderItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { LOCAL_BACKEND } from '../config'

type OrderRowProps = {
  order: OrderItem;
  isOpen: boolean;
  onToggle: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onLocalNotify: (order: OrderItem) => void;
};

type OrderCardProps = OrderRowProps;

type OrderDetailsProps = {
  order: OrderItem;
};

function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="p-4 space-y-3">
      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pb-3 border-b">
        <div className="text-center">
          <p className="text-xs uppercase">Payment</p>
          <p className="text-sm font-semibold">{order.paymentMethod}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase">Payment Status</p>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-800 inline-block">
            {order.paymentStatus}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase">Fee</p>
          <p className="text-sm font-semibold">€{order.deliveryFee}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase">Discount</p>
          <p className="text-sm font-semibold text-red-600">€{order.discount}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-semibold mb-1">Customer</p>
          <p className="font-semibold">{order.customer?.name}</p>
          <p className="text-xs">{order.customer?.email}</p>
          <p className="text-xs">{order.customer?.phone}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-semibold mb-1">Delivery</p>
          <p className="font-semibold">
            {order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : '-'}
          </p>
          {order.notes && (
            <p className="text-xs italic mt-1">Note: {order.notes}</p>
          )}
        </div>
      </div>

      {/* Items & Offers Combined */}
      <div className="space-y-2 pb-3 border-b">
        {order.products && order.products.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-1">
              Products ({order.products.length})
            </p>
            <div className="space-y-1">
              {order.products.map(p => (
                <div key={p.id} className="text-xs p-2 bg-gray-50 rounded dark:bg-slate-800">
                  <div className="flex justify-between">
                    <span>
                      <strong>{p.name}</strong> ×{p.quantity}
                    </span>
                    <span className="font-semibold">€{p.total}</span>
                  </div>
                  {p.extras && p.extras.length > 0 && (
                    <div className="mt-1 ml-2 space-y-0.5">
                      {p.extras.map((extra: any) => (
                        <div key={extra.id}>
                          • {extra.name} ×{extra.quantity}{' '}
                          <span>(€{extra.price})</span>
                        </div>
                      ))}
                      {p.extrasPrice && Number(p.extrasPrice) > 0 && (
                        <div className="font-semibold mt-0.5">
                          Extras Total: €{p.extrasPrice}
                        </div>
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
            <p className="text-xs font-semibold uppercase mb-1">
              Offers ({order.offers.length})
            </p>
            <div className="space-y-1">
              {order.offers.map(o => (
                <div
                  key={o.id}
                  className="text-xs p-2 bg-purple-50 rounded border border-purple-200"
                >
                  <div className="flex justify-between">
                    <span>
                      <strong>{o.name}</strong> ×{o.quantity}
                    </span>
                    <span className="font-semibold">€{o.total}</span>
                  </div>
                  {o.groups && o.groups.length > 0 && (
                    <div className="mt-1 ml-2">
                      {o.groups.map((g: any) => (
                        <div key={g.groupId}>
                          {g.groupName}: <strong>{g.selectedItem?.name}</strong>
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

      {/* Price Summary */}
      <div className="flex justify-end gap-8 text-sm">
        <div>
          <p className="text-xs">Subtotal</p>
          <p className="font-semibold">€{order.subtotal}</p>
        </div>
        <div>
          <p className="text-xs">Fee</p>
          <p className="font-semibold">€{order.deliveryFee}</p>
        </div>
        {Number(order.discount) > 0 && (
          <div>
            <p className="text-xs">Discount</p>
            <p className="font-semibold text-red-600">-€{order.discount}</p>
          </div>
        )}
        <div className="text-right border-l pl-8">
          <p className="text-xs">Total</p>
          <p className="text-lg font-bold text-green-600">€{order.total}</p>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, isOpen, onToggle, onAccept, onReject, onLocalNotify }: OrderRowProps) {
  return (
    <>
      {/* Header Row */}
      <TableRow onClick={onToggle} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
        <TableCell>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold">#{order.id}</p>
              <p className="text-xs">{new Date(order.createdAt || '').toLocaleDateString()}</p>
            </div>
          </div>
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
          <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* <Link to={`/orders/creation/${order.id}`}>
              <Button variant="ghost" size="sm" icon={<FiEdit className="w-4 h-4" />} title="Edit Order" />
            </Link> */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {isOpen ? "Hide" : "Details"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onLocalNotify(order)}
            >
              Print
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={<FiCheckCircle className="w-4 h-4" />}
              onClick={() => onAccept(String(order.id))}
            >
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<FiSlash className="w-4 h-4" />}
              onClick={() => onReject(String(order.id))}
            >
            </Button>

          </div>
        </TableCell>
      </TableRow>

      {/* Expandable Details Row */}
      {isOpen && (
        <TableRow className="bg-gray-50 dark:bg-slate-900">
          <TableCell colSpan={7}>
            <OrderDetails order={order} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function OrderCard({ order, isOpen, onToggle, onAccept, onReject, onLocalNotify }: OrderCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader
        className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
        onClick={onToggle}
      >
        <div>
          <CardTitle className="text-base font-semibold">
            #{order.id}{' '}
            <span className="text-xs font-normal">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : ''}
            </span>
          </CardTitle>
          <p className="text-xs">
            {order.restaurant?.name ?? ''} • {order.deliveryLocation?.name ?? ''}
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

      <CardFooter className="flex justify-between items-center px-4 pb-4 pt-0 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
        >
          {isOpen ? 'Hide details' : 'Details'}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onLocalNotify(order)}
        >
          Print
        </Button>

        <div className="flex gap-1">
          <Button
            variant="primary"
            size="sm"
            icon={<FiCheckCircle className="w-4 h-4" />}
            onClick={() => onAccept(String(order.id))}
          />
          <Button
            variant="danger"
            size="sm"
            icon={<FiSlash className="w-4 h-4" />}
            onClick={() => onReject(String(order.id))}
          />
        </div>
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

  const toggleRow = (id: string | number) => {
    setOpenRowId(prev => (prev === String(id) ? null : String(id)))
  }

  const acceptOrder = (id: string) => {
    const selectedOrder = items.filter(i => i.id == id)
    console.log(selectedOrder)
  }

  const rejectOrder = (id: string) => {
    console.log('Reject Id:', id)
  }

  const notifyLocalBackend = async (order: OrderItem) => {
    try {
      if (!LOCAL_BACKEND) {
        console.error('LOCAL_BACKEND is not set')
        return
      }

      const url = `${LOCAL_BACKEND}/print`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })

      if (!res.ok) {
        console.error('Local backend request failed', res.status)
      }
    } catch (err) {
      console.error('Local backend request error', err)
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    // Simulate paginated API: getOrdersList(page, limit)
    getOrdersList(page, limit)
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
  }, [page, limit])

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
              <TableHeadCell>Order</TableHeadCell>
              <TableHeadCell>Restaurant</TableHeadCell>
              <TableHeadCell>Delivery Location</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 4 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 7 }).map((__, c) => (
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
                onAccept={acceptOrder}
                onReject={rejectOrder}
                onLocalNotify={notifyLocalBackend}
              />
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Order</TableHeadCell>
                  <TableHeadCell>Restaurant</TableHeadCell>
                  <TableHeadCell>Delivery Location</TableHeadCell>
                  <TableHeadCell>Customer</TableHeadCell>
                  <TableHeadCell>Price</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(it => (
                  <OrderRow
                    key={String(it.id)}
                    order={it}
                    isOpen={openRowId === String(it.id)}
                    onToggle={() => toggleRow(it.id ?? '')}
                    onAccept={acceptOrder}
                    onReject={rejectOrder}
                    onLocalNotify={notifyLocalBackend}
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