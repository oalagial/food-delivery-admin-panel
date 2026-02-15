import { useEffect, useState } from 'react'
import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'
import { authFetch } from '../utils/api'

type Customer = {
  id?: number | string
  name?: string
  email?: string
  phone?: string
  createdAt?: string
  [key: string]: unknown
}


export default function CustomerCollection() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function fetchCustomers() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/customers')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = Array.isArray(json) ? json : json?.data ?? Object.values(json ?? {})
      setCustomers(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCustomers()
  }, [])

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Collection</h1>
          <p className="text-gray-600 mt-1">View and manage customers</p>
        </div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Phone</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 5 }).map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (customer.name && String(customer.name).toLowerCase().includes(q)) ||
      (customer.email && String(customer.email).toLowerCase().includes(q)) ||
      (customer.phone && String(customer.phone).toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Collection</h1>
        <p className="text-gray-600 mt-1">View and manage customers</p>
      </div>

      <div>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full max-w-xs mb-4"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="text-red-600"><strong>Error:</strong> {error}</div>}

      <div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Phone</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {/* Show message if no filtered customers */}
            {filteredCustomers.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5}>No customers found.</TableCell>
              </TableRow>
            )}
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{String(customer.name ?? '—')}</TableCell>
                <TableCell>{String(customer.email ?? '—')}</TableCell>
                <TableCell>{String(customer.phone ?? '—')}</TableCell>
                <TableCell>{customer.createdAt ? new Date(String(customer.createdAt)).toLocaleString() : '—'}</TableCell>
                <TableCell>
                  {/* Actions can be added here if needed */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
