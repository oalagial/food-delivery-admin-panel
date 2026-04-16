export type OrderTableSortKey =
  | 'createdAt'
  | 'orderNumber'
  | 'orderDate'
  | 'restaurant'
  | 'deliveryLocation'
  | 'customer'
  | 'price'
  | 'paymentStatus'
  | 'status'

export type OrderTableSortDir = 'asc' | 'desc'

const DEFAULT_DESC: OrderTableSortKey[] = [
  'createdAt',
  'orderDate',
  'orderNumber',
  'price',
]

export function toggleOrderTableSort(
  currentKey: OrderTableSortKey,
  currentDir: OrderTableSortDir,
  clicked: OrderTableSortKey
): { key: OrderTableSortKey; dir: OrderTableSortDir } {
  if (currentKey === clicked) {
    return { key: clicked, dir: currentDir === 'asc' ? 'desc' : 'asc' }
  }
  return {
    key: clicked,
    dir: DEFAULT_DESC.includes(clicked) ? 'desc' : 'asc',
  }
}

type SortableOrder = {
  id?: string | number
  createdAt?: string | number
  orderNumber?: number | string
  orderDate?: string | number
  restaurant?: { name?: string }
  deliveryLocation?: { name?: string }
  customer?: { name?: string }
  customerName?: string
  email?: string
  total?: number | string | null
  amount?: number | string | null
  paymentStatus?: string
  status?: string
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function lc(v: unknown): string {
  return v == null ? '' : String(v).toLowerCase()
}

function timeCmp(a: SortableOrder, b: SortableOrder): number {
  const ta = new Date(String(a.createdAt ?? '')).getTime()
  const tb = new Date(String(b.createdAt ?? '')).getTime()
  const da = Number.isFinite(ta) ? ta : 0
  const db = Number.isFinite(tb) ? tb : 0
  return da < db ? -1 : da > db ? 1 : 0
}

function orderDateCmp(a: SortableOrder, b: SortableOrder): number {
  const ta = new Date(String(a.orderDate ?? '')).getTime()
  const tb = new Date(String(b.orderDate ?? '')).getTime()
  const da = Number.isFinite(ta) ? ta : 0
  const db = Number.isFinite(tb) ? tb : 0
  return da < db ? -1 : da > db ? 1 : 0
}

function customerKey(o: SortableOrder): string {
  return lc(o.customer?.name ?? o.customerName ?? o.email)
}

export function sortOrdersByColumn<T extends SortableOrder>(
  orders: T[],
  key: OrderTableSortKey,
  dir: OrderTableSortDir
): T[] {
  const mult = dir === 'asc' ? 1 : -1
  return [...orders].sort((a, b) => {
    let c = 0
    switch (key) {
      case 'createdAt':
        c = timeCmp(a, b)
        break
      case 'orderNumber':
        c = num(a.orderNumber) - num(b.orderNumber)
        break
      case 'orderDate':
        c = orderDateCmp(a, b)
        break
      case 'restaurant':
        c = lc(a.restaurant?.name).localeCompare(lc(b.restaurant?.name))
        break
      case 'deliveryLocation':
        c = lc(a.deliveryLocation?.name).localeCompare(lc(b.deliveryLocation?.name))
        break
      case 'customer':
        c = customerKey(a).localeCompare(customerKey(b))
        break
      case 'price':
        c = num(a.total ?? a.amount) - num(b.total ?? b.amount)
        break
      case 'paymentStatus':
        c = lc(a.paymentStatus).localeCompare(lc(b.paymentStatus))
        break
      case 'status':
        c = lc(a.status).localeCompare(lc(b.status))
        break
      default:
        c = 0
    }
    return c * mult
  })
}
