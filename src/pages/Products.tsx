import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle, FiRotateCw, FiAlertCircle } from 'react-icons/fi'
import { getProductsList, restoreProduct, deleteProduct } from '../utils/api'
import type { Product } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { API_BASE } from '../config'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardTitle } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

type ProductRowProps = {
  product: Product;
  isOpen: boolean;
  onToggle: () => void;
  isDeleted?: boolean;
  onRestore?: (id: string | number, name: string) => void;
  onDelete?: (id: string | number, name: string) => void;
};

function productRowDetails(product: Product) {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Ingredients */}
      <Card className='shadow-md'>
        <CardTitle className='m-2'>Ingredients</CardTitle>
        <CardDescription>List of ingredients for this product</CardDescription>
        <CardContent>
          { product.ingredients && product.ingredients.length > 0 ? (
              product.ingredients.map((ingredient, index) => (
                <ul>
                  <li key={index} className="px-2 py-1 rounded bg-gray-50 border text-sm">{ingredient}</li>
                </ul>
              ))
            ) : (<h3>No ingredients listed.</h3>)  
          }
        </CardContent>
      </Card>
      {/* Extras */}
      <Card>
        <CardTitle className='m-2'>Extras</CardTitle>
        <CardDescription>Available extras for this product</CardDescription>
        <CardContent>
          { product.extras && product.extras.length > 0 ? (
            <ul>
              {product.extras.map((extra, index) => (
                <li key={index} className="px-2 py-1 rounded bg-gray-50 border text-sm">
                  {extra.name} {extra.price != null ? `(+${extra.price} €)` : ''}
                </li>
              ))}
            </ul>
            ) : (<h3>No extras available.</h3>)
          }
        </CardContent>
      </Card>
    </div>
  )
}

function ProductRow({ product, isOpen, onToggle, isDeleted = false, onRestore, onDelete }: ProductRowProps) {
  const anyProduct = product as unknown as Record<string, unknown>
  
  return (
    <>
      {/* MAIN ROW */}
      <TableRow className={isDeleted ? "bg-gray-50 opacity-75" : ""}>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>{product.name ?? ''}</TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>
          {product.image ? (
            <img src={API_BASE + "/images/" + product.image} alt={product.name ?? 'product'} className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded" />
          )}
        </TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>{product.type?.name ?? ''}</TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>{product.price != null ? String(product.price) : ''} €</TableCell>
        <TableCell className={isDeleted ? "text-gray-600" : ""}>
          {product.vatRate ? (
            product.vatRate === 'FOUR' ? '4%' :
            product.vatRate === 'FIVE' ? '5%' :
            product.vatRate === 'TEN' ? '10%' :
            product.vatRate === 'TWENTY_TWO' ? '22%' : product.vatRate
          ) : '-'}
        </TableCell>
        <TableCell className={`text-center ${isDeleted ? "text-gray-600" : ""}`}>
          <span className="inline-flex items-center justify-center">
            {product.isAvailable
              ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Available" />
              : <FiXCircle className="w-5 h-5 text-red-500" aria-label="Not available" />}
          </span>
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
                {isOpen ? "Hide" : "Details"}
              </Button>
              <Link to={`/products/creation/${encodeURIComponent(String(product.id ?? ''))}`} ><Button variant="ghost" className='p-2' size="sm" icon={<FiEdit className="w-4 h-4" />}></Button></Link>
              <Button variant="danger" size="sm" icon={<FiTrash className="w-4 h-4" />} onClick={() => onDelete && onDelete(product.id ?? '', product.name ?? '')}></Button>
            </div>
          </TableCell>
        )}
      </TableRow>
      {/* DETAILS ROW */}
      {isOpen && !isDeleted && (
        <TableRow className="bg-gray-50">
          <TableCell colSpan={isDeleted ? 7 : 6}>
            {productRowDetails(product)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
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
        setError(err?.message || 'Failed to load')
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
      setError(err instanceof Error ? err.message : `Failed to ${confirmDialog.type} product`)
      closeConfirmDialog()
    }
  }

  const handleRestore = (id: string | number, name: string) => {
    openConfirmDialog('restore', id, name)
  }

  const handleDelete = (id: string | number, name: string) => {
    openConfirmDialog('delete', id, name)
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
                  {confirmDialog.type === 'delete' ? 'Delete Product' : 'Restore Product'}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete' 
                    ? `Are you sure you want to delete "${confirmDialog.name}"?.`
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant products</p>
        </div>
        <div className="flex flex-row items-center gap-4">
          <div className="w-36">
            <Input
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/products/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Product</Button></Link>
        </div>
      </div>

      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Image</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              {/* <TableHeadCell>Ingredients</TableHeadCell> */}
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>VAT</TableHeadCell>
              <TableHeadCell>Available</TableHeadCell>
              {/* <TableHeadCell>Created</TableHeadCell> */}
              {/* <TableHeadCell>Updated</TableHeadCell> */}
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 8 }).map((__, c) => (
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Products</h2>
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Image</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                  {/* <TableHeadCell>Ingredients</TableHeadCell> */}
                  <TableHeadCell>Price</TableHeadCell>
                  <TableHeadCell>VAT</TableHeadCell>
                  <TableHeadCell>Available</TableHeadCell>
                  {/* <TableHeadCell>Created</TableHeadCell> */}
                  {/* <TableHeadCell>Updated</TableHeadCell> */}
                  <TableHeadCell>Actions</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>No active products found.</TableCell>
                  </TableRow>
                )}

                {filteredItems.map((p) => (
                  <ProductRow
                    key={String(p.id)}
                    product={p}
                    isOpen={openRowId === String(p.id)}
                    onToggle={() => toggleRow(String(p.id))}
                    onDelete={() => handleDelete(p.id ?? '', p.name ?? '')}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {deletedProducts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">Deleted Products</h2>
              <Table>
                <TableHead>
                  <tr className="bg-gray-100">
                    <TableHeadCell className="text-gray-600">Name</TableHeadCell>
                    <TableHeadCell className="text-gray-600">Image</TableHeadCell>
                    <TableHeadCell className="text-gray-600">Type</TableHeadCell>
                    <TableHeadCell className="text-gray-600">Price</TableHeadCell>
                    <TableHeadCell className="text-gray-600">VAT</TableHeadCell>
                    <TableHeadCell className="text-gray-600">Available</TableHeadCell>
                    <TableHeadCell className="text-gray-600">Deleted By</TableHeadCell>
                    <TableHeadCell className="text-gray-600">Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {deletedProducts.map((p) => (
                    <ProductRow
                      key={String(p.id)}
                      product={p}
                      isOpen={false}
                      onToggle={() => {}}
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
