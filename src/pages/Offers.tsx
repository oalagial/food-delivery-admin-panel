import { useEffect, useState } from "react";
import { getOfferList } from "../utils/api";
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type OfferRowProps = {
  offer: any;
  isOpen: boolean;
  onToggle: () => void;
};

function offerRowDetails(offer: any) {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {offer.groups.map((group: any) => (
        <Card key={group.id} className="h-full">
          <CardContent className="h-full flex flex-col p-4">

            {/* Header */}
            <div className="mb-3 border-b pb-2">
              <h3 className="font-semibold text-base">
                {group.name || `Group ${group.id}`}
              </h3>

              <div className="flex gap-4 text-xs text-gray-600 mt-1">
                <span>Min Selected: <b>{group.minItems}</b></span>
                <span>Max Selected: <b>{group.maxItems}</b></span>
              </div>
            </div>

            {/* Products */}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">
                PRODUCTS
              </h4>

              {group.products.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No items in this group
                </p>
              ) : (
                <ul className="space-y-1">
                  {group.products.map((product: any) => (
                    <li
                      key={product.id}
                      className="px-2 py-1 rounded bg-gray-50 border text-sm"
                    >
                      {product.name || product.id}
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function OfferRow({ offer, isOpen, onToggle }: OfferRowProps) {
  return (
    <>
      {/* MAIN ROW */}
      <TableRow>
        <TableCell>{offer.name}</TableCell>
        <TableCell>{offer.description}</TableCell>
        <TableCell>{offer.price}</TableCell>
        <TableCell className="text-center">
            <span className="inline-flex items-center justify-center">
              {offer.isActive
                ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Available" />
                : <FiXCircle className="w-5 h-5 text-red-500" aria-label="Not available" />}
            </span>
          </TableCell>
        <TableCell>
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {isOpen ? "Hide" : "Details"}
            </Button>

            <Link to={`/offers/creation/${offer.id}`}>
              <Button variant="ghost" size="sm" icon={<FiEdit className="w-4 h-4" />} />
            </Link>

            <Button
              variant="danger"
              size="sm"
              icon={<FiTrash className="w-4 h-4" />}
            />
          </div>
        </TableCell>
      </TableRow>

      {/* DETAILS ROW */}
      {isOpen && (
        <TableRow className="bg-gray-50">
          <TableCell colSpan={5}>
            {offer.groups.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No groups in this offer.</div>
            ) : (
            <div className="border-t border-gray-200">
              {offerRowDetails(offer)}
            </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}


export default function Offers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setOpenRowId(prev => (prev === id ? null : id));
  }

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
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && <div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Price</TableHeadCell>
              <TableHeadCell>Active</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {offers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No offers found.</TableCell>
              </TableRow>
            )}
            {offers.map((o) => (
              <OfferRow
                offer={o}
                isOpen={openRowId === o.id}
                onToggle={() => toggleRow(o.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>}
    </div>
  )
}

