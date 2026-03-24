import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { getDeliveryLocationsList, getRestaurantsList, updateDeliveryLocation, deleteDeliveryLocation } from '../utils/api'
import type { CreateDeliveryLocationPayload as DeliveryLocation, Restaurant as RestaurantType } from '../utils/api'

function renderRestaurantsCell(
  loc: Partial<DeliveryLocation>,
  restaurantsMap: Record<string, string>,
  t: (key: string, opts?: Record<string, unknown>) => string
) {
  const anyLoc = loc as unknown as Record<string, unknown>
  const maybeArray = (key: string): unknown[] | null => {
    const v = anyLoc[key]
    return Array.isArray(v) ? (v as unknown[]) : null
  }
  const list = maybeArray('deliveredBy') ?? maybeArray('deliveredByRestaurants') ?? maybeArray('delivedByRestaurants') ?? []

  if (list.length === 0) return <span className="text-xs text-gray-400">{t('common.noneLinked')}</span>

  return (
    <div className="flex flex-col gap-1">
      {list.map((d, idx) => {
        const item = d as Record<string, unknown>
        let name = ''
        if (typeof item.name === 'string' || item.id !== undefined) {
          name = String(item.name ?? item.id)
        } else if (item.restaurantId !== undefined) {
          name = restaurantsMap[String(item.restaurantId ?? '')] ?? String(item.restaurantId ?? '')
        }
        const fee =
          typeof item.deliveryFee === 'number' || typeof item.deliveryFee === 'string'
            ? t('deliveryLocationsPage.feeBadge', { amount: String(item.deliveryFee) })
            : ''
        const min =
          typeof item.minOrder === 'number' || typeof item.minOrder === 'string'
            ? t('deliveryLocationsPage.minBadge', { amount: String(item.minOrder) })
            : ''
        const minTimeRaw = item.minDeliveryTimeMinutes
        const minTime =
          typeof minTimeRaw === 'number' || typeof minTimeRaw === 'string'
            ? t('deliveryLocationsPage.minTimeBadge', { minutes: String(minTimeRaw) })
            : ''
        const inactive = item.isActive === false
        return (
          <span key={idx} className={inactive ? 'opacity-60' : ''}>
            <span className="font-medium">{name}</span>
            {fee && <span className="ml-2 bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-xs">{fee}</span>}
            {min && <span className="ml-2 bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-xs">{min}</span>}
            {minTime && <span className="ml-2 bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-xs">{minTime}</span>}
            {inactive && <span className="ml-2 bg-red-200 text-red-800 rounded px-2 py-0.5 text-xs">{t('common.inactive')}</span>}
          </span>
        )
      })}
    </div>
  )
}

const ACTIVE_PAGE_SIZE = 10

