import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { getOrdersList } from '../utils/api'
import type { OrderItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { OrderTableSortHeadCell } from '../components/OrderTableSortHeadCell'
import { OrderDetailsPanel } from '../components/OrderDetailsPanel'
import {
  toggleOrderTableSort,
  type OrderTableSortDir,
  type OrderTableSortKey,
} from '../utils/orderTableSort'
import i18n from '../i18n'

function formatOrderBusinessDate(value: string | number | undefined | null): string {
  const dash = i18n.t('common.emDash')
  if (value == null || value === '') return dash
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? dash : d.toLocaleDateString()
}

type OrderRowProps = {
  order: OrderItem
  isOpen: boolean
  onToggle: () => void
}

type OrderCardProps = OrderRowProps

function OrderRow({ order, isOpen, onToggle }: OrderRowProps) {
  const { t } = useTranslation()
  const dash = t('common.emDash')
  return (
    <>
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
            {order.orderNumber != null ? order.orderNumber : dash}
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
          <p className="text-xs">{t('ordersPage.subtotalLine', { amount: order.subtotal })}</p>
        </TableCell>
        <TableCell>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              order.status === 'DELIVERED'
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
        </TableCell>
        <TableCell>
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {isOpen ? t('common.hide') : t('common.details')}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isOpen && (
        <TableRow className="bg-gray-50 dark:bg-slate-900">
          <TableCell colSpan={9} className="text-left align-top">
            <OrderDetailsPanel order={order} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function OrderCard({ order, isOpen, onToggle }: OrderCardProps) {
  const { t } = useTranslation()
  const dash = t('common.emDash')
  return (
    <Card className="shadow-sm">
      <CardHeader
        className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
        onClick={onToggle}
      >
        <div>
          <CardTitle className="text-base font-semibold">
            {t('ordersPage.orderIdCard', { id: String(order.id ?? '') })}{' '}
            <span className="text-xs font-normal">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
            </span>
          </CardTitle>
          <p className="text-xs">
            {order.restaurant?.name ?? ''} • {order.deliveryLocation?.name ?? ''}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('ordersPage.orderNumberLine', {
              num: order.orderNumber != null ? String(order.orderNumber) : dash,
              date: formatOrderBusinessDate(order.orderDate),
            })}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            order.status === 'DELIVERED'
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
          {t('ordersPage.totalLine')}{' '}
          <span className="font-semibold text-green-600">€{order.total}</span>{' '}
          <span>{t('ordersPage.subtotalParen', { amount: order.subtotal })}</span>
        </p>
      </CardContent>

      <CardFooter className="flex justify-start items-center px-4 pb-4 pt-0">
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {isOpen ? t('common.hideDetails') : t('common.details')}
        </Button>
      </CardFooter>

      {isOpen && (
        <div className="border-t border-gray-100">
          <OrderDetailsPanel order={order} />
        </div>
      )}
    </Card>
  )
}

export default function Orders() {
  const { t } = useTranslation()
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
    setOpenRowId((prev) => (prev === String(id) ? null : String(id)))
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    getOrdersList(page, limit, { sortField: sortKey, sortDir })
      .then((res: unknown) => {
        if (!mounted) return
        let data: OrderItem[]
        let totalItems: number
        let totalPagesVal: number
        if (res && typeof res === 'object' && 'data' in res && 'totalPages' in res) {
          const r = res as { data: OrderItem[]; total: number; totalPages: number }
          data = r.data
          totalItems = r.total
          totalPagesVal = r.totalPages
        } else {
          data = Array.isArray(res)
            ? (res as OrderItem[])
            : (res as { data?: OrderItem[] })?.data ?? Object.values((res as object) ?? {})
          totalItems = data.length
          totalPagesVal = 1
        }
        setItems(data)
        setTotal(totalItems)
        setTotalPages(totalPagesVal)
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
  }, [page, limit, sortKey, sortDir])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('ordersPage.title')}</h1>
        <p className="text-gray-600 mt-1 dark:text-slate-400">{t('ordersPage.subtitle')}</p>
      </div>

      {loading ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>{t('ordersPage.orderId')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.orderNumber')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.orderDate')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.restaurant')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.deliveryLocation')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.customer')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.price')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.status')}</TableHeadCell>
              <TableHeadCell>{t('ordersPage.detailsCol')}</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 4 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 9 }).map((__, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full bg-gray-200" />
                  </TableCell>
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
            <p>{t('ordersPage.noOrders')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((it) => (
              <OrderCard
                key={String(it.id)}
                order={it}
                isOpen={openRowId === String(it.id)}
                onToggle={() => toggleRow(it.id ?? '')}
              />
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableRow>
                  <OrderTableSortHeadCell
                    label={t('ordersPage.orderId')}
                    colKey="createdAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.orderNumber')}
                    colKey="orderNumber"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.orderDate')}
                    colKey="orderDate"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.restaurant')}
                    colKey="restaurant"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.deliveryLocation')}
                    colKey="deliveryLocation"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.customer')}
                    colKey="customer"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.price')}
                    colKey="price"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <OrderTableSortHeadCell
                    label={t('ordersPage.status')}
                    colKey="status"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSortColumn}
                  />
                  <TableHeadCell>{t('ordersPage.detailsCol')}</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it) => (
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

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <div className="text-gray-600 text-sm mb-2 sm:mb-0">
              {t('ordersPage.pagination', { page, totalPages, total })}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label={t('common.firstPage')}
              >
                «
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label={t('common.prevPage')}
              >
                ‹
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((pn) => pn === 1 || pn === totalPages || (pn >= page - 2 && pn <= page + 2))
                .reduce(
                  (arr, pn, idx, src) => {
                    if (idx > 0 && pn - src[idx - 1] > 1) arr.push('ellipsis')
                    arr.push(pn)
                    return arr
                  },
                  [] as (number | 'ellipsis')[]
                )
                .map((pn, idx) =>
                  pn === 'ellipsis' ? (
                    <span key={'ellipsis-' + idx} className="px-2 text-gray-400">
                      …
                    </span>
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label={t('common.nextPage')}
              >
                ›
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                aria-label={t('common.lastPage')}
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
