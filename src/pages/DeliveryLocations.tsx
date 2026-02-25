import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { getDeliveryLocationsList, getRestaurantsList, updateDeliveryLocation } from '../utils/api'
import type { CreateDeliveryLocationPayload as DeliveryLocation, Restaurant as RestaurantType } from '../utils/api'

export default function DeliveryLocations() {
  const [locations, setLocations] = useState<Partial<DeliveryLocation>[]>([])
  const [restaurantsMap, setRestaurantsMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setError(err instanceof Error ? err.message : String(err) || 'Failed to load')
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
      setError(err instanceof Error ? err.message : String(err) || 'Failed to update location')
    }
  }

  // Helper function to render restaurants cell
  const renderRestaurantsCell = (loc: Partial<DeliveryLocation>) => {
    const anyLoc = loc as unknown as Record<string, unknown>
    // Try several possible shapes returned by different API versions
    const maybeArray = (key: string): unknown[] | null => {
      const v = anyLoc[key]
      return Array.isArray(v) ? (v as unknown[]) : null
    }
    const list = maybeArray('deliveredBy') ?? maybeArray('deliveredByRestaurants') ?? maybeArray('delivedByRestaurants') ?? []

    if (list.length === 0) return <span className="text-xs text-gray-400">None</span>;

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
          const fee = (typeof item.deliveryFee === 'number' || typeof item.deliveryFee === 'string') ? `Fee: €${String(item.deliveryFee)}` : ''
          const min = (typeof item.minOrder === 'number' || typeof item.minOrder === 'string') ? `Min: €${String(item.minOrder)}` : ''
          const inactive = item.isActive === false
          return (
            <span key={idx} className={inactive ? 'opacity-60' : ''}>
              <span className="font-medium">{name}</span>
              {fee && <span className="ml-2 bg-gray-100 rounded px-2 py-0.5 text-xs">{fee}</span>}
              {min && <span className="ml-2 bg-gray-100 rounded px-2 py-0.5 text-xs">{min}</span>}
              {inactive && <span className="ml-2 bg-red-200 text-red-800 rounded px-2 py-0.5 text-xs">Inactive</span>}
            </span>
          )
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Delivery Locations</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">Manage delivery zones and locations</p>
        </div>
        <Link to="/delivery-locations/creation" className="w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:inline">Create Location</span>
          </Button>
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <div className="mt-4">
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Address</TableHeadCell>
                <TableHeadCell>City</TableHeadCell>
                <TableHeadCell>Province</TableHeadCell>
                <TableHeadCell>Zip</TableHeadCell>
                <TableHeadCell>Country</TableHeadCell>
                <TableHeadCell>Active</TableHeadCell>
                <TableHeadCell>Restaurants</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Delivery Locations</h2>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {activeLocations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No active delivery locations found.
                </p>
              ) : (
                activeLocations.map((loc) => (
                  <Card
                    key={String(loc.id ?? '') + String(loc.name ?? '')}
                    className="shadow-sm"
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-semibold">
                        {loc.name ?? ''}
                      </CardTitle>
                      <p className="text-xs text-gray-600">
                        {[loc.city, loc.province, loc.country].filter(Boolean).join(', ')}
                      </p>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 pt-0 space-y-1">
                      <p className="text-xs text-gray-700">
                        {loc.address ?? ''}{loc.zipCode ? `, ${loc.zipCode}` : ''}
                      </p>
                      <p className="text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            loc.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {loc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">Restaurants:</span>{' '}
                        {renderRestaurantsCell(loc)}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 px-4 pb-4 pt-0">
                      <Link
                        to={`/delivery-locations/creation/${encodeURIComponent(
                          String(loc.id ?? ''),
                        )}`}
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
                        title={loc.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {loc.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="p-2 text-xs"
                        icon={<FiTrash className="w-4 h-4" />}
                      >
                        Delete
                      </Button>
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
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Address</TableHeadCell>
                    <TableHeadCell>City</TableHeadCell>
                    <TableHeadCell>Province</TableHeadCell>
                    <TableHeadCell>Zip</TableHeadCell>
                    <TableHeadCell>Country</TableHeadCell>
                    <TableHeadCell>Active</TableHeadCell>
                    <TableHeadCell>Restaurants</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {activeLocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11}>No active delivery locations found.</TableCell>
                    </TableRow>
                  )}

                  {activeLocations.map((loc) => (
                    <TableRow key={String(loc.id ?? '') + String(loc.name ?? '')}>
                      <TableCell>{loc.name ?? ''}</TableCell>
                      <TableCell>{loc.address ?? ''}</TableCell>
                      <TableCell>{loc.city ?? ''}</TableCell>
                      <TableCell>{loc.province ?? ''}</TableCell>
                      <TableCell>{loc.zipCode ?? ''}</TableCell>
                      <TableCell>{loc.country ?? ''}</TableCell>
                      <TableCell>{loc.isActive ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{renderRestaurantsCell(loc)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link to={`/delivery-locations/creation/${encodeURIComponent(String(loc.id ?? ''))}`}><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
                          <Button 
                            variant={loc.isActive ? "ghost" : "ghost"} 
                            size="sm" 
                            className='p-2' 
                            icon={loc.isActive ? <FiCheckCircle className="w-4 h-4 text-green-600" /> : <FiXCircle className="w-4 h-4 text-red-600" />}
                            onClick={() => toggleActiveStatus(loc)}
                            title={loc.isActive ? "Deactivate" : "Activate"}
                          ></Button>
                          <Button variant="danger" size="sm" className='p-2' icon={<FiTrash className="w-4 h-4" />}></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {deletedLocations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">Deleted Delivery Locations</h2>

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
                        <CardTitle className="text-base font-semibold text-gray-700">
                          {loc.name ?? ''}
                        </CardTitle>
                        <p className="text-xs text-gray-500">
                          {[loc.city, loc.province, loc.country].filter(Boolean).join(', ')}
                        </p>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-0 space-y-1">
                        <p className="text-xs text-gray-600">
                          {loc.address ?? ''}{loc.zipCode ? `, ${loc.zipCode}` : ''}
                        </p>
                        <p className="text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              loc.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {loc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                        <div className="text-xs text-gray-700">
                          <span className="font-semibold">Restaurants:</span>{' '}
                          {renderRestaurantsCell(loc)}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Deleted by:{' '}
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
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Name</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Address</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">City</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Province</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Zip</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Country</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Active</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Restaurants</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Deleted By</TableHeadCell>
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
                          <TableCell className="text-gray-600">{loc.isActive ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="text-gray-600">{renderRestaurantsCell(loc)}</TableCell>
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
