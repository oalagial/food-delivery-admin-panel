import { useTranslation } from 'react-i18next'
import { Select } from './ui/select'
import { Label } from './ui/label'
import { cn } from '../lib/utils'

export const TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

/** Widened to `number` so `useState(DEFAULT_TABLE_PAGE_SIZE)` is not inferred as literal `10`. */
export const DEFAULT_TABLE_PAGE_SIZE: number = TABLE_PAGE_SIZE_OPTIONS[0]

type Props = {
  value: number
  onChange: (value: number) => void
  id?: string
  className?: string
}

export function TableItemsPerPageSelect({ value, onChange, id = 'table-items-per-page', className }: Props) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Label htmlFor={id} className="mb-0 text-sm whitespace-nowrap text-gray-600 dark:text-slate-400">
        {t('common.itemsPerPage')}
      </Label>
      <Select
        id={id}
        className="w-auto min-w-[4.25rem] h-9 py-1"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={t('common.itemsPerPage')}
      >
        {TABLE_PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    </div>
  )
}
