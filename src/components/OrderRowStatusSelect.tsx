import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { FiChevronDown } from 'react-icons/fi'
import { cn } from '../lib/utils'
import { orderStatusPillClass } from '../utils/orderStatusFilter'

type OrderRowStatusSelectProps = {
  orderId: string | number | undefined | null
  value: string | undefined
  options: string[]
  getOptionLabel: (code: string) => string
  canEdit: boolean
  /** Another row is currently saving */
  locked?: boolean
  saving?: boolean
  onCommit: (orderId: string, status: string) => Promise<void>
  /** Wider trigger (e.g. mobile header) */
  triggerClassName?: string
}

export function OrderRowStatusSelect({
  orderId,
  value,
  options,
  getOptionLabel,
  canEdit,
  locked = false,
  saving = false,
  onCommit,
  triggerClassName,
}: OrderRowStatusSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [menuStyle, setMenuStyle] = useState<{
    top: number
    left: number
    minWidth: number
  }>({ top: 0, left: 0, minWidth: 168 })
  const idStr = orderId != null && String(orderId) !== '' ? String(orderId) : ''

  const updateMenuPosition = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pad = 4
    const minW = Math.max(r.width, 168)
    let top = r.bottom + pad
    let left = r.left
    const maxH = 240
    if (top + maxH > window.innerHeight - 8) {
      top = Math.max(8, r.top - pad - maxH)
    }
    if (left + minW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - minW - 8)
    }
    setMenuStyle({ top, left, minWidth: minW })
  }

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPosition()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onScroll = () => updateMenuPosition()
    const onResize = () => updateMenuPosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const node = e.target as Node
      if (triggerRef.current?.contains(node)) return
      if (menuRef.current?.contains(node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const displayCode = value ?? ''
  const displayLabel = displayCode ? getOptionLabel(displayCode) : t('common.emDash')
  const pill = orderStatusPillClass(displayCode)
  const disabled = !canEdit || !idStr || locked || saving

  const onPick = async (code: string) => {
    if (disabled || code === displayCode) {
      setOpen(false)
      return
    }
    setOpen(false)
    await onCommit(idStr, code)
  }

  if (!canEdit) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap',
          pill,
          triggerClassName,
        )}
      >
        {displayLabel}
      </span>
    )
  }

  const menu =
    open && !saving && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={menuRef}
            className="fixed z-[200] max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-600 dark:bg-slate-800"
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              minWidth: menuStyle.minWidth,
            }}
            role="listbox"
          >
            {options.map((code) => {
              const active = code === displayCode
              return (
                <li key={code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full min-w-0 items-center px-3 py-2 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700',
                      active && 'bg-amber-50 font-medium dark:bg-amber-900/30',
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      void onPick(code)
                    }}
                  >
                    {getOptionLabel(code)}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )
      : null

  return (
    <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('ordersPage.changeStatusAria')}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) setOpen((v) => !v)
        }}
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded-full border border-transparent px-2 py-1 text-xs font-semibold whitespace-nowrap transition hover:ring-2 hover:ring-amber-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 disabled:cursor-not-allowed disabled:opacity-60',
          pill,
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate">{saving ? t('ordersPage.statusUpdating') : displayLabel}</span>
        {!saving ? <FiChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden /> : null}
      </button>
      {menu}
    </div>
  )
}