export default function DeliveryLocations() {
  const { t } = useTranslation()
  const [locations, setLocations] = useState<Partial<DeliveryLocation>[]>([])
  const [restaurantsMap, setRestaurantsMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; id: string | null; name: string | null }>({
    show: false,
    id: null,
    name: null,
  })

  useEffect(() => {
    let mounted = true

    async function loadAll() {
      try {
        const locsRaw = await getDeliveryLocationsList()
        const restsRaw = await getRestaurantsList()

        if (!mounted) return

        // Normalize delivery locations to an array
        const locsArray = Array.isArray(locsRaw) ? locsRaw : (locsRaw && (locsRaw as any).items) || (locsRaw && (locsRaw as any).data) || []
        setLocations(locsArray as unknown as Partial<DeliveryLocation>[])

        // Normalize restaurants to an array and build id->name map
        const restsArray = Array.isArray(restsRaw) ? restsRaw : (restsRaw && (restsRaw as any).items) || (restsRaw && (restsRaw as any).data) || []
        const map: Record<string, string> = {}
        if (Array.isArray(restsArray)) {
          (restsArray as RestaurantType[]).forEach((r) => {
            if (r && r.id !== undefined) map[String(r.id)] = String(r.name ?? r.id)
          })
        }
        setRestaurantsMap(map)
        setError(null)
      } catch (err: unknown) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err) || t('common.failedToLoad'))
        setLocations([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAll()

    return () => {
      mounted = false
    }
  }, [])

  // Separate active and deleted locations
  const activeLocations = locations.filter((loc) => {
    const anyLoc = loc as unknown as Record<string, unknown>
    return !anyLoc.deletedBy
  })
  const deletedLocations = locations.filter((loc) => {
    const anyLoc = loc as unknown as Record<string, unknown>
    return anyLoc.deletedBy
  })

  const totalPages = Math.max(1, Math.ceil(activeLocations.length / ACTIVE_PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedActive = useMemo(() => {
    const start = (page - 1) * ACTIVE_PAGE_SIZE
    return activeLocations.slice(start, start + ACTIVE_PAGE_SIZE)
  }, [activeLocations, page])

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

  const openConfirmDialog = (loc: Partial<DeliveryLocation>) => {
    const locId = (loc as any).id
    if (!locId) return
    setConfirmDialog({ show: true, id: String(locId), name: loc.name ?? t('deliveryLocationsPage.defaultLocationName') })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({ show: false, id: null, name: null })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return
    try {
      await deleteDeliveryLocation(confirmDialog.id)
      const locsRaw = await getDeliveryLocationsList()
      const locsArray = Array.isArray(locsRaw) ? locsRaw : (locsRaw && (locsRaw as any).items) || (locsRaw && (locsRaw as any).data) || []
      setLocations(locsArray as unknown as Partial<DeliveryLocation>[])
      setError(null)
      closeConfirmDialog()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || t('common.failedSave'))
      closeConfirmDialog()
    }
  }

  // Function to toggle active status
  const toggleActiveStatus = async (loc: Partial<DeliveryLocation>) => {
    const locId = (loc as any).id
    if (!locId) return

    try {
      const currentStatus = loc.isActive ?? false
      const updatedPayload: DeliveryLocation = {
        name: loc.name ?? '',
        address: loc.address,
        streetNumber: loc.streetNumber,
        city: loc.city,
        province: loc.province,
        image: loc.image,
        zipCode: loc.zipCode,
        country: loc.country,
        description: loc.description,
        isActive: !currentStatus,
      }

      await updateDeliveryLocation(String(locId), updatedPayload)

      // Reload the list
      const locsRaw = await getDeliveryLocationsList()
      const locsArray = Array.isArray(locsRaw) ? locsRaw : (locsRaw && (locsRaw as any).items) || (locsRaw && (locsRaw as any).data) || []
      setLocations(locsArray as unknown as Partial<DeliveryLocation>[])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || t('common.failedSave'))
    }
  }

  return (
    <div className="space-y-6">
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
                <AlertTitle>{t('deliveryLocationsPage.deleteTitle')}</AlertTitle>
                <AlertDescription>
                  {t('deliveryLocationsPage.deletePermanent', { name: confirmDialog.name ?? '' })}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog}>{t('common.cancel')}</Button>
                <Button variant="danger" onClick={handleConfirmDelete}>
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('deliveryLocationsPage.title')}</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">{t('deliveryLocationsPage.subtitle')}</p>
        </div>
        <Link to="/delivery-locations/creation" className="w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:inline">{t('deliveryLocationsPage.create')}</span>
          </Button>
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <div className="mt-4">
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>{t('deliveryLocationsPage.name')}</TableHeadCell>
                <TableHeadCell>{t('deliveryLocationsPage.address')}</TableHeadCell>
                <TableHeadCell>{t('deliveryLocationsPage.city')}</TableHeadCell>
                <TableHeadCell>{t('common.province')}</TableHeadCell>
                <TableHeadCell>{t('common.zipCode')}</TableHeadCell>
                <TableHeadCell>{t('common.country')}</TableHeadCell>
                <TableHeadCell>{t('deliveryLocationsPage.active')}</TableHeadCell>
                <TableHeadCell>{t('deliveryLocationsPage.restaurantsLabel')}</TableHeadCell>
                <TableHeadCell>{t('deliveryLocationsPage.actions')}</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, r) => (
                <TableRow key={r} className="animate-pulse">
                  {Array.from({ length: 11 }).map((__, c) => (
                    <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-4">{t('deliveryLocationsPage.activeHeading')}</h2>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {activeLocations.length === 0 ? (
                <p className="text-sm">
                  {t('deliveryLocationsPage.noActive')}
                </p>
              ) : (
                paginatedActive.map((loc) => (
                  <Card
                    key={String(loc.id ?? '') + String(loc.name ?? '')}
                    className="shadow-sm"
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-semibold">
                        {loc.name ?? ''}
                      </CardTitle>
                      <p className="text-xs">
                        {[loc.city, loc.province, loc.country].filter(Boolean).join(', ')}
                      </p>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 pt-0 space-y-1">
                      <p className="text-xs">
                        {loc.address ?? ''}{loc.zipCode ? `, ${loc.zipCode}` : ''}
                      </p>
                      <p className="text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${loc.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {loc.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </p>
                      <div className="text-xs">
                        <span className="font-semibold">{t('deliveryLocationsPage.restaurantsLabel')}:</span>{' '}
                        {renderRestaurantsCell(loc, restaurantsMap, t)}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                      <Link to={`/delivery-locations/creation/${encodeURIComponent(String(loc.id ?? ''))}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiEdit className="w-4 h-4" />}
                        />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-xs"
                        icon={
                          loc.isActive ? (
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <FiXCircle className="w-4 h-4 text-red-600" />
                          )
                        }
                        onClick={() => toggleActiveStatus(loc)}
                        title={loc.isActive ? t('common.deactivate') : t('common.activate')}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="p-2 text-xs"
                        icon={<FiTrash className="w-4 h-4" />}
                        onClick={() => openConfirmDialog(loc)}
                        title={t('common.delete')}
                      />
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeadCell>{t('deliveryLocationsPage.name')}</TableHeadCell>
                    <TableHeadCell>{t('deliveryLocationsPage.address')}</TableHeadCell>
                    <TableHeadCell>{t('deliveryLocationsPage.city')}</TableHeadCell>
                    <TableHeadCell>{t('common.province')}</TableHeadCell>
                    <TableHeadCell>{t('common.zipCode')}</TableHeadCell>
                    <TableHeadCell>{t('common.country')}</TableHeadCell>
                    <TableHeadCell>{t('deliveryLocationsPage.active')}</TableHeadCell>
                    <TableHeadCell>{t('deliveryLocationsPage.restaurantsLabel')}</TableHeadCell>
                    <TableHeadCell>{t('deliveryLocationsPage.actions')}</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {activeLocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>{t('deliveryLocationsPage.noActive')}</TableCell>
                    </TableRow>
                  )}

                  {paginatedActive.map((loc) => (
                    <TableRow key={String(loc.id ?? '') + String(loc.name ?? '')}>
                      <TableCell>{loc.name ?? ''}</TableCell>
                      <TableCell>{loc.address ?? ''}</TableCell>
                      <TableCell>{loc.city ?? ''}</TableCell>
                      <TableCell>{loc.province ?? ''}</TableCell>
                      <TableCell>{loc.zipCode ?? ''}</TableCell>
                      <TableCell>{loc.country ?? ''}</TableCell>
                      <TableCell>{loc.isActive ? t('deliveryLocationsPage.yes') : t('deliveryLocationsPage.no')}</TableCell>
                      <TableCell>{renderRestaurantsCell(loc, restaurantsMap, t)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link to={`/delivery-locations/creation/${encodeURIComponent(String(loc.id ?? ''))}`}><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                          <Button
                            variant={loc.isActive ? "ghost" : "ghost"}
                            size="sm"
                            className='p-2'
                            icon={loc.isActive ? <FiCheckCircle className="w-4 h-4 text-green-600" /> : <FiXCircle className="w-4 h-4 text-red-600" />}
                            onClick={() => toggleActiveStatus(loc)}
                            title={loc.isActive ? t('common.deactivate') : t('common.activate')}
                          ></Button>
                          <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />} onClick={() => openConfirmDialog(loc)} title={t('common.delete')} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {activeLocations.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
                <div className="text-gray-600 dark:text-slate-400 text-sm mb-2 sm:mb-0">
                  {t('common.paginationSummary', { page, totalPages, total: activeLocations.length })}
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

          {deletedLocations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">{t('deliveryLocationsPage.deletedHeading')}</h2>

              {/* Mobile: cards for deleted */}
              <div className="space-y-3 md:hidden">
                {deletedLocations.map((loc) => {
                  const anyLoc = loc as unknown as Record<string, unknown>
                  return (
                    <Card
                      key={String(loc.id ?? '') + String(loc.name ?? '')}
                      className="shadow-sm bg-gray-50"
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base font-semibold">
                          {loc.name ?? ''}
                        </CardTitle>
                        <p className="text-xs">
                          {[loc.city, loc.province, loc.country].filter(Boolean).join(', ')}
                        </p>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-0 space-y-1">
                        <p className="text-xs">
                          {loc.address ?? ''}{loc.zipCode ? `, ${loc.zipCode}` : ''}
                        </p>
                        <p className="text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${loc.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                              }`}
                          >
                            {loc.isActive ? t('common.active') : t('common.inactive')}
                          </span>
                        </p>
                        <div className="text-xs">
                          <span className="font-semibold">{t('deliveryLocationsPage.restaurantsLabel')}:</span>{' '}
                          {renderRestaurantsCell(loc, restaurantsMap, t)}
                        </div>
                        <p className="text-[11px]">
                          {t('productsPage.deletedBy')}:{' '}
                          <span className="font-medium">
                            {String(anyLoc.deletedBy ?? '')}
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Desktop: table for deleted */}
              <div className="hidden md:block">
                <Table>
                  <TableHead>
                    <tr className="bg-gray-100 dark:bg-slate-900">
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('deliveryLocationsPage.name')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('deliveryLocationsPage.address')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('deliveryLocationsPage.city')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.province')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.zipCode')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.country')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('deliveryLocationsPage.active')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('deliveryLocationsPage.restaurantsLabel')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.deletedBy')}</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {deletedLocations.map((loc) => {
                      const anyLoc = loc as unknown as Record<string, unknown>
                      return (
                        <TableRow key={String(loc.id ?? '') + String(loc.name ?? '')} className="bg-gray-50 opacity-75 dark:bg-slate-800">
                          <TableCell className="text-gray-600">{loc.name ?? ''}</TableCell>
                          <TableCell className="text-gray-600">{loc.address ?? ''}</TableCell>
                          <TableCell className="text-gray-600">{loc.city ?? ''}</TableCell>
                          <TableCell className="text-gray-600">{loc.province ?? ''}</TableCell>
                          <TableCell className="text-gray-600">{loc.zipCode ?? ''}</TableCell>
                          <TableCell className="text-gray-600">{loc.country ?? ''}</TableCell>
                          <TableCell className="text-gray-600">{loc.isActive ? t('deliveryLocationsPage.yes') : t('deliveryLocationsPage.no')}</TableCell>
                          <TableCell className="text-gray-600">{renderRestaurantsCell(loc, restaurantsMap, t)}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{String(anyLoc.deletedBy ?? '')}</TableCell>
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
  )
}
