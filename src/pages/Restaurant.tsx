import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiRotateCw, FiAlertCircle } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { getRestaurantsList, restoreRestaurant, deleteRestaurant } from '../utils/api'
import type { Restaurant as RestaurantType } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'

export default function Restaurant() {
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    getRestaurantsList()
      .then((data) => {
        if (!mounted) return
        setRestaurants(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load')
        setRestaurants([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Separate active and deleted restaurants
  const activeRestaurants = restaurants.filter((r) => !r.deletedBy)
  const deletedRestaurants = restaurants.filter((r) => r.deletedBy)

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
      const data = await getRestaurantsList()
      setRestaurants(data)
      setError(null)
      closeConfirmDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${confirmDialog.type} restaurant`)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeConfirmDialog}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <Alert variant="default">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {confirmDialog.type === 'delete' ? 'Delete Restaurant' : 'Restore Restaurant'}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete' 
                    ? `Are you sure you want to delete "${confirmDialog.name}"? This action cannot be undone.`
                    : `Are you sure you want to restore "${confirmDialog.name}"?`}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog}>
                  Cancel
                </Button>
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

      <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant locations</p>
        </div>
        <Link to="/restaurant/creation" className="w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:inline">Create Restaurant</span>
          </Button>
        </Link>
      </div>
      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Address</TableHeadCell>
              <TableHeadCell>City</TableHeadCell>
              <TableHeadCell>Province</TableHeadCell>
              <TableHeadCell>Zip</TableHeadCell>
              <TableHeadCell>Country</TableHeadCell>
              <TableHeadCell>Active Menu</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Opening Hours</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Restaurants</h2>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {activeRestaurants.length === 0 ? (
                <p className="text-sm text-gray-500">No active restaurants found.</p>
              ) : (
                activeRestaurants.map((r) => {
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
                        <p className="text-xs text-gray-600">
                          {[r.city, r.province, r.country].filter(Boolean).join(', ')}
                        </p>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-0 space-y-1">
                        <p className="text-xs text-gray-700">
                          {r.address ?? ''}{r.zipCode ? `, ${r.zipCode}` : ''}
                        </p>
                        {menu?.name && (
                          <p className="text-xs text-gray-600">
                            Active menu:{' '}
                            <span className="font-medium text-gray-800">{menu.name}</span>
                          </p>
                        )}
                        {primaryHours ? (
                          <p className="text-xs text-gray-600">
                            Hours: <span className="font-medium">{primaryHours}</span>
                            {Array.isArray(r.openingHours) && r.openingHours.length > 1 && (
                              <span className="ml-1 text-gray-400">
                                (+{r.openingHours.length - 1} more)
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">No opening hours</p>
                        )}
                        {r.createdAt && (
                          <p className="text-[11px] text-gray-400">
                            Created:{' '}
                            {new Date(String(r.createdAt)).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 px-4 pb-4 pt-0">
                        <Link
                          to={`/restaurant/creation/${encodeURIComponent(String(r.id ?? ''))}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-xs"
                            icon={<FiEdit className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiTrash className="w-4 h-4" />}
                          onClick={() => handleDelete(r.id ?? '', r.name ?? '')}
                        >
                          Delete
                        </Button>
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
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Address</TableHeadCell>
                    <TableHeadCell>City</TableHeadCell>
                    <TableHeadCell>Province</TableHeadCell>
                    <TableHeadCell>Zip</TableHeadCell>
                    <TableHeadCell>Country</TableHeadCell>
                    <TableHeadCell>Active Menu</TableHeadCell>
                    <TableHeadCell>Created</TableHeadCell>
                    <TableHeadCell>Opening Hours</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {activeRestaurants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10}>No active restaurants found.</TableCell>
                    </TableRow>
                  )}
                  {activeRestaurants.map((r) => {
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
                            <>
                              {`${r.openingHours[0].day}: ${r.openingHours[0].open}-${r.openingHours[0].close}`}
                              {r.openingHours.length > 1 && (
                                <span className="text-xs text-gray-500 ml-2">+{r.openingHours.length - 1} more</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">No hours</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Link to={`/restaurant/creation/${encodeURIComponent(String(r.id ?? ''))}`} className='mr-2' ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                            <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />} onClick={() => handleDelete(r.id ?? '', r.name ?? '')}></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {deletedRestaurants.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">Deleted Restaurants</h2>

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
                        <CardTitle className="text-base font-semibold text-gray-700">
                          {r.name ?? ''}
                        </CardTitle>
                        <p className="text-xs text-gray-500">
                          {[r.city, r.province, r.country].filter(Boolean).join(', ')}
                        </p>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-0 space-y-1">
                        <p className="text-xs text-gray-600">
                          {r.address ?? ''}{r.zipCode ? `, ${r.zipCode}` : ''}
                        </p>
                        {activeMenus.length > 0 ? (
                          <p className="text-xs text-gray-600">
                            Active menus:{' '}
                            {activeMenus.map((menu: any, index: number) => (
                              <span key={menu?.id || index}>
                                {menu?.name || ''}
                                {index < activeMenus.length - 1 && ', '}
                              </span>
                            ))}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">No active menu</p>
                        )}
                        {primaryHours ? (
                          <p className="text-xs text-gray-500">
                            Hours: <span className="font-medium">{primaryHours}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">No hours</p>
                        )}
                        <p className="text-[11px] text-gray-400">
                          Deleted by: <span className="font-medium">{String(r.deletedBy ?? '')}</span>
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 px-4 pb-4 pt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-xs"
                          icon={<FiRotateCw className="w-4 h-4" />}
                          onClick={() => handleRestore(r.id ?? '', r.name ?? '')}
                        >
                          Restore
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>

              {/* Desktop: table for deleted */}
              <div className="hidden md:block">
                <Table>
                  <TableHead>
                    <tr className="bg-gray-100">
                      <TableHeadCell className="text-gray-600">Name</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Address</TableHeadCell>
                      <TableHeadCell className="text-gray-600">City</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Province</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Zip</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Country</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Active Menu</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Created</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Opening Hours</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Deleted By</TableHeadCell>
                      <TableHeadCell className="text-gray-600">Actions</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {deletedRestaurants.map((r) => {
                      const anyRestaurant = r as unknown as Record<string, unknown>
                      const allMenus = Array.isArray(anyRestaurant.menus) ? anyRestaurant.menus : []
                      const activeMenus = allMenus.filter((menu: any) => menu?.isActive === true)
                      return (
                        <TableRow key={r.id || r.name} className="bg-gray-50 opacity-75">
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
                              <span className="text-xs text-gray-400">No active menu</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">{r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : ''}</TableCell>
                          <TableCell className="text-gray-600">
                            {Array.isArray(r.openingHours) && r.openingHours.length > 0 ? (
                              <>
                                {`${r.openingHours[0].day}: ${r.openingHours[0].open}-${r.openingHours[0].close}`}
                                {r.openingHours.length > 1 && (
                                  <span className="text-xs text-gray-400 ml-2">+{r.openingHours.length - 1} more</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">No hours</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">{String(r.deletedBy ?? '')}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className='p-2' 
                              icon={<FiRotateCw className="w-4 h-4" />}
                              onClick={() => handleRestore(r.id ?? '', r.name ?? '')}
                            ></Button>
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
