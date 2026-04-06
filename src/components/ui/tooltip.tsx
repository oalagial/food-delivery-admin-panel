import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

type Side = 'top' | 'bottom'

type TooltipProps = {
  children: ReactNode
  content: ReactNode
  side?: Side
  /** Delay before showing (ms) */
  delayDuration?: number
  /** Delay before hiding (ms) */
  closeDelay?: number
  className?: string
  /** Max width for the bubble */
  contentClassName?: string
}

export function Tooltip({
  children,
  content,
  side = 'bottom',
  delayDuration = 180,
  closeDelay = 80,
  className,
  contentClassName,
}: TooltipProps) {
  const id = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, transform: 'translateX(-50%)' })
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current)
      showTimer.current = null
    }
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const margin = 8
    if (side === 'bottom') {
      setCoords({
        top: r.bottom + margin,
        left: r.left + r.width / 2,
        transform: 'translateX(-50%)',
      })
    } else {
      setCoords({
        top: r.top - margin,
        left: r.left + r.width / 2,
        transform: 'translate(-50%, -100%)',
      })
    }
  }, [side])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onScroll = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const scheduleShow = () => {
    clearTimers()
    showTimer.current = setTimeout(() => {
      updatePosition()
      setOpen(true)
    }, delayDuration)
  }

  const scheduleHide = () => {
    clearTimers()
    hideTimer.current = setTimeout(() => setOpen(false), closeDelay)
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex max-w-full', className)}
        onMouseEnter={scheduleShow}
        onMouseLeave={scheduleHide}
        onFocus={scheduleShow}
        onBlur={scheduleHide}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[9999] max-w-xs transition-opacity duration-150',
              'rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-left text-xs leading-relaxed text-slate-800 shadow-lg ring-1 ring-black/5 backdrop-blur-sm',
              'dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-100 dark:ring-white/10',
              contentClassName,
            )}
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.transform,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

type TooltipHelpIconProps = {
  content: ReactNode
  'aria-label': string
  className?: string
}

/** Small “?” control for inline help — pair with descriptive `aria-label`. */
export function TooltipHelpIcon({ content, 'aria-label': ariaLabel, className }: TooltipHelpIconProps) {
  return (
    <Tooltip content={content} contentClassName="max-w-sm">
      <button
        type="button"
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-500 shadow-sm transition-colors',
          'hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 dark:ring-offset-slate-950',
          'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-100',
          className,
        )}
        aria-label={ariaLabel}
      >
        ?
      </button>
    </Tooltip>
  )
}
