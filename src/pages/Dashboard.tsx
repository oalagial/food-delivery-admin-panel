import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FiShoppingCart, FiCoffee, FiUsers, FiMapPin, FiList } from 'react-icons/fi'
import Table, { TableBody, TableHead, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'

import { API_BASE } from '../config'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ restaurants: 0, orders: 0, users: 0, deliveryLocations: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    Promise.allSettled([
      fetch(`${API_BASE}/restaurants`).then((r) => r.json()),
      fetch(`${API_BASE}/orders`).then((r) => r.json()),
      fetch(`${API_BASE}/users`).then((r) => r.json()),
      fetch(`${API_BASE}/delivery-locations`).then((r) => r.json()),
    ])
      .then((results) => {
        if (!mounted) return
        try {
          const [rRes, oRes, uRes, dRes] = results
          const restaurants = rRes.status === 'fulfilled' ? (Array.isArray(rRes.value) ? rRes.value : rRes.value?.data ?? []) : []
          const orders = oRes.status === 'fulfilled' ? (Array.isArray(oRes.value) ? oRes.value : oRes.value?.data ?? []) : []
          const users = uRes.status === 'fulfilled' ? (Array.isArray(uRes.value) ? uRes.value : uRes.value?.data ?? []) : []
          const dlocs = dRes.status === 'fulfilled' ? (Array.isArray(dRes.value) ? dRes.value : dRes.value?.data ?? []) : []

          setCounts({ restaurants: restaurants.length, orders: orders.length, users: users.length, deliveryLocations: dlocs.length })
          setRecentOrders(Array.isArray(orders) ? orders.slice(0, 6) : [])
        } catch (e: unknown) {
          setError(String(e))
        }
      })
      .catch((e) => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link to="/products/creation"><Button variant="primary" icon={<FiShoppingCart className="w-5 h-5" />} className="px-6 py-3 text-base">New Product</Button></Link>
          <Link to="/menus/creation"><Button variant="primary" icon={<FiList className="w-5 h-5" />} className="px-6 py-3 text-base">New Menu</Button></Link>
          <Link to="/orders/creation"><Button variant="primary" icon={<FiShoppingCart className="w-5 h-5" />} className="px-6 py-3 text-base">New Order</Button></Link>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-lg"><FiCoffee className="w-8 h-8 text-sky-600" /></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Restaurants</div>
              <div className="text-3xl font-bold text-gray-900">{loading ? <span className="inline-block w-24"><Skeleton className="h-8 w-full bg-gray-200" /></span> : counts.restaurants}</div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-4">
            <div className="p-4 bg-green-50 rounded-lg"><FiShoppingCart className="w-8 h-8 text-green-600" /></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Orders</div>
              <div className="text-3xl font-bold text-gray-900">{loading ? <span className="inline-block w-24"><Skeleton className="h-8 w-full bg-gray-200" /></span> : counts.orders}</div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-4">
            <div className="p-4 bg-purple-50 rounded-lg"><FiUsers className="w-8 h-8 text-purple-600" /></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Users</div>
              <div className="text-3xl font-bold text-gray-900">{loading ? <span className="inline-block w-24"><Skeleton className="h-8 w-full bg-gray-200" /></span> : counts.users}</div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg"><FiMapPin className="w-8 h-8 text-yellow-600" /></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Delivery Areas</div>
              <div className="text-3xl font-bold text-gray-900">{loading ? <span className="inline-block w-24"><Skeleton className="h-8 w-full bg-gray-200" /></span> : counts.deliveryLocations}</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
          <Link to="/orders"><Button variant="ghost" className="px-6 py-2 text-base">View All</Button></Link>
        </div>

        <div className="bg-white rounded-md border shadow-sm">
          {loading ? (
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>#</TableHeadCell>
                  <TableHeadCell>Customer</TableHeadCell>
                  <TableHeadCell>Total</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Created</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {Array.from({ length: 5 }).map((_, r) => (
                  <TableRow key={r} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, c) => (
                      <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : error ? (
            <div className="p-4 text-red-600">{error}</div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>#</TableHeadCell>
                  <TableHeadCell>Customer</TableHeadCell>
                  <TableHeadCell>Total</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Created</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>No recent orders</TableCell>
                  </TableRow>
                )}
                {recentOrders.map((o, i) => (
                  <TableRow key={String(o.id ?? i)}>
                    <TableCell>{String(o.id ?? '')}</TableCell>
                    <TableCell>{o.customerName ?? o.customer ?? o.email ?? '—'}</TableCell>
                    <TableCell>{o.total != null ? `$${Number(o.total).toFixed(2)}` : (o.amount ? `$${Number(o.amount).toFixed(2)}` : '—')}</TableCell>
                    <TableCell>{o.status ?? ''}</TableCell>
                    <TableCell>{o.createdAt ? new Date(String(o.createdAt)).toLocaleString() : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  )
}
