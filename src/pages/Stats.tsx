import { useEffect, useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Skeleton } from '../components/ui/skeleton'
import {
  getStatsOverview,
  getStatsRevenue,
  getStatsProducts,
  getStatsPaymentMethods,
  getStatsTopCustomers,
  getRestaurantsList,
  type StatsParams,
  type StatsOverviewResponse,
  type StatsRevenueItem,
  type StatsProductItem,
  type StatsPaymentMethodItem,
  type StatsTopCustomerItem,
  type Restaurant,
} from '../utils/api'
import { FiTrendingUp, FiShoppingCart, FiUsers, FiPercent, FiDollarSign } from 'react-icons/fi'

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1']
const PAYMENT_COLORS = {
  CASH: '#10b981',
  CARD: '#3b82f6',
  ONLINE: '#8b5cf6',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function getDefaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 1)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

/** Format period labels for chart axis: "2026-W07" → "Week 7 Feb", "2026-02-15" → "15 Feb" */
function formatPeriodLabel(period: string): string {
  if (!period) return period
  // Week format: 2026-W07
  const weekMatch = period.match(/^(\d{4})-W(\d{1,2})$/)
  if (weekMatch) {
    const [, year, weekNum] = weekMatch
    const week = parseInt(weekNum, 10)
    // Get Monday of ISO week (week 1 = week containing Jan 4)
    const jan4 = new Date(parseInt(year!, 10), 0, 4)
    const dayOfWeek = jan4.getDay() || 7 // Mon=1, Sun=7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - dayOfWeek + 1)
    const weekStart = new Date(mondayWeek1)
    weekStart.setDate(mondayWeek1.getDate() + (week - 1) * 7)
    const monthName = weekStart.toLocaleDateString('en-GB', { month: 'short' })
    return `Week ${week} ${monthName}`
  }
  // Day format: 2026-02-15
  const dayMatch = period.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dayMatch) {
    const [, y, m, d] = dayMatch
    const date = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10))
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }
  // Month format: 2026-01
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/)
  if (monthMatch) {
    const [, y, m] = monthMatch
    const date = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, 1)
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }
  return period
}

