import { type HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { FiX } from 'react-icons/fi'
import { Input } from './ui/input'
import { Label } from './ui/label'

export const SEARCH_FILTER_DEBOUNCE_MS = 800

type SearchFilterFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
}

export function SearchFilterField({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: SearchFilterFieldProps) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          autoComplete="off"
          className="w-full pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
        />
        {value ? (
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-200"
            onClick={() => onChange('')}
            aria-label={t('common.clearField')}
          >
            <FiX className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}
