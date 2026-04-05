import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

export type OrderDetailsPanelProductExtra = {
  id?: string | number
  name?: string
  quantity?: number | string
  price?: number | string
}

export type OrderDetailsPanelOrder = {
  id?: string | number
  orderNumber?: number | string
  orderDate?: string
  createdAt?: string | number
  restaurant?: { name?: string }
  deliveryLocation?: { name?: string }
  paymentMethod?: string
  paymentStatus?: string
  deliveryFee?: number | string | null
  discount?: number | string | null
  deliveryTime?: string
  notes?: string
  customer?: { name?: string; email?: string; phone?: string }
  customerName?: string
  email?: string
  products?: Array<{
    id?: string | number
    name?: string
    quantity?: number | string
    total?: number | string
    extrasPrice?: number | string | null
    extras?: OrderDetailsPanelProductExtra[]
    removedIngredients?: string[]
    removed_ingredients?: string[]
  }>
  offers?: Array<{
    id?: string | number
    name?: string
    quantity?: number | string
    total?: number | string
    groups?: Array<{
      groupId?: string | number
      groupName?: string
      selectedItem?: { name?: string }
    }>
  }>
  subtotal?: number | string | null
  total?: number | string | null
  amount?: number | string | null
}

function formatMoney(value?: number | string | null): string {
  if (value == null) return '-'
  const n = Number(value)
  return Number.isFinite(n) ? `€${n.toFixed(2)}` : '-'
}

function formatBusinessDate(value: string | number | undefined | null): string {
  const dash = i18n.t('common.emDash')
  if (value == null || value === '') return dash
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? dash : d.toLocaleDateString()
}