export default function Stats() {
  const { from: defaultFrom, to: defaultTo } = getDefaultDateRange()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [overview, setOverview] = useState<StatsOverviewResponse | null>(null)
  const [revenue, setRevenue] = useState<StatsRevenueItem[]>([])
  const [products, setProducts] = useState<StatsProductItem[]>([])
  const [paymentMethods, setPaymentMethods] = useState<StatsPaymentMethodItem[]>([])
  const [topCustomers, setTopCustomers] = useState<StatsTopCustomerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const params: StatsParams = useMemo(
    () => ({
      from,
      to,
      restaurantId: restaurantId ? Number(restaurantId) : undefined,
      groupBy,
    }),
    [from, to, restaurantId, groupBy]
  )

  useEffect(() => {
    let mounted = true
    getRestaurantsList()
      .then((list) => {
        if (mounted) setRestaurants(list)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    Promise.all([
      getStatsOverview(params),
      getStatsRevenue(params),
      getStatsProducts(params),
      getStatsPaymentMethods(params),
      getStatsTopCustomers(params),
    ])
      .then(([overviewRes, revenueRes, productsRes, paymentRes, customersRes]) => {
        if (!mounted) return
        setOverview(overviewRes)
        setRevenue(revenueRes)
        setProducts(productsRes)
        setPaymentMethods(paymentRes)
        setTopCustomers(customersRes)
      })
      .catch((err) => {
        if (mounted) setError(String(err?.message ?? err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [params])

  const pieData = useMemo(
    () =>
      paymentMethods.map((p) => ({
        name: p.method,
        value: p.total,
        count: p.count,
      })),
    [paymentMethods]
  )

  const productChartData = useMemo(
    () =>
      products.slice(0, 10).map((p) => ({
        name: p.productName.length > 15 ? p.productName.slice(0, 15) + '…' : p.productName,
        fullName: p.productName,
        quantity: p.quantity,
        revenue: p.revenue,
      })),
    [products]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Statistics</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics and insights for your business</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from" className="text-xs font-semibold text-gray-700">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-36 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to" className="text-xs font-semibold text-gray-700">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-36 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restaurant" className="text-xs font-semibold text-gray-700">Restaurant</Label>
            <Select
              id="restaurant"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-44 text-sm"
            >
              <option value="">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={String(r.id)} value={String(r.id)}>
                  {r.name ?? r.id}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="groupBy" className="text-xs font-semibold text-gray-700">Group by</Label>
            <Select
              id="groupBy"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="w-28 text-sm"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Overview KPI Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden shadow-md">
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          ) : overview ? (
            <>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <FiDollarSign className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-amber-100 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(overview.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <FiShoppingCart className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{overview.totalOrders}</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <FiTrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-100 mb-1">Avg Order Value</p>
                  <p className="text-3xl font-bold">{formatCurrency(overview.averageOrderValue)}</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <FiUsers className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-violet-100 mb-1">New Customers</p>
                  <p className="text-3xl font-bold">{overview.newCustomers}</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-0 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <FiPercent className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-rose-100 mb-1">Delivery Rate</p>
                  <p className="text-2xl font-bold">{overview.deliveryRate.toFixed(1)}%</p>
                  <p className="text-xs text-rose-200 mt-1">Cancel: {overview.cancellationRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </section>

      {/* Revenue Chart */}
      <section>
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Revenue over time</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Revenue and order count by period</p>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-96 w-full rounded-lg" />
            ) : revenue.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-medium">No revenue data</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your date range</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={revenue} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={formatPeriodLabel}
                    angle={0}
                    textAnchor="middle"
                    height={50}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    tickFormatter={(v) => `€${v}`}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any, name: string | undefined) => {
                      const nameStr = name ?? ''
                      return nameStr === 'revenue'
                        ? [formatCurrency(Number(value ?? 0)), 'Revenue']
                        : [value ?? 0, 'Orders']
                    }}
                    labelFormatter={(label) => `Period: ${formatPeriodLabel(label)}`}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="revenue" 
                    fill="url(#revenueGradient)" 
                    radius={[8, 8, 0, 0]} 
                    name="Revenue"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="orderCount" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Orders"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Top Products</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Best selling products by quantity sold</p>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-96 w-full rounded-lg" />
            ) : productChartData.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-medium">No product data</p>
                  <p className="text-sm text-gray-400 mt-1">No products sold in this period</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productChartData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 10 }}>
                  <defs>
                    <linearGradient id="productGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    tickFormatter={(v) => v.toString()}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={110} 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any) => [value ?? 0, 'Quantity']}
                    labelFormatter={(_, payload) => {
                      const data = payload?.[0]?.payload as { fullName?: string; revenue?: number } | undefined
                      return (
                        <div>
                          <p className="font-semibold">{data?.fullName ?? ''}</p>
                          {data?.revenue != null && (
                            <p className="text-xs text-gray-500">Revenue: {formatCurrency(data.revenue)}</p>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill="url(#productGradient)" 
                    radius={[0, 8, 8, 0]} 
                    name="Quantity"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Payment Methods</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Revenue distribution by payment type</p>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-96 w-full rounded-lg" />
            ) : pieData.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-medium">No payment data</p>
                  <p className="text-sm text-gray-400 mt-1">No payments recorded in this period</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      {pieData.map((item, index) => {
                        const color = PAYMENT_COLORS[item.name as keyof typeof PAYMENT_COLORS] || CHART_COLORS[index % CHART_COLORS.length]
                        return (
                          <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={1}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0.7}/>
                          </linearGradient>
                        )
                      })}
                    </defs>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={false}
                    >
                      {pieData.map((item, index) => {
                        const color = PAYMENT_COLORS[item.name as keyof typeof PAYMENT_COLORS] || CHART_COLORS[index % CHART_COLORS.length]
                        return (
                          <Cell key={`cell-${index}`} fill={`url(#pieGradient-${index})`} stroke="#fff" strokeWidth={2} />
                        )
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any, name: string | undefined, props: any) => {
                        const count = props?.payload?.count ?? 0
                        const nameStr = name ?? 'Unknown'
                        return [formatCurrency(Number(value ?? 0)), `${nameStr} (${count} orders)`]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  {pieData.map((item, index) => {
                    const itemColor = PAYMENT_COLORS[item.name as keyof typeof PAYMENT_COLORS] || CHART_COLORS[index % CHART_COLORS.length]
                    const total = pieData.reduce((sum, p) => sum + p.value, 0)
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
                    return (
                      <div key={item.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: itemColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-600">{formatCurrency(item.value)}</p>
                          <p className="text-xs text-gray-500">{percentage}% • {item.count} orders</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <section>
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Top Customers</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Most valuable customers by total revenue</p>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : topCustomers.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-medium">No customer data</p>
                  <p className="text-sm text-gray-400 mt-1">No customers found in this period</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.customerId}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{customer.customerName}</h3>
                          <p className="text-sm text-gray-600 truncate">{customer.customerEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">{customer.customerPhone}</p>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(customer.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Orders</p>
                            <p className="text-lg font-bold text-purple-600">{customer.orderCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Avg Order</p>
                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(customer.averageOrderValue)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
