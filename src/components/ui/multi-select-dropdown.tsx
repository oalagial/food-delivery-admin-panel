import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Checkbox } from './checkbox'

export type MultiSelectOption<T extends string> = { value: T; label: string }

export function MultiSelectDropdown<T extends string>({
  id,
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  id?: string
  options: MultiSelectOption<T>[]
  value: T[]
  onChange: (next: T[]) => void
  placeholder: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (v: T, checked: boolean) => {
    if (checked) {
      if (value.includes(v)) onChange(value)
      else onChange([...value, v])
    } else {
      onChange(value.filter((x) => x !== v))
    }
  }

  const summary =
    value.length === 0
      ? placeholder
      : options
          .filter((o) => value.includes(o.value))
          .map((o) => o.label)
          .join(', ')

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="default"
        id={id}
        className={cn(
          'h-auto min-h-9 w-full justify-between border border-input bg-zinc-100 px-3 py-2 text-left text-base font-normal shadow-sm dark:border-slate-700 dark:bg-slate-800',
        )}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="line-clamp-2 flex-1 pr-2 text-slate-900 dark:text-slate-100">
          {summary}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-600 transition-transform dark:text-slate-300', open && 'rotate-180')}
          aria-hidden
        />
      </Button>
      {open ? (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-white py-1 shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
          {options.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Checkbox
                checked={value.includes(o.value)}
                onCheckedChange={(c) => toggle(o.value, !!c)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
