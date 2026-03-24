import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle, FiRotateCw, FiAlertCircle } from 'react-icons/fi'
import {
  getCouponsList,
  restoreCoupon,
  deleteCoupon,
  updateCoupon,
  type Coupon,
} from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

function formatDiscount(coupon: Coupon): string {
  const val = Number(coupon.value)
  if (coupon.type === 'PERCENTAGE') return `${val}%`
  return `${val} €`
}

type CouponRowProps = {
  coupon: Coupon
  onDelete?: (id: number, name: string) => void
  onRestore?: (id: number, name: string) => void
  onToggleActive?: (c: Coupon) => void
  isDeleted?: boolean
  isDeleting?: boolean
}

function CouponRow({ coupon, onDelete, onRestore, onToggleActive, isDeleted = false, isDeleting = false }: CouponRowProps) {
  const { t } = useTranslation()
  const anyCoupon = coupon as unknown as Record<string, unknown>
  const deletedBy = anyCoupon.deletedBy
  const scope = coupon.customerId != null ? t('couponsPage.scopePerCustomer') : t('common.general')

  return (
    <TableRow className={isDeleted ? 'bg-gray-50 opacity-75 dark:bg-slate-800' : ''}>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        <span className="font-mono font-medium">{coupon.code}</span>
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>{coupon.name}</TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>{scope}</TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.restaurantId == null ? t('common.emDash') : coupon.restaurant?.name ?? t('common.idDisplay', { id: coupon.restaurantId })}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.customerId == null ? '—' : (() => {
          const c = coupon.customer
          if (!c) return t('common.idDisplay', { id: coupon.customerId })
          const name = c.name?.trim()
          const email = c.email?.trim()
          if (name && email) return `${name} (${email})`
          return email || name || t('common.idDisplay', { id: coupon.customerId })
        })()}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {formatDiscount(coupon)}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : t('common.emDash')}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString() : t('common.emDash')}
      </TableCell>
      {!isDeleted && (
        <TableCell className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="inline-flex items-center justify-center"
            onClick={() => onToggleActive?.(coupon)}
            aria-label={coupon.isActive ? t('common.deactivate') : t('common.activate')}
            icon={
              coupon.isActive
                ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label={t('common.active')} />
                : <FiXCircle className="w-5 h-5 text-red-500" aria-label={t('common.inactive')} />
            }
          />
        </TableCell>
      )}
      {isDeleted && (
        <TableCell className="text-gray-500 text-sm">{String(deletedBy ?? '')}</TableCell>
      )}
      <TableCell>
        <div className="flex justify-center gap-2">
          {isDeleted ? (
            onRestore && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={() => onRestore(coupon.id, coupon.name)}
                icon={<FiRotateCw className="w-4 h-4" />}
              />
            )
          ) : (
            <>
              <Link to={`/coupons/creation/${coupon.id}`}>
                <Button variant="ghost" size="sm" className="p-2" icon={<FiEdit className="w-4 h-4" />} />
              </Link>
              <Button
                variant="danger"
                size="sm"
                icon={<FiTrash className="w-4 h-4" />}
                onClick={() => onDelete?.(coupon.id, coupon.name)}
                disabled={isDeleting}
              />
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function Coupons() {
  const { t } = useTranslation()
  const [response, setResponse] = useState<{ data: Coupon[]; total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'general' | 'per-customer'>('general')
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    type: 'delete' | 'restore' | null
    id: number | null
    name: string | null
  }>({ show: false, type: null, id: null, name: null })
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadCoupons = () => {
    setLoading(true)
    getCouponsList({ page, limit })
      .then((res) => {
        setResponse(res)
        setError(null)
      })
      .catch((err) => {
        setError(err?.message || t('common.failedToLoad'))
        setResponse(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCoupons()
  }, [page, limit])

  useEffect(() => {
    setPage(1)
  }, [search, activeTab])

  const couponTotalPages = response?.totalPages ?? 1

  const pageNumbers = useMemo(() => {
    return Array.from({ length: couponTotalPages }, (_, i) => i + 1)
      .filter(
        (pn) =>
          pn === 1 ||
          pn === couponTotalPages ||
          (pn >= page - 2 && pn <= page + 2)
      )
      .reduce((arr: (number | 'ellipsis')[], pn, idx, src) => {
        if (idx > 0 && pn - (src[idx - 1] as number) > 1) arr.push('ellipsis')
        arr.push(pn)
        return arr
      }, [])
  }, [page, couponTotalPages])

  const openConfirm = (type: 'delete' | 'restore', id: number, name: string) => {
    setConfirmDialog({ show: true, type, id, name })
  }

  const closeConfirm = () => {
    setConfirmDialog({ show: false, type: null, id: null, name: null })
  }

  const handleConfirm = async () => {
    if (confirmDialog.id == null || confirmDialog.type == null) return
    try {
      if (confirmDialog.type === 'delete') {
        setDeletingId(confirmDialog.id)
        await deleteCoupon(confirmDialog.id)
      } else {
        await restoreCoupon(confirmDialog.id)
      }
      loadCoupons()
      closeConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failedSave'))
      closeConfirm()
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive })
      setResponse((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          data: prev.data.map((c) =>
            c.id === coupon.id ? { ...c, isActive: !coupon.isActive } : c
          ),
        }
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failedSave'))
    }
  }

  const activeCoupons = (response?.data ?? []).filter((c) => !(c as unknown as Record<string, unknown>).deletedBy)
  const deletedCoupons = (response?.data ?? []).filter((c) => (c as unknown as Record<string, unknown>).deletedBy)

  const generalActive = activeCoupons.filter((c) => c.customerId == null)
  const perCustomerActive = activeCoupons.filter((c) => c.customerId != null)
  const generalDeleted = deletedCoupons.filter((c) => c.customerId == null)
  const perCustomerDeleted = deletedCoupons.filter((c) => c.customerId != null)

  const activeForTab = activeTab === 'general' ? generalActive : perCustomerActive
  const deletedForTab = activeTab === 'general' ? generalDeleted : perCustomerDeleted

  const filteredActive = search.trim()
    ? activeForTab.filter(
        (c) =>
          c.code?.toLowerCase().includes(search.trim().toLowerCase()) ||
          c.name?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : activeForTab

  return (
    <div className="space-y-6">
      {confirmDialog.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
          onClick={closeConfirm}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <Alert variant="destructive">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {confirmDialog.type === 'delete' ? t('couponsPage.deleteTitle') : t('couponsPage.restoreTitle')}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete'
                    ? t('couponsPage.deleteConfirm', { name: confirmDialog.name ?? '' })
                    : t('couponsPage.restoreConfirm', { name: confirmDialog.name ?? '' })}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirm}>{t('common.cancel')}</Button>
                <Button
                  variant={confirmDialog.type === 'delete' ? 'danger' : 'primary'}
                  onClick={handleConfirm}
                >
                  {confirmDialog.type === 'delete' ? t('common.delete') : t('common.restore')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('couponsPage.title')}</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">
            {t('createForms.couponSubtitle')}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="w-full sm:w-48">
            <Input
              placeholder={t('couponsPage.searchPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/coupons/creation" className="w-full sm:w-auto">
            <Button
              variant="primary"
              icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              <span className="sm:inline">{t('createForms.newCoupon')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {!loading && (
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t('common.general')}
            <span className="ml-1.5 text-xs opacity-80">({generalActive.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('per-customer')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'per-customer'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t('couponsPage.tabPerCustomer')}
            <span className="ml-1.5 text-xs opacity-80">({perCustomerActive.length})</span>
          </button>
        </div>
      )}

      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{t('couponsPage.code')}</TableHeadCell>
              <TableHeadCell>{t('couponsPage.name')}</TableHeadCell>
              <TableHeadCell>{t('common.scope')}</TableHeadCell>
              <TableHeadCell>{t('common.restaurant')}</TableHeadCell>
              <TableHeadCell>{t('couponsPage.customerColumn')}</TableHeadCell>
              <TableHeadCell>{t('couponsPage.discountColumn')}</TableHeadCell>
              <TableHeadCell>{t('couponsPage.validFrom')}</TableHeadCell>
              <TableHeadCell>{t('couponsPage.validTo')}</TableHeadCell>
              <TableHeadCell>{t('common.status')}</TableHeadCell>
              <TableHeadCell>{t('couponsPage.actions')}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 10 }).map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full bg-gray-200 dark:bg-slate-700" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!loading && (
        <>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-100 mb-4">
              {activeTab === 'general' ? t('couponsPage.headingGeneral') : t('couponsPage.headingPerCustomer')}
            </h2>

            <div className="space-y-3 md:hidden">
              {filteredActive.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {activeTab === 'general' ? t('couponsPage.noGeneral') : t('couponsPage.noPerCustomer')}
                </p>
              ) : (
                filteredActive.map((c) => (
                  <Card key={c.id} className="shadow-sm">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-semibold font-mono">{c.code}</CardTitle>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{c.name}</p>
                      </div>
                      <span
                        className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          c.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        }`}
                      >
                        {c.isActive ? t('common.active') : t('common.inactive')}
                      </span>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 text-xs text-gray-700 dark:text-slate-300 space-y-1">
                      <p><span className="font-medium">{t('common.scope')}:</span> {(c.customerId != null ? t('couponsPage.scopePerCustomer') : t('common.general'))} · {formatDiscount(c)}</p>
                      {(c.restaurantId != null || c.customerId != null) && (
                        <p>
                          {c.restaurantId != null && (c.restaurant?.name ?? t('common.restaurantWithId', { id: c.restaurantId }))}
                          {c.customerId != null && (() => {
                          const cust = c.customer
                          if (!cust) return ` · ${t('common.idDisplay', { id: c.customerId })}`
                          const name = cust.name?.trim()
                          const email = cust.email?.trim()
                          return ` · ${name && email ? `${name} (${email})` : (email || name || t('common.idDisplay', { id: c.customerId }))}`
                        })()}
                        </p>
                      )}
                      <div className="flex justify-end gap-1 pt-2">
                        <Button variant="ghost" size="sm" className="p-2 text-xs" icon={c.isActive ? <FiCheckCircle className="w-4 h-4 text-green-600" /> : <FiXCircle className="w-4 h-4 text-red-600" />} onClick={() => handleToggleActive(c)} />
                        <Link to={`/coupons/creation/${c.id}`}><Button variant="ghost" size="sm" className="p-2 text-xs" icon={<FiEdit className="w-4 h-4" />} /></Link>
                        <Button variant="danger" size="sm" className="p-2 text-xs" icon={<FiTrash className="w-4 h-4" />} onClick={() => openConfirm('delete', c.id, c.name)} disabled={deletingId === c.id} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeadCell>{t('couponsPage.code')}</TableHeadCell>
                    <TableHeadCell>{t('couponsPage.name')}</TableHeadCell>
                    <TableHeadCell>{t('common.scope')}</TableHeadCell>
                    <TableHeadCell>{t('common.restaurant')}</TableHeadCell>
                    <TableHeadCell>{t('couponsPage.customerColumn')}</TableHeadCell>
                    <TableHeadCell>{t('couponsPage.discountColumn')}</TableHeadCell>
                    <TableHeadCell>{t('couponsPage.validFrom')}</TableHeadCell>
                    <TableHeadCell>{t('couponsPage.validTo')}</TableHeadCell>
                    <TableHeadCell>{t('common.status')}</TableHeadCell>
                    <TableHeadCell>{t('couponsPage.actions')}</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {filteredActive.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-gray-500 dark:text-slate-400">
                        {activeTab === 'general' ? t('couponsPage.noGeneral') : t('couponsPage.noPerCustomer')}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredActive.map((c) => (
                    <CouponRow
                      key={c.id}
                      coupon={c}
                      onDelete={(id, name) => openConfirm('delete', id, name)}
                      onToggleActive={handleToggleActive}
                      isDeleting={deletingId === c.id}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {response && response.total > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
                <div className="text-gray-600 dark:text-slate-400 text-sm mb-2 sm:mb-0">
                  {t('common.paginationSummary', {
                    page: response.page,
                    totalPages: response.totalPages,
                    total: response.total,
                  })}
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={response.page <= 1}
                    aria-label={t('common.firstPage')}
                  >
                    «
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={response.page <= 1}
                    aria-label={t('common.prevPage')}
                  >
                    ‹
                  </Button>
                  {pageNumbers.map((pn, idx) =>
                    pn === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-slate-500">
                        …
                      </span>
                    ) : (
                      <Button
                        key={pn}
                        variant={pn === response.page ? 'primary' : 'default'}
                        size="sm"
                        onClick={() => setPage(pn as number)}
                        disabled={pn === response.page}
                        aria-current={pn === response.page ? 'page' : undefined}
                      >
                        {pn}
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(response.totalPages, p + 1))}
                    disabled={response.page >= response.totalPages}
                    aria-label={t('common.nextPage')}
                  >
                    ›
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(response.totalPages)}
                    disabled={response.page >= response.totalPages}
                    aria-label={t('common.lastPage')}
                  >
                    »
                  </Button>
                </div>
              </div>
            )}
          </div>

          {deletedForTab.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-slate-400 mb-4">
                {activeTab === 'general' ? t('couponsPage.deletedGeneral') : t('couponsPage.deletedPerCustomer')}
              </h2>
              <Table>
                <TableHead>
                  <tr className="bg-gray-100 dark:bg-slate-900">
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.code')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.name')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.scope')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.restaurant')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.customerColumn')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.discountColumn')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.validFrom')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.validTo')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.deletedByLower')}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('couponsPage.actions')}</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {deletedForTab.map((c) => (
                    <CouponRow
                      key={c.id}
                      coupon={c}
                      isDeleted
                      onRestore={(id, name) => openConfirm('restore', id, name)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
