import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'

type TransferItemId = string | number

export type TransferListItem = {
  id: TransferItemId
  label: string
}

type TransferListProps = {
  items: TransferListItem[]
  selectedIds: TransferItemId[]
  onChange: (nextIds: TransferItemId[]) => void
  availableTitle: string
  selectedTitle: string
  availableEmptyText: string
  selectedEmptyText: string
  searchPlaceholder: string
  noDataText: string
  hintText?: string
  reorder?: boolean
  clearLabel?: string
  addLabel?: string
}

const toKey = (value: TransferItemId) => String(value)

export function TransferList({
  items,
  selectedIds,
  onChange,
  availableTitle,
  selectedTitle,
  availableEmptyText,
  selectedEmptyText,
  searchPlaceholder,
  noDataText,
  hintText,
  reorder = false,
  clearLabel,
  addLabel = '+',
}: TransferListProps) {
  const [availableQuery, setAvailableQuery] = useState('')
  const [selectedQuery, setSelectedQuery] = useState('')

  const selectedSet = useMemo(
    () => new Set(selectedIds.map((id) => toKey(id))),
    [selectedIds],
  )

  const selectedItems = useMemo(() => {
    const byId = new Map(items.map((item) => [toKey(item.id), item]))
    return selectedIds
      .map((selectedId) => byId.get(toKey(selectedId)))
      .filter((item): item is TransferListItem => Boolean(item))
  }, [items, selectedIds])

  const filteredAvailableItems = useMemo(() => {
    const query = availableQuery.trim().toLowerCase()
    return items.filter((item) => {
      if (selectedSet.has(toKey(item.id))) return false
      if (!query) return true
      return item.label.toLowerCase().includes(query)
    })
  }, [items, selectedSet, availableQuery])

  const filteredSelectedItems = useMemo(() => {
    const query = selectedQuery.trim().toLowerCase()
    if (!query) return selectedItems
    return selectedItems.filter((item) => item.label.toLowerCase().includes(query))
  }, [selectedItems, selectedQuery])

  const addItem = (itemId: TransferItemId) => {
    onChange([...selectedIds, itemId])
  }

  const removeItem = (itemId: TransferItemId) => {
    onChange(selectedIds.filter((id) => toKey(id) !== toKey(itemId)))
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return
    const nextIds = [...selectedIds]
    const [moved] = nextIds.splice(index, 1)
    nextIds.splice(nextIndex, 0, moved)
    onChange(nextIds)
  }

  return (
    <div className="mt-2 grid gap-3 xl:grid-cols-2">
      <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold text-sm">{availableTitle}</div>
        </div>
        <div className="relative mb-2">
          <Input
            value={availableQuery}
            onChange={(e) => setAvailableQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="h-52 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 sm:h-56">
          {filteredAvailableItems.length === 0 && (
            <div className="text-xs text-gray-400">{availableEmptyText}</div>
          )}
          {filteredAvailableItems.map((item) => (
            <div
              key={toKey(item.id)}
              className="mb-1 flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/70"
            >
              <span className="line-clamp-1 text-sm">{item.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 h-7 px-2 text-emerald-600 hover:text-emerald-700 text-xs font-semibold"
                onClick={() => addItem(item.id)}
              >
                {addLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold text-sm">{selectedTitle}</div>
        </div>
        <div className="relative mb-2">
          <Input
            value={selectedQuery}
            onChange={(e) => setSelectedQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="h-52 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 sm:h-56">
          {selectedIds.length === 0 && (
            <div className="text-xs text-gray-400">{selectedEmptyText}</div>
          )}
          {selectedIds.length > 0 && filteredSelectedItems.length === 0 && (
            <div className="text-xs text-gray-400">{noDataText}</div>
          )}
          {filteredSelectedItems.map((item) => {
            const index = selectedIds.findIndex(
              (selectedId) => toKey(selectedId) === toKey(item.id),
            )
            return (
              <div
                key={toKey(item.id)}
                className="mb-1 flex items-start justify-between rounded-md px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              >
                <div className="flex min-w-0 items-start gap-2">
                  {reorder ? (
                    <span className="min-w-6 rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {index + 1}.
                    </span>
                  ) : null}
                  <span className="text-sm leading-5 break-words">{item.label}</span>
                </div>
                <div className="ml-1.5 flex shrink-0 items-center gap-0.5 sm:ml-2 sm:gap-1">
                  {reorder ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 sm:px-2"
                        disabled={index === 0}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 sm:px-2"
                        disabled={index === selectedItems.length - 1}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-red-600 hover:text-red-700 text-xs font-semibold"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(hintText || (clearLabel && selectedIds.length > 0)) ? (
        <div className="xl:col-span-2">
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">{hintText ?? ''}</p>
            {clearLabel && selectedIds.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                onClick={() => onChange([])}
              >
                {clearLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
