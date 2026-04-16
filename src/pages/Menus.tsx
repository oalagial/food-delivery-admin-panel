import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { FiPlus, FiEdit, FiTrash, FiRotateCw, FiAlertCircle } from 'react-icons/fi'
import { getMenusList, restoreMenu, deleteMenu } from '../utils/api'
import { perm } from '../utils/permissions'
import type { MenuItem } from '../utils/api'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { PageHeader, PageToolbarCard } from '../components/page-layout'

export default function Menus() {
  const { t } = useTranslation()
  const [menus, setMenus] = useState<MenuItem[]>([])
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

  const loadMenus = () => {
    setLoading(true)
    getMenusList()
      .then((d) => {
        setMenus(d)
        setError(null)
      })
      .catch((e) => {
        setError(String(e))
        setMenus([])
      })
      .finally(() => { setLoading(false) })
  }

  useEffect(() => {
    loadMenus()
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
        await deleteMenu(confirmDialog.id)
      } else if (confirmDialog.type === 'restore') {
        await restoreMenu(confirmDialog.id)
      }
      // Reload the menus list after successful action
      loadMenus()
      closeConfirmDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failedSave'))
      closeConfirmDialog()
    }
  }

  const handleRestore = (id: string | number, name: string) => {
    openConfirmDialog('restore', id, name)
  }

  const handleDelete = (id: string | number, name: string) => {
    openConfirmDialog('delete', id, name)
  }

  // Separate active and deleted menus
  const activeMenus = menus.filter((m) => {
    const anyMenu = m as unknown as Record<string, unknown>
    return !anyMenu.deletedBy
  })
  const deletedMenus = menus.filter((m) => {
    const anyMenu = m as unknown as Record<string, unknown>
    return anyMenu.deletedBy
  })
  const canSeeDeletedMenus = perm('menus', 'restore')

  return (
    <>
      {/* Confirmation Dialog Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeConfirmDialog}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <Alert variant="destructive">
                <FiAlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {confirmDialog.type === 'delete' ? t('menusPage.deleteTitle') : t('menusPage.restoreTitle')}
                </AlertTitle>
                <AlertDescription>
                  {confirmDialog.type === 'delete'
                    ? t('menusPage.deleteConfirm', { name: confirmDialog.name ?? '' })
                    : t('menusPage.restoreConfirm', { name: confirmDialog.name ?? '' })}
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
        <div className="space-y-5">
          <PageHeader
            title={t('menusPage.title')}
            subtitle={t('menusPage.subtitle')}
            helpTooltip={t('common.toolbarHintDefault')}
            helpAriaLabel={t('common.moreInfo')}
          />
          {perm('menus', 'create') ? (
            <PageToolbarCard>
              <div className="flex flex-wrap justify-end gap-3">
                <Link to="/menus/creation" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    icon={<FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="h-9 w-full justify-center px-4 text-sm sm:w-auto sm:px-6"
                  >
                    <span className="sm:inline">{t('menusPage.create')}</span>
                  </Button>
                </Link>
              </div>
            </PageToolbarCard>
          ) : null}
        </div>

        {loading ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>{t('menusPage.name')}</TableHeadCell>
                <TableHeadCell>{t('common.description')}</TableHeadCell>
                <TableHeadCell>{t('menusPage.restaurant')}</TableHeadCell>
                <TableHeadCell>{t('menusPage.sections')}</TableHeadCell>
                <TableHeadCell>{t('common.created')}</TableHeadCell>
                <TableHeadCell>{t('menusPage.actions')}</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, r) => (
                <TableRow key={r} className="animate-pulse">
                  {Array.from({ length: 6 }).map((__, c) => (
                    <TableCell key={c}><Skeleton className="h-4 w-full bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : error ? <div className="text-red-600">{error}</div> : (
          <>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t('menusPage.activeHeading')}</h2>

              {/* Mobile: cards */}
              <div className="space-y-3 md:hidden">
                {activeMenus.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-50">{t('menusPage.noActive')}</p>
                ) : (
                  activeMenus.map((m) => {
                    const anyMenu = m as unknown as Record<string, unknown>
                    const restaurant = (anyMenu.restaurant as any) || null
                    const sectionsLabel =
                      Array.isArray((m as any).sections) && (m as any).sections.length > 0
                        ? (m as any).sections.map((s: any) => s?.name ?? s?.id).join(', ')
                        : (m.sectionIds || []).length

                    return (
                      <Card key={String(m.id)} className="shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base font-semibold">
                            {m.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-2 pt-0 space-y-1 text-xs text-gray-700 dark:text-slate-50">
                          <p>
                            {m.description || t('common.noDescription')}
                          </p>
                          <p>
                            {t('menusPage.restaurant')}:{' '}
                            <span className="font-medium">
                              {restaurant?.name || t('common.emDash')}
                            </span>
                          </p>
                          <p>
                            {t('menusPage.sections')}:{' '}
                            <span className="font-medium">
                              {sectionsLabel || t('common.emDash')}
                            </span>
                          </p>
                          {m.createdAt && (
                            <p className="text-[11px]">
                              {t('common.created')}:{' '}
                              {new Date(String(m.createdAt)).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-1 px-4 pb-4 pt-0">
                          {perm('menus', 'update') ? (
                            <Link to={`/menus/creation/${m.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-xs"
                                icon={<FiEdit className="w-4 h-4" />}
                              />
                            </Link>
                          ) : null}
                          {perm('menus', 'delete') ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="p-2 text-xs"
                              icon={<FiTrash className="w-4 h-4" />}
                              onClick={() => handleDelete(m.id ?? '', m.name ?? '')}
                            />
                          ) : null}
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
                    <TableRow>
                      <TableHeadCell>{t('menusPage.name')}</TableHeadCell>
                      <TableHeadCell>{t('common.description')}</TableHeadCell>
                      <TableHeadCell>{t('menusPage.restaurant')}</TableHeadCell>
                      <TableHeadCell>{t('menusPage.sections')}</TableHeadCell>
                      <TableHeadCell>{t('common.created')}</TableHeadCell>
                      <TableHeadCell>{t('menusPage.actions')}</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeMenus.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>{t('menusPage.noActive')}</TableCell>
                      </TableRow>
                    )}
                    {activeMenus.map((m) => {
                      const anyMenu = m as unknown as Record<string, unknown>
                      const restaurant = (anyMenu.restaurant as any) || null
                      return (
                        <TableRow key={String(m.id)}>
                          <TableCell>{m.name}</TableCell>
                          <TableCell>{m.description}</TableCell>
                          <TableCell>{restaurant?.name || ''}</TableCell>
                          <TableCell>
                            {Array.isArray((m as any).sections) && (m as any).sections.length > 0
                              ? (m as any).sections.map((s: any) => s?.name ?? s?.id).join(', ')
                              : (m.sectionIds || []).length}
                          </TableCell>
                          <TableCell>{m.createdAt ? new Date(String(m.createdAt)).toLocaleString() : ''}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              {perm('menus', 'update') ? (
                                <Link to={`/menus/creation/${m.id}`}>
                                  <Button size="sm" variant="ghost" icon={<FiEdit className="w-4 h-4" />}></Button>
                                </Link>
                              ) : null}
                              {perm('menus', 'delete') ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<FiTrash className="w-4 h-4" />}
                                  onClick={() => handleDelete(m.id ?? '', m.name ?? '')}
                                ></Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {canSeeDeletedMenus && deletedMenus.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">{t('menusPage.deletedHeading')}</h2>
                <Table>
                  <TableHead>
                    <TableRow className="bg-gray-100 dark:bg-slate-900">
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('menusPage.name')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.description')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('menusPage.restaurant')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('menusPage.sections')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('common.created')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('productsPage.deletedBy')}</TableHeadCell>
                      <TableHeadCell className="text-gray-600 dark:text-slate-100">{t('menusPage.actions')}</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deletedMenus.map((m) => {
                      const anyMenu = m as unknown as Record<string, unknown>
                      const restaurant = (anyMenu.restaurant as any) || null
                      return (
                        <TableRow key={String(m.id)} className="bg-gray-50 opacity-75 dark:bg-slate-800">
                          <TableCell className="text-gray-600">{m.name}</TableCell>
                          <TableCell className="text-gray-600">{m.description}</TableCell>
                          <TableCell className="text-gray-600">{restaurant?.name || ''}</TableCell>
                          <TableCell className="text-gray-600">
                            {Array.isArray((m as any).sections) && (m as any).sections.length > 0
                              ? (m as any).sections.map((s: any) => s?.name ?? s?.id).join(', ')
                              : (m.sectionIds || []).length}
                          </TableCell>
                          <TableCell className="text-gray-600">{m.createdAt ? new Date(String(m.createdAt)).toLocaleString() : ''}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{String(anyMenu.deletedBy ?? '')}</TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              {perm('menus', 'restore') ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className='p-2'
                                  onClick={() => handleRestore(m.id ?? '', m.name ?? '')}
                                  icon={<FiRotateCw className="w-4 h-4" />}
                                ></Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