export function OrderDetailsPanel({ order }: { order: OrderDetailsPanelOrder }) {
  const { t } = useTranslation()

  return (
    <div className="p-4 space-y-4 text-sm text-left">
      <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 dark:border-slate-600 dark:bg-slate-800/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('orderDetails.summaryHeading')}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('ordersPage.orderId')}
            </p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
              {order.id != null && String(order.id) !== '' ? String(order.id) : i18n.t('common.emDash')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('ordersPage.orderNumber')}
            </p>
            <p className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {order.orderNumber != null ? String(order.orderNumber) : i18n.t('common.emDash')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('ordersPage.orderDate')}
            </p>
            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
              {formatBusinessDate(order.orderDate)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('orderDetails.receivedAt')}
            </p>
            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
              {order.createdAt ? new Date(String(order.createdAt)).toLocaleString() : i18n.t('common.emDash')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('ordersPage.restaurant')}
            </p>
            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
              {order.restaurant?.name ?? i18n.t('common.emDash')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('ordersPage.deliveryLocation')}
            </p>
            <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
              {order.deliveryLocation?.name ?? i18n.t('common.emDash')}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-3 dark:border-slate-600">
          <p className="text-xs uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            {t('orderDetails.customer')}
          </p>
          <p className="mt-1 font-semibold text-base text-slate-900 dark:text-slate-100">
            {order.customer?.name ?? order.customerName ?? i18n.t('common.emDash')}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {order.customer?.email ?? order.email ?? i18n.t('common.emDash')}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {order.customer?.phone ?? i18n.t('common.emDash')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b pb-3 sm:grid-cols-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('orderDetails.payment')}
          </p>
          <p className="mt-0.5 text-sm font-semibold">{order.paymentMethod ?? '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('orderDetails.paymentStatus')}
          </p>
          <span className="mt-0.5 inline-block rounded bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
            {order.paymentStatus ?? '-'}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('orderDetails.fee')}
          </p>
          <p className="mt-0.5 text-sm font-semibold">{formatMoney(order.deliveryFee)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('orderDetails.discount')}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-red-600">{formatMoney(order.discount)}</p>
        </div>
        <div className="text-left sm:col-span-1">
          <p className="text-xs uppercase font-semibold tracking-wide text-slate-600 dark:text-slate-400">
            {t('orderDetails.delivery')}
          </p>
          <p className="mt-0.5 font-semibold text-sm">
            {order.deliveryTime ? new Date(order.deliveryTime).toLocaleString() : '-'}
          </p>
          {order.notes ? (
            <p className="mt-1 text-xs italic">{t('orderDetails.noteWithText', { text: order.notes })}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 pb-3 border-b text-left">
        <div className="space-y-3">
          {order.products && order.products.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2 tracking-wide text-slate-600 dark:text-slate-400">
                {t('orderDetails.productsSection', { count: order.products.length })}
              </p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 list-none p-0 m-0">
                {order.products.map((p) => {
                  const removed = (p.removedIngredients ?? p.removed_ingredients ?? []) as string[]
                  const hasRemoved = Array.isArray(removed) && removed.length > 0
                  return (
                    <li
                      key={String(p.id ?? '')}
                      className="rounded-lg border border-slate-200 bg-gray-50 p-3 dark:border-slate-600 dark:bg-slate-800/80"
                    >
                      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-start">
                        <div className="min-w-0">
                          <p className="text-base sm:text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                            {p.name ?? ''}
                          </p>
                          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
                            ×{String(p.quantity ?? '')}
                          </p>
                        </div>
                        <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatMoney(p.total ?? null)}
                        </p>
                      </div>
                      {hasRemoved ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                          {t('orderDetails.without')} {removed.join(', ')}
                        </p>
                      ) : null}
                      {p.extras && p.extras.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs leading-relaxed border-t border-slate-200/80 dark:border-slate-600 pt-2">
                          {p.extras.map((extra) => (
                            <div key={String(extra.id ?? '')}>
                              • {extra.name ?? ''}{' '}
                              <span className="font-semibold tabular-nums">×{String(extra.quantity ?? '')}</span>{' '}
                              <span>({formatMoney(extra.price ?? null)})</span>
                            </div>
                          ))}
                          {p.extrasPrice != null && Number(p.extrasPrice) > 0 && (
                            <div className="font-semibold text-sm pt-0.5">
                              {t('orderDetails.extrasTotal')} {formatMoney(p.extrasPrice)}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {order.offers && order.offers.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2 tracking-wide text-slate-600 dark:text-slate-400">
                {t('orderDetails.offersSection', { count: order.offers.length })}
              </p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 list-none p-0 m-0">
                {order.offers.map((o) => (
                  <li
                    key={String(o.id ?? '')}
                    className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/30"
                  >
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-start">
                      <div className="min-w-0">
                        <p className="text-base sm:text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                          {o.name ?? ''}
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-slate-100">
                          ×{String(o.quantity ?? '')}
                        </p>
                      </div>
                      <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatMoney(o.total ?? null)}
                      </p>
                    </div>
                    {o.groups && o.groups.length > 0 && (
                      <div className="mt-2 text-xs space-y-0.5 leading-relaxed border-t border-purple-200/80 dark:border-purple-900 pt-2">
                        {o.groups.map((g) => (
                          <div key={String(g.groupId ?? '')}>
                            {g.groupName ?? ''}: <strong>{g.selectedItem?.name ?? ''}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-6 sm:gap-10 text-sm">
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('orderDetails.subtotal')}</p>
          <p className="font-semibold text-base">{formatMoney(order.subtotal)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('orderDetails.fee')}</p>
          <p className="font-semibold text-base">{formatMoney(order.deliveryFee)}</p>
        </div>
        {Number(order.discount ?? 0) > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-600 dark:text-slate-400">{t('orderDetails.discount')}</p>
            <p className="font-semibold text-base text-red-600">-{formatMoney(order.discount)}</p>
          </div>
        )}
        <div className="text-right border-l border-slate-200 dark:border-slate-600 pl-6 sm:pl-10">
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('orderDetails.total')}</p>
          <p className="text-xl font-bold text-green-600">{formatMoney(order.total ?? order.amount)}</p>
        </div>
      </div>
    </div>
  )
}
