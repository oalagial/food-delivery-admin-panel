import { useEffect, useState } from "react";
import { getOfferList } from "../utils/api";
import { FiPlus, FiEdit, FiTrash } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "../components/ui/table";

export default function Offers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true;
    getOfferList()
      .then((data) => {
        if (!mounted) return;
        setOffers(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Failed to load')
        setOffers([]) 
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    } 
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-600 mt-1">Manage your offers</p>
        </div>
        <Link to="/offers/creation"><Button variant="primary" icon={<FiPlus className="w-5 h-5" />} className="px-6 py-3 text-base">Create Offer</Button></Link>
      </div>
      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
              {/* <TableHeadCell>Actions</TableHeadCell> */}
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
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
       {!loading && <div>
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Price</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {offers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>No offers found.</TableCell>
                </TableRow>
              )}
              {offers.map((o) => (
                <TableRow key={o.id || o.name}>
                  <TableCell>{o.name ?? ''}</TableCell>
                  <TableCell>{o.description ?? ''}</TableCell>
                  <TableCell>{o.price ?? ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>}
    </div>
  )
  
}