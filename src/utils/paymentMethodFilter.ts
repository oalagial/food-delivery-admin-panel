import { PAYMENT_METHODS, PaymentMethod } from './api'

/** Static options for payment method filters (no list API endpoint). */
export const PAYMENT_METHOD_FILTER_OPTIONS: string[] = [...PAYMENT_METHODS]

const PAYMENT_METHOD_I18N_KEY: Record<string, string> = {
  [PaymentMethod.CASH]: 'common.paymentMethodCash',
  [PaymentMethod.CARD]: 'common.paymentMethodCard',
  [PaymentMethod.ONLINE]: 'common.paymentMethodOnline',
}

export function paymentMethodFilterOptionLabel(
  method: string,
  t: (key: string) => string,
): string {
  const key = PAYMENT_METHOD_I18N_KEY[method]
  return key ? t(key) : method
}
