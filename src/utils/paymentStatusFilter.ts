import { PaymentStatus } from './api'

/** Fallback when GET /orders/payment-statuses fails or returns empty */
export const PAYMENT_STATUS_FILTER_FALLBACK: string[] = [
  PaymentStatus.UNPAID,
  PaymentStatus.PAID,
  PaymentStatus.FAILED,
  PaymentStatus.REFUNDED,
]

const PAYMENT_STATUS_I18N_KEY: Record<string, string> = {
  [PaymentStatus.UNPAID]: 'common.paymentStatusUnpaid',
  [PaymentStatus.PAID]: 'common.paymentStatusPaid',
  [PaymentStatus.FAILED]: 'common.paymentStatusFailed',
  [PaymentStatus.REFUNDED]: 'common.paymentStatusRefunded',
}

export function paymentStatusFilterOptionLabel(
  status: string,
  t: (key: string) => string,
): string {
  const key = PAYMENT_STATUS_I18N_KEY[status]
  return key ? t(key) : status
}

/** Tailwind classes for payment status pill (filters / table). */
export function paymentStatusPillClass(status?: string): string {
  if (status === 'PAID') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
  if (status === 'UNPAID') return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
  if (status === 'FAILED') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  if (status === 'REFUNDED') return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
  return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
}
