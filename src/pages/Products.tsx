import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle, FiRotateCw, FiAlertCircle } from 'react-icons/fi'
import { getProductsList, restoreProduct, deleteProduct, updateProduct } from '../utils/api'
import type { Product } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { API_BASE } from '../config'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardTitle, CardHeader, CardFooter } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

type ProductRowProps = {
  product: Product;
  isOpen: boolean;
  onToggle: () => void;
  isDeleted?: boolean;
  onRestore?: (id: string | number, name: string) => void;
  onDelete?: (id: string | number, name: string) => void;
  onToggleAvailability?: (product: Product) => void;
};

function ProductRowDetails({ product }: { product: Product }) {
  const { t } = useTranslation()
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t('common.ingredients')}</CardTitle>
          <CardDescription>{t('common.ingredientsListDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {product.ingredients && product.ingredients.length > 0 ? (
            product.ingredients.map((ingredient, index) => (
              <ul key={index}>
                <li className="px-2 py-1 rounded bg-gray-50 border text-sm text-gray-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  {ingredient}
                </li>
              </ul>
            ))
          ) : (
            <h3 className="text-sm text-gray-500 dark:text-slate-400">{t('common.noIngredients')}</h3>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t('common.allergies')}</CardTitle>
          <CardDescription>{t('common.allergensDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {product.allergies && product.allergies.length > 0 ? (
            product.allergies.map((allergy, index) => (
              <ul key={index}>
                <li className="px-2 py-1 rounded bg-red-50 border border-red-200 text-sm text-red-800 dark:bg-red-900/40 dark:border-red-600/70 dark:text-red-300">
                  {String(allergy).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              </ul>
            ))
          ) : (
            <h3 className="text-sm text-gray-500 dark:text-slate-400">{t('common.noAllergens')}</h3>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t('common.extras')}</CardTitle>
          <CardDescription>{t('common.extrasDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {product.extras && product.extras.length > 0 ? (
            <ul>
              {product.extras.map((extra, index) => (
                <li
                  key={index}
                  className="px-2 py-1 rounded bg-gray-50 border text-sm text-gray-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                  {extra.name}{' '}
                  {extra.price != null ? t('common.extraPlusPrice', { price: extra.price }) : ''}
                </li>
              ))}
            </ul>
          ) : (
            <h3 className="text-sm text-gray-500 dark:text-slate-400">{t('common.noExtras')}</h3>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProductRow({ product, isOpen, onToggle, isDeleted = false, onRestore, onDelete, onToggleAvailability }: ProductRowProps) {
  const { t } = useTranslation()
  const anyProduct = product as unknown as Record<string, unknown>

  return (
    <>
      {/* MAIN ROW */}
      <TableRow className={isDeleted ? "bg-gray-50 opacity-75 dark:bg-slate-800" : ""}>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>{product.name ?? ''}</TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>
          {product.image ? (
            <img src={API_BASE + "/images/" + product.image} alt={product.name ?? t('productsPage.productAlt')} className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded" />
          )}
        </TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>{product.type?.name ?? ''}</TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>{product.price != null ? String(product.price) : ''} €</TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>
          {product.stockQuantity != null ? String(product.stockQuantity) : t('common.emDash')}
        </TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>
          {product.vatRate ? (
            product.vatRate === 'FOUR' ? '4%' :
              product.vatRate === 'FIVE' ? '5%' :
                product.vatRate === 'TEN' ? '10%' :
                  product.vatRate === 'TWENTY_TWO' ? '22%' : product.vatRate
          ) : '-'}
        </TableCell>
        <TableCell className={`text-center ${isDeleted ? "text-gray-600" : ""}`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="inline-flex items-center justify-center"
            disabled={isDeleted}
            onClick={() => !isDeleted && onToggleAvailability && onToggleAvailability(product)}
            aria-label={product.isAvailable ? t('common.setUnavailable') : t('common.setAvailable')}
            icon={
              product.isAvailable
                ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label={t('common.ariaAvailable')} />
                : <FiXCircle className="w-5 h-5 text-red-500" aria-label={t('common.ariaNotAvailable')} />
            }
          />
        </TableCell>
        {isDeleted ? (
          <>
            <TableCell className="text-gray-500 text-sm">{String(anyProduct.deletedBy ?? '')}</TableCell>
            <TableCell>
              {onRestore && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className='p-2'
                    onClick={() => onRestore(product.id ?? '', product.name ?? '')}
                    icon={<FiRotateCw className="w-4 h-4" />}
                  ></Button>
                </div>
              )}
            </TableCell>
          </>
        ) : (
          <TableCell>
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                {isOpen ? t('productsPage.hide') : t('productsPage.details')}
              </Button>
              <Link to={`/products/creation/${encodeURIComponent(String(product.id ?? ''))}`} ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
              <Button variant="danger" size="sm" icon={<FiTrash className="w-4 h-4" />} onClick={() => onDelete && onDelete(product.id ?? '', product.name ?? '')}></Button>
            </div>
          </TableCell>
        )}
      </TableRow>
      {/* DETAILS ROW */}
      {isOpen && !isDeleted && (
        <TableRow className="bg-gray-50 dark:bg-slate-900">
          <TableCell colSpan={8}>
            <ProductRowDetails product={product} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

const ACTIVE_PAGE_SIZE = 10

export default function Products() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openRowId, setOpenRowId] = useState<string | null>(null);
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

  const toggleRow = (id: string) => {
    setOpenRowId(prev => (prev === id ? null : id));
  }

  const loadProducts = () => {
    setLoading(true)
    getProductsList()
      .then((data) => {
        setItems(data)
        setError(null)
      })
      .catch((err) => {
        setError(err?.message || t('common.failedToLoad'))
        setItems([])
      })
      .finally(() => { setLoading(false) })
  }

  useEffect(() => {
    loadProducts()
  }, [])

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
        await deleteProduct(confirmDialog.id)
      } else if (confirmDialog.type === 'restore') {
        await restoreProduct(confirmDialog.id)
      }
      // Reload the products list after successful action
      loadProducts()
      closeConfirmDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : (confirmDialog.type === 'delete' ? t('common.failedDeleteProduct') : t('common.failedRestoreProduct')))
      closeConfirmDialog()
    }
  }

  const handleRestore = (id: string | number, name: string) => {
    openConfirmDialog('restore', id, name)
  }

  const handleDelete = (id: string | number, name: string) => {
    openConfirmDialog('delete', id, name)
  }

  const handleToggleAvailability = async (product: Product) => {
    if (!product.id) return
    try {
      await updateProduct(product.id, { isAvailable: !product.isAvailable })
      setItems((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isAvailable: !product.isAvailable } : p
        )
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failedUpdateAvailability'))
    }
  }

  // Separate active and deleted products
  const activeProducts = items.filter((p) => {
    const anyProduct = p as unknown as Record<string, unknown>
    return !anyProduct.deletedBy
  })
  const deletedProducts = items.filter((p) => {
    const anyProduct = p as unknown as Record<string, unknown>
    return anyProduct.deletedBy
  })

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return activeProducts

    return activeProducts.filter(p =>
      p.name?.toLowerCase().includes(q)
    )
  }, [activeProducts, search])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ACTIVE_PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ACTIVE_PAGE_SIZE
    return filteredItems.slice(start, start + ACTIVE_PAGE_SIZE)
  }, [filteredItems, page])

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
                  {confirmDialog.type === 'delete' ? t('common.deleteProductTitle') : t('common.restoreProductTitle')}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete'
                    ? t('common.deleteProductConfirm', { name: confirmDialog.name ?? '' })
                    : t('common.restoreProductConfirm', { name: confirmDialog.name ?? '' })}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('productsPage.title')}</h1>
            <p className="text-gray-600 mt-1 dark:text-slate-400">{t('productsPage.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="w-full sm:w-48">
              <Input
                placeholder={t('productsPage.searchPh')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link to="/products/creation" className="w-full sm:w-auto">
              <Button
                variant="primary"
                icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
              >
                <span className="sm:inline">{t('productsPage.createProduct')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {loading && (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>{t('productsPage.name')}</TableHeadCell>
                <TableHeadCell>{t('productsPage.image')}</TableHeadCell>
                <TableHeadCell>{t('productsPage.type')}</TableHeadCell>
                <TableHeadCell>{t('productsPage.price')}</TableHeadCell>
                <TableHeadCell>{t('productsPage.stock')}</TableHeadCell>
                <TableHeadCell>{t('productsPage.vat')}</TableHeadCell>
                <TableHeadCell>{t('productsPage.available')}</TableHeadCell>
                <TableHeadCell>{t('productsPage.actions')}</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, r) => (
                <TableRow key={r} className="animate-pulse">
                  {Array.from({ length: 8 }).map((__, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-full bg-gray-200 dark:bg-slate-700" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && (
          <>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-100 mb-4">{t('productsPage.activeHeading')}</h2>

              {/* Mobile: cards */}
              <div className="space-y-3 md:hidden">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t('productsPage.noActive')}</p>
                ) : (
                  paginatedItems.map((p) => {
                    const vatLabel = p.vatRate
                      ? p.vatRate === 'FOUR'
                        ? '4%'
                        : p.vatRate === 'FIVE'
                          ? '5%'
                          : p.vatRate === 'TEN'
                            ? '10%'
                            : p.vatRate === 'TWENTY_TWO'
                              ? '22%'
                              : String(p.vatRate)
                      : '-'

                    return (
                      <Card key={String(p.id)} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                          {p.image ? (
                            <img
                              src={API_BASE + '/images/' + p.image}
                              alt={p.name ?? t('productsPage.productAlt')}
                              className="h-12 w-12 flex-shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 flex-shrink-0 rounded bg-gray-100" />
                          )}
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base font-semibold">
                              {p.name ?? ''}
                            </CardTitle>
                            <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                              {p.type?.name ?? ''}
                            </p>
                          </div>
                          <span
                            className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.isAvailable
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              }`}
                          >
                            {p.isAvailable ? t('common.available') : t('common.unavailable')}
                          </span>
                        </CardHeader>

                        <CardContent className="px-4 pb-2 pt-0 space-y-1 text-xs text-gray-700 dark:text-slate-300">
                          <p>
                            {t('productsPage.priceLabel')}{' '}
                            <span className="font-semibold">
                              {p.price != null ? `${p.price} €` : '-'}
                            </span>
                            {typeof p.stockQuantity === 'number' && (
                              <span className="ml-2 text-gray-500">
                                • {t('productsPage.stockLabel')} {p.stockQuantity}
                              </span>
                            )}
                          </p>
                          <p>
                            {t('productsPage.vatLabel')}{' '}
                            <span className="font-medium">{vatLabel}</span>
                          </p>
                        </CardContent>

                        <CardFooter className="flex justify-between items-center px-4 pb-4 pt-0 gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2 text-xs"
                            onClick={() => toggleRow(String(p.id))}
                          >
                            {openRowId === String(p.id) ? t('common.hideDetails') : t('productsPage.details')}
                          </Button>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-xs"
                              icon={
                                p.isAvailable ? (
                                  <FiCheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <FiXCircle className="w-4 h-4 text-red-600" />
                                )
                              }
                              onClick={() => handleToggleAvailability(p)}
                            />
                            <Link to={`/products/creation/${encodeURIComponent(String(p.id ?? ''))}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-xs"
                                icon={<FiEdit className="w-4 h-4" />}
                              />
                            </Link>
                            <Button
                              variant="danger"
                              size="sm"
                              className="p-2 text-xs"
                              icon={<FiTrash className="w-4 h-4" />}
                              onClick={() => handleDelete(p.id ?? '', p.name ?? '')}
                            />
                          </div>
                        </CardFooter>

                        {openRowId === String(p.id) && (
                          <div className="border-t border-gray-100 dark:border-slate-700">
                            <ProductRowDetails product={p} />
                          </div>
                        )}
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
                      <TableHeadCell>{t('productsPage.name')}</TableHeadCell>
                      <TableHeadCell>{t('productsPage.image')}</TableHeadCell>
                      <TableHeadCell>{t('productsPage.type')}</TableHeadCell>
                      <TableHeadCell>{t('productsPage.price')}</TableHeadCell>
                      <TableHeadCell>{t('productsPage.stock')}</TableHeadCell>
                      <TableHeadCell>{t('productsPage.vat')}</TableHeadCell>
                      <TableHeadCell>{t('productsPage.available')}</TableHeadCell>
                      <TableHeadCell>{t('productsPage.actions')}</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {filteredItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-gray-500 dark:text-slate-400">
                          {t('productsPage.noActive')}
                        </TableCell>
                      </TableRow>
                    )}

                    {paginatedItems.map((p) => (
                      <ProductRow
                        key={String(p.id)}
                        product={p}
                        isOpen={openRowId === String(p.id)}
                        onToggle={() => toggleRow(String(p.id))}
                        onDelete={() => handleDelete(p.id ?? '', p.name ?? '')}
                        onToggleAvailability={handleToggleAvailability}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredItems.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
                  <div className="text-gray-600 dark:text-slate-400 text-sm mb-2 sm:mb-0">
                    {t('common.paginationSummary', { page, totalPages, total: filteredItems.length })}
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

            {deletedProducts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-600 dark:text-slate-400 mb-4">
                  {t('productsPage.deletedHeading')}
                </h2>
                <Table>
                  <TableHead>
                    <tr className="bg-gray-100 dark:bg-slate-900">
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.name')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.image')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.type')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.price')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.stock')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.vat')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.available')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.deletedBy')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.actions')}</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {deletedProducts.map((p) => (
                      <ProductRow
                        key={String(p.id)}
                        product={p}
                        isOpen={false}
                        onToggle={() => { }}
                        isDeleted={true}
                        onRestore={() => handleRestore(p.id ?? '', p.name ?? '')}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
