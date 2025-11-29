import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit } from 'react-icons/fi'
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link to="/orders/creation"><Button variant="primary" icon={<FiPlus className="w-4 h-4" />}>Create Order</Button></Link>
      </div>

      {loading ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>ID</TableHeadCell>
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
                {Array.from({ length: 7 }).map((__, c) => (
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
              <TableHeadCell>ID</TableHeadCell>
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
                <TableCell>{it.id}</TableCell>
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

