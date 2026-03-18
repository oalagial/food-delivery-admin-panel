import { useEffect, useState } from 'react'
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

function scopeLabel(coupon: Coupon): string {
  if (coupon.customerId != null) return 'Per customer'
  return 'General'
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
  const anyCoupon = coupon as unknown as Record<string, unknown>
  const deletedBy = anyCoupon.deletedBy

  return (
    <TableRow className={isDeleted ? 'bg-gray-50 opacity-75 dark:bg-slate-800' : ''}>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        <span className="font-mono font-medium">{coupon.code}</span>
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>{coupon.name}</TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>{scopeLabel(coupon)}</TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.restaurantId == null ? '—' : coupon.restaurant?.name ?? `ID ${coupon.restaurantId}`}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.customerId == null ? '—' : (() => {
          const c = coupon.customer
          if (!c) return `ID ${coupon.customerId}`
          const name = c.name?.trim()
          const email = c.email?.trim()
          if (name && email) return `${name} (${email})`
          return email || name || `ID ${coupon.customerId}`
        })()}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {formatDiscount(coupon)}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : '—'}
      </TableCell>
      <TableCell className={isDeleted ? 'text-gray-600 dark:text-slate-400' : ''}>
        {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString() : '—'}
      </TableCell>
      {!isDeleted && (
        <TableCell className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="inline-flex items-center justify-center"
            onClick={() => onToggleActive?.(coupon)}
            aria-label={coupon.isActive ? 'Deactivate' : 'Activate'}
            icon={
              coupon.isActive
                ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Active" />
                : <FiXCircle className="w-5 h-5 text-red-500" aria-label="Inactive" />
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
        setError(err?.message || 'Failed to load')
        setResponse(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCoupons()
  }, [page, limit])

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
      setError(err instanceof Error ? err.message : `Failed to ${confirmDialog.type}`)
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
      setError(err instanceof Error ? err.message : 'Failed to update')
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
                  {confirmDialog.type === 'delete' ? 'Delete coupon' : 'Restore coupon'}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete'
                    ? `Are you sure you want to delete "${confirmDialog.name}"?`
                    : `Are you sure you want to restore "${confirmDialog.name}"?`}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirm}>Cancel</Button>
                <Button
                  variant={confirmDialog.type === 'delete' ? 'danger' : 'primary'}
                  onClick={handleConfirm}
                >
                  {confirmDialog.type === 'delete' ? 'Delete' : 'Restore'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Coupons</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">
            General or per-customer coupons
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="w-full sm:w-48">
            <Input
              placeholder="Search (code/name)..."
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
              <span className="sm:inline">New coupon</span>
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
            General
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
            Per customer
            <span className="ml-1.5 text-xs opacity-80">({perCustomerActive.length})</span>
          </button>
        </div>
      )}

      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Code</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Scope</TableHeadCell>
              <TableHeadCell>Restaurant</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Discount</TableHeadCell>
              <TableHeadCell>From</TableHeadCell>
              <TableHeadCell>To</TableHeadCell>
              <TableHeadCell>Active</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
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
              {activeTab === 'general' ? 'General coupons' : 'Per-customer coupons'}
            </h2>

            <div className="space-y-3 md:hidden">
              {filteredActive.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {activeTab === 'general' ? 'No general coupons found.' : 'No per-customer coupons found.'}
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
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 text-xs text-gray-700 dark:text-slate-300 space-y-1">
                      <p><span className="font-medium">Scope:</span> {scopeLabel(c)} · {formatDiscount(c)}</p>
                      {(c.restaurantId != null || c.customerId != null) && (
                        <p>
                          {c.restaurantId != null && (c.restaurant?.name ?? `Restaurant ${c.restaurantId}`)}
                          {c.customerId != null && (() => {
                          const cust = c.customer
                          if (!cust) return ` · ID ${c.customerId}`
                          const name = cust.name?.trim()
                          const email = cust.email?.trim()
                          return ` · ${name && email ? `${name} (${email})` : (email || name || `ID ${c.customerId}`)}`
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
                    <TableHeadCell>Code</TableHeadCell>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Scope</TableHeadCell>
                    <TableHeadCell>Restaurant</TableHeadCell>
                    <TableHeadCell>Customer</TableHeadCell>
                    <TableHeadCell>Discount</TableHeadCell>
                    <TableHeadCell>From</TableHeadCell>
                    <TableHeadCell>To</TableHeadCell>
                    <TableHeadCell>Active</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {filteredActive.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-gray-500 dark:text-slate-400">
                        {activeTab === 'general' ? 'No general coupons found.' : 'No per-customer coupons found.'}
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

            {response && response.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Page {response.page} of {response.totalPages} ({response.total} total)
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" disabled={response.page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                  <Button variant="ghost" size="sm" disabled={response.page >= response.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </div>

          {deletedForTab.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-slate-400 mb-4">
                Deleted {activeTab === 'general' ? 'general' : 'per-customer'} coupons
              </h2>
              <Table>
                <TableHead>
                  <tr className="bg-gray-100 dark:bg-slate-900">
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Code</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Name</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Scope</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Restaurant</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Customer</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Discount</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">From</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">To</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Deleted by</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Actions</TableHeadCell>
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
