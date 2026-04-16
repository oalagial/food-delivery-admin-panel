import { OrderStatus } from './api'

/** Fallback when GET /orders/statuses fails or returns empty */
export const ORDER_STATUS_FILTER_FALLBACK: string[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
]

const ORDER_STATUS_I18N_KEY: Record<string, string> = {
  [OrderStatus.PENDING]: 'dashboardPage.statusPending',
  [OrderStatus.CONFIRMED]: 'dashboardPage.statusConfirmed',
  [OrderStatus.PREPARING]: 'dashboardPage.statusPreparing',
  [OrderStatus.READY]: 'dashboardPage.statusReady',
  [OrderStatus.ON_THE_WAY]: 'dashboardPage.statusOnTheWay',
  [OrderStatus.DELIVERED]: 'dashboardPage.statusDelivered',
  [OrderStatus.CANCELLED]: 'dashboardPage.statusCancelled',
  [OrderStatus.REJECTED]: 'dashboardPage.statusRejected',
}

export function orderStatusFilterOptionLabel(
  status: string,
  t: (key: string) => string,
): string {
  const key = ORDER_STATUS_I18N_KEY[status]
  return key ? t(key) : status
}

/** Tailwind classes for status badge (table / dropdown trigger). */
export function orderStatusPillClass(status?: string): string {
  if (status === "DELIVERED") return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800 dark:bg-amber-900/40 dark:text-amber-200"
  if (status === "CANCELLED" || status === "REJECTED")
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
  if (status === "CONFIRMED") return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
  return "bg-blue-100 text-blue-800 dark:bg-slate-700 dark:text-slate-200"
}
