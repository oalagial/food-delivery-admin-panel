import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to="/products/creation">
            <Button
              variant="primary"
              icon={<FiShoppingCart className="w-5 h-5" />}
              className="px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base"
            >
              New Product
            </Button>
          </Link>
          <Link to="/menus/creation">
            <Button
              variant="primary"
              icon={<FiList className="w-5 h-5" />}
              className="px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base"
            >
              New Menu
            </Button>
          </Link>
          <Link to="/orders/creation">
            <Button
              variant="primary"
              icon={<FiShoppingCart className="w-5 h-5" />}
              className="px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base"
            >
              New Order
            </Button>
          </Link>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-3 sm:gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
              <FiCoffee className="w-7 h-7 sm:w-8 sm:h-8 text-sky-600" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium dark:text-slate-400">Restaurants</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                {loading ? (
                  <span className="inline-block w-20 sm:w-24">
                    <Skeleton className="h-7 sm:h-8 w-full bg-gray-200" />
                  </span>
                ) : (
                  counts.restaurants
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-3 sm:gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
              <FiShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium dark:text-slate-400">Orders</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                {loading ? (
                  <span className="inline-block w-20 sm:w-24">
                    <Skeleton className="h-7 sm:h-8 w-full bg-gray-200" />
                  </span>
                ) : (
                  counts.orders
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-3 sm:gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
              <FiUsers className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium dark:text-slate-400">Users</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                {loading ? (
                  <span className="inline-block w-20 sm:w-24">
                    <Skeleton className="h-7 sm:h-8 w-full bg-gray-200" />
                  </span>
                ) : (
                  counts.users
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md border-2 flex items-center gap-3 sm:gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg">
              <FiMapPin className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium dark:text-slate-400">Delivery Areas</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                {loading ? (
                  <span className="inline-block w-20 sm:w-24">
                    <Skeleton className="h-7 sm:h-8 w-full bg-gray-200" />
                  </span>
                ) : (
                  counts.deliveryLocations
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">Recent Orders</h2>
          <Link to="/orders">
            <Button variant="ghost" className="self-start sm:self-auto px-4 py-2 text-sm sm:px-6 sm:text-base">
              View All
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-md border shadow-sm dark:bg-slate-900 dark:border-slate-700 overflow-x-auto md:overflow-visible">
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
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                {recentOrders.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    No recent orders
                  </div>
                ) : (
                  recentOrders.map((o, i) => {
                    const id = String(o.id ?? '')
                    const customer = o.customerName ?? o.customer?.name ?? o.email ?? '—'
                    const total =
                      o.total != null
                        ? `$${Number(o.total).toFixed(2)}`
                        : o.amount
                          ? `$${Number(o.amount).toFixed(2)}`
                          : '—'
                    const created = o.createdAt
                      ? new Date(String(o.createdAt)).toLocaleString()
                      : ''
                    const status = o.status ?? ''

                    return (
                      <Card
                        key={String(o.id ?? i)}
                        className="rounded-none border-0 border-b last:border-b-0 bg-white dark:bg-slate-900"
                      >
                        <CardContent className="p-4 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              #{id || '—'}
                            </div>
                            {status ? (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                {status}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-200 truncate">
                            {customer}
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {total}
                            </span>
                            <span>{created}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
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
                        <TableCell>{o.customerName ?? o.customer?.name ?? o.email ?? '—'}</TableCell>
                        <TableCell>
                          {o.total != null
                            ? `$${Number(o.total).toFixed(2)}`
                            : o.amount
                              ? `$${Number(o.amount).toFixed(2)}`
                              : '—'}
                        </TableCell>
                        <TableCell>{o.status ?? ''}</TableCell>
                        <TableCell>
                          {o.createdAt ? new Date(String(o.createdAt)).toLocaleString() : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
