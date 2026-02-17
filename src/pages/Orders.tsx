import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/button'
import { FiCheckCircle, FiChevronDown, FiSlash, FiAlertTriangle } from 'react-icons/fi'
import { type OrderItem, OrderStatus, getOrdersList, updateOrder, getProductsList, type Product } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardContent } from '../components/ui/card'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'

export type MissingProductInfo = {
  productId: string | number
  name: string
  requested: number
  inStock: number | null
  missing: number
}

function getMissingProductsForOrder(order: OrderItem, products: Product[]): MissingProductInfo[] {
  const result: MissingProductInfo[] = []
  const productsList = order.products ?? []
  for (const op of productsList) {
    const productId = op.productId ?? op.id
    const requested = Number(op.quantity ?? 0)
    if (requested <= 0) continue
    const product = products.find((p) => String(p.id) === String(productId))
    const inStock = product?.stockQuantity != null ? Number(product.stockQuantity) : null
    if (inStock === null) continue // no stock limit → not missing
    if (requested > inStock) {
      result.push({
        productId: productId ?? '',
        name: String(op.name ?? product?.name ?? `Product #${productId}`),
        requested,
        inStock,
        missing: requested - inStock,
      })
    }
  }
  return result
}

type OrderRowProps = {
  order: OrderItem;
  isOpen: boolean;
  onToggle: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
};

