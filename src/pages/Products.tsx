import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { getProductsList } from '../utils/api'
import type { Product } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { API_BASE } from '../config'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardTitle } from '../components/ui/card'

type ProductRowProps = {
  product: Product;
  isOpen: boolean;
  onToggle: () => void;
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

function ProductRow({ product, isOpen, onToggle }: ProductRowProps) {
  return (
    <>
      {/* MAIN ROW */}
      <TableRow>
        <TableCell>{product.name ?? ''}</TableCell>
        <TableCell>
          {product.image ? (
            <img src={API_BASE + "/images/" + product.image} alt={product.name ?? 'product'} className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded" />
          )}
        </TableCell>
        <TableCell>{product.type.name ?? ''}</TableCell>
        {/* <TableCell>{Array.isArray(product.ingredients) ? product.ingredients.join(', ') : ''}</TableCell> */}
        <TableCell>{product.price != null ? String(product.price) : ''} €</TableCell>
        <TableCell className="text-center">
          <span className="inline-flex items-center justify-center">
            {product.isAvailable
              ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Available" />
              : <FiXCircle className="w-5 h-5 text-red-500" aria-label="Not available" />}
          </span>
        </TableCell>
        {/* <TableCell>{product.createdAt ? new Date(String(product.createdAt)).toLocaleString() : ''}</TableCell> */}
        {/* <TableCell>{product.updatedAt ? new Date(String(product.updatedAt)).toLocaleString() : ''}</TableCell> */}
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
            <Button variant="danger" size="sm" icon={<FiTrash className="w-4 h-4" />}></Button>

          </div>
          </TableCell>
      </TableRow>
      {/* DETAILS ROW */}
      {isOpen && (
        <TableRow className="bg-gray-50">
          <TableCell colSpan={6}>
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

  const toggleRow = (id: string) => {
    setOpenRowId(prev => (prev === id ? null : id));
  }

  useEffect(() => {
    let mounted = true
    getProductsList()
      .then((data) => {
        if (!mounted) return
        setItems(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load')
        setItems([])
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return items

    return items.filter(p =>
      p.name?.toLowerCase().includes(q)
    )
  }, [items, search])


  return (
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
              <TableHeadCell>Available</TableHeadCell>
              {/* <TableHeadCell>Created</TableHeadCell> */}
              {/* <TableHeadCell>Updated</TableHeadCell> */}
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

        {!loading && (<Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Image</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              {/* <TableHeadCell>Ingredients</TableHeadCell> */}
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>Available</TableHeadCell>
              {/* <TableHeadCell>Created</TableHeadCell> */}
              {/* <TableHeadCell>Updated</TableHeadCell> */}
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {(!loading && filteredItems.length === 0) && (
              <TableRow>
                <TableCell colSpan={7}>No products found.</TableCell>
              </TableRow>
            )}

            {filteredItems.map((p) => (
              <ProductRow
                product={p}
                isOpen={openRowId === String(p.id)}
                onToggle={() => toggleRow(String(p.id))}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
