import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiRotateCw, FiAlertCircle } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { getRestaurantsList, getRestaurantsListPaginated, restoreRestaurant, deleteRestaurant } from '../utils/api'
import { perm } from '../utils/permissions'
import type { Restaurant as RestaurantType, OpeningHour } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { TableItemsPerPageSelect, DEFAULT_TABLE_PAGE_SIZE } from '../components/TableItemsPerPageSelect'
import { PageHeader, PageToolbarCard } from '../components/page-layout'

function HoursTooltip({ hours, t }: { hours: OpeningHour[]; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <span
        className="text-xs text-gray-500 ml-2 cursor-default"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setPos({ x: rect.left, y: rect.bottom + 6 })
        }}
        onMouseLeave={() => setPos(null)}
      >
        {t('restaurantPage.moreHours', { count: hours.length - 1 })}
      </span>
      {pos && createPortal(
        <div
          style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
          className="bg-gray-800 text-white text-xs rounded px-3 py-2 shadow-xl pointer-events-none"
        >
          {hours.map((h, i) => (
            <div key={i}>{String(h.day ?? '')}: {String(h.open ?? '')}-{String(h.close ?? '')}</div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

export default function Restaurant() {
  const { t } = useTranslation()
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    type: 'delete' | 'restore' | null
    id: string | number | null
    name: string | null
  }>({
    show: false,
    type: null,
    id: null,
    name: null,
  })
  useEffect(() => {
    let mounted = true
    getRestaurantsListPaginated(undefined, { page, limit: pageSize })
      .then((res) => {
        if (!mounted) return
        setRestaurants(res.data)
        setTotalItems(res.total)
        setTotalPages(Math.max(1, res.totalPages))
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || t('common.failedToLoad'))
        setRestaurants([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [page, pageSize])

  // Separate active and deleted restaurants
  const activeRestaurants = restaurants.filter((r) => !r.deletedBy)
  const deletedRestaurants = restaurants.filter((r) => r.deletedBy)
  const canSeeDeletedRestaurants = perm('restaurants', 'restore')

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedActive = activeRestaurants

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(
        (pn) =>
          pn === 1 ||
          pn === totalPages ||
          (pn >= page - 2 && pn <= page + 2)
      )
      .reduce((arr: (number | 'ellipsis')[], pn, idx, src) => {
        if (idx > 0 && pn - (src[idx - 1] as number) > 1) arr.push('ellipsis')
        arr.push(pn)
        return arr
      }, [])
  }, [page, totalPages])

  const openConfirmDialog = (type: 'delete' | 'restore', id: string | number, name: string) => {
    setConfirmDialog({
      show: true,
      type,
      id,
      name,
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({
      show: false,
      type: null,
      id: null,
      name: null,
    })
  }

  const handleConfirm = async () => {
    if (!confirmDialog.id || !confirmDialog.type) return

    try {
      if (confirmDialog.type === 'delete') {
        await deleteRestaurant(confirmDialog.id)
      } else if (confirmDialog.type === 'restore') {
        await restoreRestaurant(confirmDialog.id)
      }
      // Refresh the restaurants list
      const data = await getRestaurantsList(undefined, { page, limit: pageSize })
      setRestaurants(data)
      setError(null)
      closeConfirmDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failedSave'))
      closeConfirmDialog()
    }
  }

  const handleRestore = (id: string | number, name: string) => {
    openConfirmDialog('restore', id, name)
  }

  const handleDelete = (id: string | number, name: string) => {
    openConfirmDialog('delete', id, name)
  }

  return (
    <>
      {/* Confirmation Dialog Modal */}
      {confirmDialog.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
          onClick={closeConfirmDialog}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <Alert variant="destructive">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {confirmDialog.type === 'delete' ? t('restaurantPage.deleteTitle') : t('restaurantPage.restoreTitle')}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete'
                    ? t('restaurantPage.deleteConfirm', { name: confirmDialog.name ?? '' })
                    : t('restaurantPage.restoreConfirm', { name: confirmDialog.name ?? '' })}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog}>
                  {t('common.cancel')}
                </Button>
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

      <div className="space-y-6">
        <div className="space-y-5">
          <PageHeader
            title={t('restaurantPage.title')}
            subtitle={t('restaurantPage.subtitle')}
            helpTooltip={t('common.toolbarHintDefault')}
            helpAriaLabel={t('common.moreInfo')}
          />
          {perm('restaurants', 'create') ? (
            <PageToolbarCard>
              <div className="flex flex-wrap justify-end gap-3">
                <Link to="/restaurant/creation" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="h-9 w-full justify-center px-4 text-sm sm:w-auto sm:px-6"
                  >
                    <span className="sm:inline">{t('restaurantPage.create')}</span>
                  </Button>
                </Link>
              </div>
            </PageToolbarCard>
          ) : null}
        </div>
        {loading && (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>{t('restaurantPage.name')}</TableHeadCell>
                <TableHeadCell>{t('restaurantPage.address')}</TableHeadCell>
                <TableHeadCell>{t('restaurantPage.city')}</TableHeadCell>
                <TableHeadCell>{t('common.province')}</TableHeadCell>
                <TableHeadCell>{t('common.zipCode')}</TableHeadCell>
                <TableHeadCell>{t('common.country')}</TableHeadCell>
                <TableHeadCell>{t('restaurantPage.activeMenuColumn')}</TableHeadCell>
                <TableHeadCell>{t('restaurantPage.created')}</TableHeadCell>
                <TableHeadCell>{t('restaurantPage.openingHours')}</TableHeadCell>
                <TableHeadCell>{t('restaurantPage.actions')}</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, r) => (
                <TableRow key={r} className="animate-pulse">
                  {Array.from({ length: 10 }).map((__, c) => (
                    <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && (
          <>
            <div>
              <h2 className="text-2xl font-semibold mb-4">{t('restaurantPage.activeHeading')}</h2>
              {/* Mobile: cards */}
              <div className="space-y-3 md:hidden">
                {activeRestaurants.length === 0 ? (
                  <p className="text-sm">{t('restaurantPage.noActive')}</p>
                ) : (
                  paginatedActive.map((r) => {
                    const anyRestaurant = r as unknown as Record<string, unknown>
                    const menu = anyRestaurant.menu as any
                    const primaryHours =
                      Array.isArray(r.openingHours) && r.openingHours.length > 0
                        ? `${r.openingHours[0].day}: ${r.openingHours[0].open}-${r.openingHours[0].close}`
                        : null

                    return (
                      <Card key={r.id || r.name} className="shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base font-semibold">
                            {r.name ?? ''}
                          </CardTitle>
                          <p className="text-xs">
                            {[r.city, r.province, r.country].filter(Boolean).join(', ')}
                          </p>
                        </CardHeader>
                        <CardContent className="px-4 pb-2 pt-0 space-y-1">
                          <p className="text-xs">
                            {r.address ?? ''}{r.zipCode ? `, ${r.zipCode}` : ''}
                          </p>
                          {menu?.name && (
                            <p className="text-xs">
                              {t('restaurantPage.activeMenu')}:{' '}
                              <span className="font-medium">{menu.name}</span>
                            </p>
                          )}
                          {primaryHours ? (
                            <p className="text-xs">
                              {t('restaurantPage.hoursPrefix')}: <span className="font-medium">{primaryHours}</span>
                              {Array.isArray(r.openingHours) && r.openingHours.length > 1 && (
                                <HoursTooltip hours={r.openingHours} t={t} />
                              )}
                            </p>
                          ) : (
                            <p className="text-xs">{t('restaurantPage.noOpeningHours')}</p>
                          )}
                          {r.createdAt && (
                            <p className="text-[11px]">
                              {t('restaurantPage.created')}:{' '}
                              {new Date(String(r.createdAt)).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                          {perm('restaurants', 'update') ? (
                            <Link to={`/restaurant/creation/${encodeURIComponent(String(r.id ?? ''))}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-xs"
                                icon={<FiEdit className="w-4 h-4" />}
                              />
                            </Link>
                          ) : null}
                          {perm('restaurants', 'delete') ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="p-2 text-xs"
                              icon={<FiTrash className="w-4 h-4" />}
                              onClick={() => handleDelete(r.id ?? '', r.name ?? '')}
                            />
                          ) : null}
                        </CardFooter>
                      </Card>
                    )
                  })
                )}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeadCell>{t('restaurantPage.name')}</TableHeadCell>
                      <TableHeadCell>{t('restaurantPage.address')}</TableHeadCell>
                      <TableHeadCell>{t('restaurantPage.city')}</TableHeadCell>
                      <TableHeadCell>{t('common.province')}</TableHeadCell>
                      <TableHeadCell>{t('common.zipCode')}</TableHeadCell>
                      <TableHeadCell>{t('common.country')}</TableHeadCell>
                      <TableHeadCell>{t('restaurantPage.activeMenuColumn')}</TableHeadCell>
                      <TableHeadCell>{t('restaurantPage.created')}</TableHeadCell>
                      <TableHeadCell>{t('restaurantPage.openingHours')}</TableHeadCell>
                      <TableHeadCell>{t('restaurantPage.actions')}</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {activeRestaurants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10}>{t('restaurantPage.noActive')}</TableCell>
                      </TableRow>
                    )}
                    {paginatedActive.map((r) => {
                      const anyRestaurant = r as unknown as Record<string, unknown>
                      const menu = anyRestaurant.menu as any
                      return (
                        <TableRow key={r.id || r.name}>
                          <TableCell>{r.name ?? ''}</TableCell>
                          <TableCell>{r.address ?? ''}</TableCell>
                          <TableCell>{r.city ?? ''}</TableCell>
                          <TableCell>{r.province ?? ''}</TableCell>
                          <TableCell>{r.zipCode ?? ''}</TableCell>
                          <TableCell>{r.country ?? ''}</TableCell>
                          <TableCell>
                            {menu?.name ?? ''}
                          </TableCell>
                          <TableCell>{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</TableCell>
                          <TableCell>
                            {Array.isArray(r.openingHours) && r.openingHours.length > 0 ? (
                              <span>
                                {`${r.openingHours[0].day}: ${r.openingHours[0].open}-${r.openingHours[0].close}`}
                                {r.openingHours.length > 1 && (
                                  <HoursTooltip hours={r.openingHours} t={t} />
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">{t('restaurantPage.noHours')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {perm('restaurants', 'update') ? (
                                <Link to={`/restaurant/creation/${encodeURIComponent(String(r.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                              ) : null}
                              {perm('restaurants', 'delete') ? (
                                <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />} onClick={() => handleDelete(r.id ?? '', r.name ?? '')}></Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {activeRestaurants.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className="text-gray-600 dark:text-slate-400 text-sm">
                      {t('common.paginationSummary', { page, totalPages, total: totalItems })}
                    </div>
                    <TableItemsPerPageSelect
                      id="restaurants-page-size"
                      value={pageSize}
                      onChange={setPageSize}
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
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
                    {pageNumbers.map((pn, idx) =>
                      pn === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-slate-500">
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
              )}
            </div>

            {canSeeDeletedRestaurants && deletedRestaurants.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">{t('restaurantPage.deletedHeading')}</h2>

                {/* Mobile: cards for deleted */}
                <div className="space-y-3 md:hidden">
                  {deletedRestaurants.map((r) => {
                    const anyRestaurant = r as unknown as Record<string, unknown>
                    const allMenus = Array.isArray(anyRestaurant.menus) ? anyRestaurant.menus : []
                    const activeMenus = allMenus.filter((menu: any) => menu?.isActive === true)
                    const primaryHours =
                      Array.isArray(r.openingHours) && r.openingHours.length > 0
                        ? `${r.openingHours[0].day}: ${r.openingHours[0].open}-${r.openingHours[0].close}`
                        : null

                    return (
                      <Card key={r.id || r.name} className="shadow-sm bg-gray-50">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base font-semibold">
                            {r.name ?? ''}
                          </CardTitle>
                          <p className="text-xs">
                            {[r.city, r.province, r.country].filter(Boolean).join(', ')}
                          </p>
                        </CardHeader>
                        <CardContent className="px-4 pb-2 pt-0 space-y-1">
                          <p className="text-xs">
                            {r.address ?? ''}{r.zipCode ? `, ${r.zipCode}` : ''}
                          </p>
                          {activeMenus.length > 0 ? (
                            <p className="text-xs">
                              {t('restaurantPage.activeMenus')}:{' '}
                              {activeMenus.map((menu: any, index: number) => (
                                <span key={menu?.id || index}>
                                  {menu?.name || ''}
                                  {index < activeMenus.length - 1 && ', '}
                                </span>
                              ))}
                            </p>
                          ) : (
                            <p className="text-xs">{t('restaurantPage.noActiveMenu')}</p>
                          )}
                          {primaryHours ? (
                            <p className="text-xs">
                              {t('restaurantPage.hoursPrefix')}: <span className="font-medium">{primaryHours}</span>
                              {Array.isArray(r.openingHours) && r.openingHours.length > 1 && (
                                <HoursTooltip hours={r.openingHours} t={t} />
                              )}
                            </p>
                          ) : (
                            <p className="text-xs">{t('restaurantPage.noHours')}</p>
                          )}
                          <p className="text-[11px] text-gray-400">
                            {t('productsPage.deletedBy')}: <span className="font-medium">{String(r.deletedBy ?? '')}</span>
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                          {perm('restaurants', 'restore') ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-xs"
                              icon={<FiRotateCw className="w-4 h-4" />}
                              onClick={() => handleRestore(r.id ?? '', r.name ?? '')}
                              title={t('common.restore')}
                            />
                          ) : null}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>

                {/* Desktop: table for deleted */}
                <div className="hidden md:block">
                  <Table>
                    <TableHead>
                      <tr className="bg-gray-100 dark:bg-slate-900">
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('restaurantPage.name')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('restaurantPage.address')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('restaurantPage.city')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.province')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.zipCode')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.country')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('restaurantPage.activeMenuColumn')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('restaurantPage.created')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('restaurantPage.openingHours')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.deletedBy')}</TableHeadCell>
                        <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('restaurantPage.actions')}</TableHeadCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {deletedRestaurants.map((r) => {
                        const anyRestaurant = r as unknown as Record<string, unknown>
                        const allMenus = Array.isArray(anyRestaurant.menus) ? anyRestaurant.menus : []
                        const activeMenus = allMenus.filter((menu: any) => menu?.isActive === true)
                        return (
                          <TableRow key={r.id || r.name} className="bg-gray-50 opacity-75 dark:bg-slate-800">
                            <TableCell className="text-gray-600">{r.name ?? ''}</TableCell>
                            <TableCell className="text-gray-600">{r.address ?? ''}</TableCell>
                            <TableCell className="text-gray-600">{r.city ?? ''}</TableCell>
                            <TableCell className="text-gray-600">{r.province ?? ''}</TableCell>
                            <TableCell className="text-gray-600">{r.zipCode ?? ''}</TableCell>
                            <TableCell className="text-gray-600">{r.country ?? ''}</TableCell>
                            <TableCell className="text-gray-600">
                              {activeMenus.length > 0 ? (
                                activeMenus.map((menu: any, index: number) => (
                                  <span key={menu?.id || index}>
                                    {menu?.name || ''}
                                    {index < activeMenus.length - 1 && ', '}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">{t('restaurantPage.noActiveMenu')}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-600">{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</TableCell>
                            <TableCell className="text-gray-600">
                              {Array.isArray(r.openingHours) && r.openingHours.length > 0 ? (
                                <span>
                                  {`${r.openingHours[0].day}: ${r.openingHours[0].open}-${r.openingHours[0].close}`}
                                  {r.openingHours.length > 1 && (
                                    <HoursTooltip hours={r.openingHours} t={t} />
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">{t('restaurantPage.noHours')}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">{String(r.deletedBy ?? '')}</TableCell>
                            <TableCell>
                              {perm('restaurants', 'restore') ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className='p-2'
                                  icon={<FiRotateCw className="w-4 h-4" />}
                                  onClick={() => handleRestore(r.id ?? '', r.name ?? '')}
                                ></Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
