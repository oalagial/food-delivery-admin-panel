import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FiEdit, FiChevronDown, FiTrash, FiCheck, FiCheckCircle, FiSlash } from 'react-icons/fi'
import { getOrdersList, OrderStatus, updateOrder } from '../utils/api'
import type { OrderItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardContent } from '../components/ui/card'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'

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
        <TableCell>{order.restaurantDeliveryLocation?.restaurant?.name ?? ''}</TableCell>
        <TableCell>{order.restaurantDeliveryLocation?.deliveryLocation?.name ?? ''}</TableCell>
        <TableCell>{order.customer?.name}</TableCell>
        <TableCell>
          <p className="font-semibold">€{order.total}</p>
          <p className="text-xs text-gray-600">Subtotal: €{order.subtotal}</p>
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
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
          <TableCell colSpan={7}>
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
                        <div key={p.id} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                          <span><strong>{p.name}</strong> ×{p.quantity}</span>
                          <span className="font-semibold">€{p.total}</span>
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

export default function Orders(){
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const toggleRow = (id: string | number) => {
    setOpenRowId(prev => (prev === String(id) ? null : String(id)));
  }

  const acceptOrder = (id: string) => {
    const selectedOrder = items.filter(i => i.id == id);
    
    console.log(selectedOrder)
  }

  const rejectOrder = (id: string) => {
    console.log('Reject Id:', id)
  }


  useEffect(()=>{
    let mounted = true
    getOrdersList().then(d=>{ if(mounted) setItems(d)}).catch(e=>{ if(mounted) setError(String(e)) }).finally(()=>{ if(mounted) setLoading(false) })
    return ()=>{ mounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">View and manage customer orders</p>
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
          <CardContent className="p-8 text-center text-gray-400">
            <p>No orders found</p>
          </CardContent>
        </Card>
      ) : (
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
                onToggle={() => toggleRow(it.id)}
                onAccept={acceptOrder}
                onReject={rejectOrder}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}