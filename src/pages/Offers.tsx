import { useEffect, useState } from "react";
import { getOfferList, deleteOffer, restoreOffer, updateOffer } from "../utils/api";
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle, FiRotateCw, FiAlertCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";

type OfferRowProps = {
  offer: any;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: (id: string | number, name?: string) => void;
  isDeleting?: boolean;
  onToggleActive?: (offer: any) => void;
};

function offerRowDetails(offer: any) {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {offer.groups.map((group: any) => (
        <Card key={group.id} className="h-full">
          <CardContent className="h-full flex flex-col p-4">

            {/* Header */}
            <div className="mb-3 border-b border-slate-200 dark:border-slate-600 pb-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                {group.name || `Group ${group.id}`}
              </h3>

              <div className="flex gap-4 text-xs text-gray-600 dark:text-slate-400 mt-1">
                <span>Min Selected: <b>{group.minItems}</b></span>
                <span>Max Selected: <b>{group.maxItems}</b></span>
              </div>
            </div>

            {/* Products */}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Products
              </h4>

              {group.offerGroupProducts.length === 0 ? (
                <p className="text-gray-400 dark:text-slate-500 text-sm">
                  No items in this group
                </p>
              ) : (
                <ul className="space-y-1">
                  {group.offerGroupProducts.map((og: any) => (
                    <li
                      key={og.id}
                      className="px-2 py-1 rounded bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200"
                    >
                      {og.product.name || og.product.id}
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

function OfferRow({ offer, isOpen, onToggle, onDelete, isDeleting = false, onToggleActive }: OfferRowProps) {
  return (
    <>
      {/* MAIN ROW */}
      <TableRow>
        <TableCell>{offer.name}</TableCell>
        <TableCell>{offer.description}</TableCell>
        <TableCell>{offer.price}</TableCell>
        <TableCell className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="inline-flex items-center justify-center"
            onClick={() => onToggleActive && onToggleActive(offer)}
            aria-label={offer.isActive ? 'Set inactive' : 'Set active'}
            icon={
              offer.isActive
                ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Active" />
                : <FiXCircle className="w-5 h-5 text-red-500" aria-label="Inactive" />
            }
          />
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
              onClick={() => onDelete && onDelete(offer.id, offer.name)}
              disabled={isDeleting}
            />
          </div>
        </TableCell>
      </TableRow>

      {/* DETAILS ROW */}
      {isOpen && (
        <TableRow className="bg-gray-50 dark:bg-slate-800/60">
          <TableCell colSpan={5} className="!p-0">
            {offer.groups.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-slate-400">No groups in this offer.</div>
            ) : (
              <div className="border-t border-gray-200 dark:border-slate-700">
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
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    type: 'delete' | 'restore' | null;
    id: string | number | null;
    name: string | null;
  }>({
    show: false,
    type: null,
    id: null,
    name: null,
  });

  const toggleRow = (id: string) => {
    setOpenRowId(prev => (prev === id ? null : id));
  }

  const loadOffers = () => {
    setLoading(true);
    getOfferList()
      .then((data) => {
        setOffers(data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load');
        setOffers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleDelete = async (id: string | number, name?: string) => {
    setConfirmDialog({
      show: true,
      type: 'delete',
      id,
      name: name ?? null,
    });
  };

  const handleRestore = async (id: string | number, name?: string) => {
    setConfirmDialog({
      show: true,
      type: 'restore',
      id,
      name: name ?? null,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      show: false,
      type: null,
      id: null,
      name: null,
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.id || !confirmDialog.type) return;

    try {
      if (confirmDialog.type === 'delete') {
        setDeletingId(confirmDialog.id);
        await deleteOffer(confirmDialog.id);
      } else if (confirmDialog.type === 'restore') {
        await restoreOffer(confirmDialog.id);
      }
      loadOffers();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${confirmDialog.type} offer`);
    } finally {
      setDeletingId(null);
      closeConfirmDialog();
    }
  };

  const activeOffers = offers.filter((o) => {
    const anyOffer = o as Record<string, unknown>;
    return !anyOffer.deletedBy;
  });

  const deletedOffers = offers.filter((o) => {
    const anyOffer = o as Record<string, unknown>;
    return !!anyOffer.deletedBy;
  });

  const handleToggleActive = async (offer: any) => {
    if (!offer.id) return;
    try {
      await updateOffer(offer.id, { isActive: !offer.isActive });
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offer.id ? { ...o, isActive: !offer.isActive } : o
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update offer status');
    }
  };

  return (
    <div className="space-y-6">
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
                  {confirmDialog.type === 'delete' ? 'Delete Offer' : 'Restore Offer'}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete'
                    ? `Are you sure you want to delete "${confirmDialog.name}"?`
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Offers</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">Manage your offers</p>
        </div>
        <Link to="/offers/creation" className="w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:inline">Create Offer</span>
          </Button>
        </Link>
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
                  <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200 dark:bg-slate-700" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!loading && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-slate-100">Active Offers</h2>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {activeOffers.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-slate-400">No active offers found.</p>
              ) : (
                activeOffers.map((o) => (
                  <Card key={o.id} className="shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {o.name}
                          </CardTitle>
                          <p className="text-xs text-gray-600 dark:text-slate-400">
                            {o.description || 'No description'}
                          </p>
                        </div>
                        <span
                          className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            }`}
                        >
                          {o.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 space-y-2 text-xs text-gray-700 dark:text-slate-300">
                      <p>
                        Price:{' '}
                        <span className="font-semibold">
                          {o.price != null ? `${o.price} €` : '-'}
                        </span>
                      </p>
                      <div className="flex justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 text-xs"
                          onClick={() => toggleRow(String(o.id))}
                        >
                          {openRowId === String(o.id) ? 'Hide details' : 'Details'}
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-xs"
                            icon={
                              o.isActive ? (
                                <FiCheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <FiXCircle className="w-4 h-4 text-red-600" />
                              )
                            }
                            onClick={() => handleToggleActive(o)}
                          />
                          <Link to={`/offers/creation/${o.id}`}>
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
                            onClick={() => handleDelete(o.id, o.name)}
                            disabled={deletingId === o.id}
                          />
                        </div>
                      </div>

                      {openRowId === String(o.id) && (
                        <div className="mt-2 border-t border-gray-200 dark:border-slate-700 pt-2">
                          {o.groups && o.groups.length > 0 ? (
                            offerRowDetails(o)
                          ) : (
                            <p className="text-xs">
                              No groups in this offer.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
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
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell>Price</TableHeadCell>
                    <TableHeadCell>Active</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {activeOffers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-gray-500 dark:text-slate-400">No active offers found.</TableCell>
                    </TableRow>
                  )}
                  {activeOffers.map((o) => (
                    <OfferRow
                      key={o.id}
                      offer={o}
                      isOpen={openRowId === String(o.id)}
                      onToggle={() => toggleRow(String(o.id))}
                      onDelete={handleDelete}
                      isDeleting={deletingId === o.id}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {deletedOffers.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-slate-400 mb-4">Deleted Offers</h2>
              <Table>
                <TableHead>
                  <tr className="bg-gray-100 dark:bg-slate-900">
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Name</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Description</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Price</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Active</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Deleted By</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">Actions</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {deletedOffers.map((o) => {
                    const anyOffer = o as Record<string, unknown>;
                    return (
                      <TableRow key={o.id} className="bg-gray-50 opacity-75 dark:bg-slate-800">
                        <TableCell className="text-gray-600 dark:text-slate-300">{o.name}</TableCell>
                        <TableCell className="text-gray-600 dark:text-slate-300">{o.description}</TableCell>
                        <TableCell className="text-gray-600 dark:text-slate-300">{o.price}</TableCell>
                        <TableCell className="text-gray-600 dark:text-slate-300">
                          {o.isActive
                            ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label="Available" />
                            : <FiXCircle className="w-5 h-5 text-red-500" aria-label="Not available" />}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-slate-400 text-sm">
                          {String(anyOffer.deletedBy ?? '')}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              icon={<FiRotateCw className="w-4 h-4" />}
                              onClick={() => handleRestore(o.id, o.name)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

