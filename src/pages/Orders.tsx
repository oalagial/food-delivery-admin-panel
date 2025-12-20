import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiEdit } from 'react-icons/fi'
import { getOrdersList } from '../utils/api'
import type { OrderItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'

export default function Orders(){
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
              <TableHeadCell>Restaurant</TableHeadCell>
              <TableHeadCell>Delivery Location</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Products</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 6 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Restaurant</TableHeadCell>
              <TableHeadCell>Delivery Location</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Products</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(it => (
              <TableRow key={String(it.id)}>
                <TableCell>{it.restaurantId}</TableCell>
                <TableCell>{it.deliveryLocationId}</TableCell>
                <TableCell>{it.status}</TableCell>
                <TableCell>{it.customer?.name}</TableCell>
                <TableCell>{(it.orderProducts || []).length}</TableCell>
                <TableCell>
                  <Link to={`/orders/creation/${it.id}`}><Button size="sm" variant="ghost" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

