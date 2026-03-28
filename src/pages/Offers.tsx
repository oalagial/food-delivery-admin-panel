import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOfferList, deleteOffer, restoreOffer, updateOffer } from "../utils/api";
import { API_BASE } from "../config";
import { FiPlus, FiEdit, FiTrash, FiCheckCircle, FiXCircle, FiRotateCw, FiAlertCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { perm } from "../utils/permissions";

type OfferRowProps = {
  offer: any;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: (id: string | number, name?: string) => void;
  isDeleting?: boolean;
  onToggleActive?: (offer: any) => void;
};

function OfferRowDetails({ offer }: { offer: any }) {
  const { t } = useTranslation();
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {offer.groups.map((group: any) => (
        <Card key={group.id} className="h-full">
          <CardContent className="h-full flex flex-col p-4">

            <div className="mb-3 border-b border-slate-200 dark:border-slate-600 pb-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                {group.name || t("offersPage.groupFallback", { id: group.id })}
              </h3>

              <div className="flex gap-4 text-xs text-gray-600 dark:text-slate-400 mt-1">
                <span>{t("offersPage.minSelected")}: <b>{group.minItems}</b></span>
                <span>{t("offersPage.maxSelected")}: <b>{group.maxItems}</b></span>
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                {t("common.products")}
              </h4>

              {group.offerGroupProducts.length === 0 ? (
                <p className="text-gray-400 dark:text-slate-500 text-sm">
                  {t("offersPage.noItemsInGroup")}
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
  );
}

function OfferRow({ offer, isOpen, onToggle, onDelete, isDeleting = false, onToggleActive }: OfferRowProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* MAIN ROW */}
      <TableRow>
        <TableCell>{offer.name}</TableCell>
        <TableCell>
          {offer.image ? (
            <img
              src={`${API_BASE}/images/${offer.image}`}
              alt={offer.name ?? t("offersPage.offerAlt")}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded" aria-hidden />
          )}
        </TableCell>
        <TableCell>{offer.description}</TableCell>
        <TableCell>{offer.price}</TableCell>
        <TableCell className="text-center">
          {perm("offers", "update") ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="inline-flex items-center justify-center"
              onClick={() => onToggleActive && onToggleActive(offer)}
              aria-label={offer.isActive ? t("common.deactivate") : t("common.activate")}
              icon={
                offer.isActive
                  ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label={t("common.active")} />
                  : <FiXCircle className="w-5 h-5 text-red-500" aria-label={t("common.inactive")} />
              }
            />
          ) : (
            <span className="inline-flex justify-center" aria-hidden>
              {offer.isActive ? (
                <FiCheckCircle className="w-5 h-5 text-green-500 opacity-70" aria-label={t("common.active")} />
              ) : (
                <FiXCircle className="w-5 h-5 text-red-500 opacity-70" aria-label={t("common.inactive")} />
              )}
            </span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {isOpen ? t("common.hide") : t("common.details")}
            </Button>

            {perm("offers", "update") ? (
              <Link to={`/offers/creation/${offer.id}`}>
                <Button variant="ghost" size="sm" icon={<FiEdit className="w-4 h-4" />} />
              </Link>
            ) : null}

            {perm("offers", "delete") ? (
              <Button
                variant="danger"
                size="sm"
                icon={<FiTrash className="w-4 h-4" />}
                onClick={() => onDelete && onDelete(offer.id, offer.name)}
                disabled={isDeleting}
              />
            ) : null}
          </div>
        </TableCell>
      </TableRow>

      {/* DETAILS ROW */}
      {isOpen && (
        <TableRow className="bg-gray-50 dark:bg-slate-800/60">
          <TableCell colSpan={6} className="!p-0">
            {offer.groups.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-slate-400">{t("offersPage.noGroupsInOffer")}</div>
            ) : (
              <div className="border-t border-gray-200 dark:border-slate-700">
                <OfferRowDetails offer={offer} />
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

const ACTIVE_PAGE_SIZE = 10;

export default function Offers() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1);
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
        setError(err?.message || t("common.failedToLoad"));
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
      setError(err instanceof Error ? err.message : t("common.failedSave"));
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
  const canSeeDeletedOffers = perm("offers", "restore");

  const totalPages = Math.max(1, Math.ceil(activeOffers.length / ACTIVE_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedActive = useMemo(() => {
    const start = (page - 1) * ACTIVE_PAGE_SIZE;
    return activeOffers.slice(start, start + ACTIVE_PAGE_SIZE);
  }, [activeOffers, page]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(
        (pn) =>
          pn === 1 ||
          pn === totalPages ||
          (pn >= page - 2 && pn <= page + 2)
      )
      .reduce((arr: (number | 'ellipsis')[], pn, idx, src) => {
        if (idx > 0 && pn - (src[idx - 1] as number) > 1) arr.push('ellipsis');
        arr.push(pn);
        return arr;
      }, []);
  }, [page, totalPages]);

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
      setError(err instanceof Error ? err.message : t("common.failedSave"));
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
                  {confirmDialog.type === 'delete' ? t("offersPage.deleteTitle") : t("offersPage.restoreTitle")}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete'
                    ? t("offersPage.deleteConfirm", { name: confirmDialog.name ?? "" })
                    : t("offersPage.restoreConfirm", { name: confirmDialog.name ?? "" })}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={closeConfirmDialog}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant={confirmDialog.type === 'delete' ? 'danger' : 'primary'}
                  onClick={handleConfirm}
                >
                  {confirmDialog.type === 'delete' ? t("common.delete") : t("common.restore")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t("offersPage.title")}</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">{t("offersPage.subtitle")}</p>
        </div>
        {perm("offers", "create") ? (
          <Link to="/offers/creation" className="w-full sm:w-auto">
            <Button
              variant="primary"
              icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="w-full justify-center px-4 py-2 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              <span className="sm:inline">{t("offersPage.create")}</span>
            </Button>
          </Link>
        ) : null}
      </div>
      {loading && (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>{t("offersPage.name")}</TableHeadCell>
              <TableHeadCell>{t("offersPage.image")}</TableHeadCell>
              <TableHeadCell>{t("offersPage.description")}</TableHeadCell>
              <TableHeadCell>{t("offersPage.price")}</TableHeadCell>
              <TableHeadCell>{t("common.status")}</TableHeadCell>
              <TableHeadCell>{t("offersPage.actions")}</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r} className="animate-pulse">
                {Array.from({ length: 6 }).map((__, c) => (
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
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-slate-100">{t("offersPage.activeHeading")}</h2>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {activeOffers.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-slate-400">{t("offersPage.noActive")}</p>
              ) : (
                paginatedActive.map((o) => (
                  <Card key={o.id} className="shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                      {o.image ? (
                        <img
                          src={`${API_BASE}/images/${o.image}`}
                          alt={o.name ?? t("offersPage.offerAlt")}
                          className="h-12 w-12 flex-shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 flex-shrink-0 rounded bg-gray-100 dark:bg-slate-700" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base font-semibold truncate">
                              {o.name}
                            </CardTitle>
                            <p className="text-xs text-gray-600 dark:text-slate-400">
                              {o.description || t("common.noDescription")}
                            </p>
                          </div>
                          <span
                            className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              }`}
                          >
                            {o.isActive ? t("common.active") : t("common.inactive")}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 space-y-2 text-xs text-gray-700 dark:text-slate-300">
                      <p>
                        {t("offersPage.price")}:{' '}
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
                          {openRowId === String(o.id) ? t("common.hideDetails") : t("common.details")}
                        </Button>
                        <div className="flex gap-1">
                          {perm("offers", "update") ? (
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
                          ) : null}
                          {perm("offers", "update") ? (
                            <Link to={`/offers/creation/${o.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-xs"
                                icon={<FiEdit className="w-4 h-4" />}
                              />
                            </Link>
                          ) : null}
                          {perm("offers", "delete") ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="p-2 text-xs"
                              icon={<FiTrash className="w-4 h-4" />}
                              onClick={() => handleDelete(o.id, o.name)}
                              disabled={deletingId === o.id}
                            />
                          ) : null}
                        </div>
                      </div>

                      {openRowId === String(o.id) && (
                        <div className="mt-2 border-t border-gray-200 dark:border-slate-700 pt-2">
                          {o.groups && o.groups.length > 0 ? (
                            <OfferRowDetails offer={o} />
                          ) : (
                            <p className="text-xs">
                              {t("offersPage.noGroupsInOffer")}
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
                    <TableHeadCell>{t("offersPage.name")}</TableHeadCell>
                    <TableHeadCell>{t("offersPage.image")}</TableHeadCell>
                    <TableHeadCell>{t("offersPage.description")}</TableHeadCell>
                    <TableHeadCell>{t("offersPage.price")}</TableHeadCell>
                    <TableHeadCell>{t("common.status")}</TableHeadCell>
                    <TableHeadCell>{t("offersPage.actions")}</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {activeOffers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-gray-500 dark:text-slate-400">{t("offersPage.noActive")}</TableCell>
                    </TableRow>
                  )}
                  {paginatedActive.map((o) => (
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

            {activeOffers.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
                <div className="text-gray-600 dark:text-slate-400 text-sm mb-2 sm:mb-0">
                  {t("common.paginationSummary", { page, totalPages, total: activeOffers.length })}
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    aria-label={t("common.firstPage")}
                  >
                    «
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label={t("common.prevPage")}
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
                    aria-label={t("common.nextPage")}
                  >
                    ›
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    aria-label={t("common.lastPage")}
                  >
                    »
                  </Button>
                </div>
              </div>
            )}
          </div>

          {canSeeDeletedOffers && deletedOffers.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-slate-400 mb-4">{t("offersPage.deletedHeading")}</h2>
              <Table>
                <TableHead>
                  <tr className="bg-gray-100 dark:bg-slate-900">
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t("offersPage.name")}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t("offersPage.image")}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t("offersPage.description")}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t("offersPage.price")}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t("common.status")}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t("productsPage.deletedBy")}</TableHeadCell>
                    <TableHeadCell className="text-gray-600 dark:text-slate-100">{t("offersPage.actions")}</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {deletedOffers.map((o) => {
                    const anyOffer = o as Record<string, unknown>;
                    return (
                      <TableRow key={o.id} className="bg-gray-50 opacity-75 dark:bg-slate-800">
                        <TableCell className="text-gray-600 dark:text-slate-300">{o.name}</TableCell>
                        <TableCell className="text-gray-600 dark:text-slate-300">
                          {o.image ? (
                            <img
                              src={`${API_BASE}/images/${o.image}`}
                              alt={o.name ?? t("offersPage.offerAlt")}
                              className="w-12 h-12 object-cover rounded opacity-90"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded" aria-hidden />
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-slate-300">{o.description}</TableCell>
                        <TableCell className="text-gray-600 dark:text-slate-300">{o.price}</TableCell>
                        <TableCell className="text-gray-600 dark:text-slate-300">
                          {o.isActive
                            ? <FiCheckCircle className="w-5 h-5 text-green-500" aria-label={t("common.ariaAvailable")} />
                            : <FiXCircle className="w-5 h-5 text-red-500" aria-label={t("common.ariaNotAvailable")} />}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-slate-400 text-sm">
                          {String(anyOffer.deletedBy ?? '')}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            {perm("offers", "restore") ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2"
                                icon={<FiRotateCw className="w-4 h-4" />}
                                onClick={() => handleRestore(o.id, o.name)}
                              />
                            ) : null}
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