function OrderRow({ order, isOpen, onToggle, onAccept, onReject }: OrderRowProps) {
  return (
    <>
      {/* Header Row */}
      <TableRow onClick={onToggle} className="cursor-pointer hover:bg-gray-50">
        <TableCell>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold">#{order.id}</p>
              <p className="text-xs text-gray-600">{new Date(order.createdAt || '').toLocaleDateString()}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>{order.restaurant?.name ?? ''}</TableCell>
        <TableCell>{order.deliveryLocation?.name ?? ''}</TableCell>
        <TableCell>{order.customer?.name}</TableCell>
        <TableCell>
          <p className="font-semibold">€{order.total}</p>
          <p className="text-xs text-gray-600">Subtotal: €{order.subtotal}</p>
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'CANCELLED' || order.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {order.status}
          </span>
        </TableCell>
        <TableCell>{new Date(order.createdAt || '').toLocaleString()}</TableCell>
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
        <TableRow className="bg-gray-50">
          <TableCell colSpan={8}>
            <div className="p-4 space-y-3">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pb-3 border-b">
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase">Payment</p>
                  <p className="text-sm font-semibold">{order.paymentMethod}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase">Payment Status</p>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-800 inline-block">{order.paymentStatus}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase">Fee</p>
                  <p className="text-sm font-semibold">€{order.deliveryFee}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase">Discount</p>
                  <p className="text-sm font-semibold text-red-600">€{order.discount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Customer</p>
                  <p className="font-semibold">{order.customer?.name}</p>
                  <p className="text-xs text-gray-600">{order.customer?.email}</p>
                  <p className="text-xs text-gray-600">{order.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Delivery</p>
                  <p className="font-semibold">{new Date(order.deliveryTime).toLocaleString()}</p>
                  {order.notes && <p className="text-xs italic text-gray-600 mt-1">Note: {order.notes}</p>}
                </div>
                
              </div>

              {/* Items & Offers Combined */}
              <div className="space-y-2 pb-3 border-b">
                {order.products && order.products.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Products ({order.products.length})</p>
                    <div className="space-y-1">
                      {order.products.map(p => (
                        <div key={p.id} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <span><strong>{p.name}</strong> ×{p.quantity}</span>
                            <span className="font-semibold">€{p.total}</span>
                          </div>
                          {p.extras && p.extras.length > 0 && (
                            <div className="mt-1 ml-2 space-y-0.5">
                              {p.extras.map((extra: any) => (
                                <div key={extra.id} className="text-gray-600">
                                  • {extra.name} ×{extra.quantity} <span className="text-gray-500">(€{extra.price})</span>
                                </div>
                              ))}
                              {p.extrasPrice && Number(p.extrasPrice) > 0 && (
                                <div className="text-gray-700 font-semibold mt-0.5">
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
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Offers ({order.offers.length})</p>
                    <div className="space-y-1">
                      {order.offers.map(o => (
                        <div key={o.id} className="text-xs p-2 bg-purple-50 rounded border border-purple-200">
                          <div className="flex justify-between">
                            <span><strong>{o.name}</strong> ×{o.quantity}</span>
                            <span className="font-semibold">€{o.total}</span>
                          </div>
                          {o.groups && o.groups.length > 0 && (
                            <div className="mt-1 ml-2 text-gray-600">
                              {o.groups.map((g: any) => (
                                <div key={g.groupId}>{g.groupName}: <strong>{g.selectedItem?.name}</strong></div>
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
                  <p className="text-xs text-gray-600">Subtotal</p>
                  <p className="font-semibold">€{order.subtotal}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Fee</p>
                  <p className="font-semibold">€{order.deliveryFee}</p>
                </div>
                {Number(order.discount) > 0 && (
                  <div>
                    <p className="text-xs text-gray-600">Discount</p>
                    <p className="font-semibold text-red-600">-€{order.discount}</p>
                  </div>
                )}
                <div className="text-right border-l pl-8">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-lg font-bold text-green-600">€{order.total}</p>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function Orders() {
  const [items, setItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
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

  const statusRank: Record<string, number> = {
    [OrderStatus.PENDING]: 1,
    [OrderStatus.CONFIRMED]: 2,
    [OrderStatus.PREPARING]: 3,
    [OrderStatus.READY]: 4,
    [OrderStatus.ON_THE_WAY]: 5,
    [OrderStatus.DELIVERED]: 6,
    [OrderStatus.CANCELLED]: 7,
    [OrderStatus.REJECTED]: 8,
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((o) => {
      if (statusFilter !== 'ALL' && String(o.status) !== statusFilter) return false

      if (!q) return true
      const delivery = String(o.deliveryLocation?.name ?? '').toLowerCase()
      const customer = String(o.customer?.name ?? '').toLowerCase()
      return delivery.includes(q) || customer.includes(q)
    })
  }, [items, search, statusFilter])

  const sortedItems = useMemo(() => {
    if (!statusSort) return filteredItems
    const dir = statusSort === 'asc' ? 1 : -1
    return [...filteredItems].sort((a, b) => {
      const ar = statusRank[String(a.status)] ?? 999
      const br = statusRank[String(b.status)] ?? 999
      if (ar !== br) return (ar - br) * dir
      // fallback: stable-ish tiebreakers
      const at = new Date(a.createdAt || '').getTime()
      const bt = new Date(b.createdAt || '').getTime()
      if (!Number.isNaN(at) && !Number.isNaN(bt) && at !== bt) return (bt - at) // newest first
      return String(a.id ?? '').localeCompare(String(b.id ?? ''))
    })
  }, [filteredItems, statusRank, statusSort])

  const toggleStatusSort = () => {
    setStatusSort((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null))
  }

  const statusRank: Record<string, number> = {
    [OrderStatus.PENDING]: 1,
    [OrderStatus.CONFIRMED]: 2,
    [OrderStatus.PREPARING]: 3,
    [OrderStatus.READY]: 4,
    [OrderStatus.ON_THE_WAY]: 5,
    [OrderStatus.DELIVERED]: 6,
    [OrderStatus.CANCELLED]: 7,
    [OrderStatus.REJECTED]: 8,
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((o) => {
      if (statusFilter !== 'ALL' && String(o.status) !== statusFilter) return false

      if (!q) return true
      const delivery = String(o.deliveryLocation?.name ?? '').toLowerCase()
      const customer = String(o.customer?.name ?? '').toLowerCase()
      return delivery.includes(q) || customer.includes(q)
    })
  }, [items, search, statusFilter])

  const sortedItems = useMemo(() => {
    if (!statusSort) return filteredItems
    const dir = statusSort === 'asc' ? 1 : -1
    return [...filteredItems].sort((a, b) => {
      const ar = statusRank[String(a.status)] ?? 999
      const br = statusRank[String(b.status)] ?? 999
      if (ar !== br) return (ar - br) * dir
      // fallback: stable-ish tiebreakers
      const at = new Date(a.createdAt || '').getTime()
      const bt = new Date(b.createdAt || '').getTime()
      if (!Number.isNaN(at) && !Number.isNaN(bt) && at !== bt) return (bt - at) // newest first
      return String(a.id ?? '').localeCompare(String(b.id ?? ''))
    })
  }, [filteredItems, statusRank, statusSort])

  const toggleStatusSort = () => {
    setStatusSort((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null))
  }

  const acceptOrder = (id: string) => {
    const selectedOrder = items.filter(i => i.id == id)
    console.log(selectedOrder)
  }

  const rejectOrder = async (id: string) => {
    try {
      await updateOrder(id, { status: 'REJECTED' })
      setItems((prev) =>
        prev.map((o) => (String(o.id) === id ? { ...o, status: 'REJECTED' as const } : o))
      )
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
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
      {/* Modal: missing products before confirm */}
      {confirmModal.show && confirmModal.orderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeConfirmModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900">Προϊόντα με ανεπαρκές stock</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 mb-3">Στην παραγγελία ζητήθηκαν περισσότερα από το διαθέσιμο stock για τα ακόλουθα προϊόντα:</p>
              <ul className="space-y-2">
                {confirmModal.missing.map((m) => (
                  <li key={String(m.productId)} className="text-sm p-2 bg-amber-50 border border-amber-200 rounded">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-gray-600">
                      {' '}— ζητήθηκαν: {m.requested}, διαθέσιμα: {m.inStock ?? '—'}, λείπουν: <strong className="text-red-700">{m.missing}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="default" onClick={closeConfirmModal}>Ακύρωση</Button>
              <Button variant="primary" onClick={() => confirmModal.orderId && doConfirmOrder(confirmModal.orderId)}>
                Επιβεβαίωση παρόλα αυτά
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">View and manage customer orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search by delivery location or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:max-w-[220px]">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
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
              <TableHeadCell>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 w-full select-none"
                  onClick={toggleStatusSort}
                  aria-label="Sort by status"
                >
                  <span>Status</span>
                  <FiChevronDown
                    className={`w-4 h-4 transition-transform ${statusSort === 'asc' ? 'rotate-180' : statusSort === 'desc' ? 'rotate-0' : 'opacity-40'}`}
                    aria-hidden="true"
                  />
                </button>
              </TableHeadCell>
              <TableHeadCell>Created At</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 4 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 8 }).map((__, c) => (
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
      ) : sortedItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-400">
            <p>{search.trim() ? 'No matching orders found' : 'No orders found'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                />
              ))}
            </TableBody>
          </Table>

          {/* Enhanced Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <div className="text-gray-600 text-sm mb-2 sm:mb-0">
              Page {page} of {totalPages} | Total: {total}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50 hover:bg-gray-100 transition"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="First page"
              >
                «
              </button>
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50 hover:bg-gray-100 transition"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                ‹
              </button>
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
                    <button
                      key={pn}
                      className={`px-3 py-1 rounded border ${pn === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-100'} transition`}
                      onClick={() => setPage(pn as number)}
                      disabled={pn === page}
                      aria-current={pn === page ? 'page' : undefined}
                    >
                      {pn}
                    </button>
                  )
                )}
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50 hover:bg-gray-100 transition"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                ›
              </button>
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50 hover:bg-gray-100 transition"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                aria-label="Last page"
              >
                »
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}