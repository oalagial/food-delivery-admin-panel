import type { ReactNode } from 'react'
import { TooltipHelpIcon } from './ui/tooltip'
import { cn } from '../lib/utils'

type PageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  /** Optional help bubble next to the title (e.g. from `t('common.toolbarHint…')`) */
  helpTooltip?: ReactNode
  /** Accessible label for the help control (e.g. `t('common.moreInfo')`) */
  helpAriaLabel?: string
  /** Right side: primary actions (e.g. create button) kept beside title on large screens */
  actions?: ReactNode
  className?: string
}

/**
 * Standard page title block: tracking-tight heading, optional subtitle, optional (?) help.
 * Use with `PageToolbarCard` below for filters/search rows.
 */
export function PageHeader({
  title,
  subtitle,
  helpTooltip,
  helpAriaLabel,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          {helpTooltip && helpAriaLabel ? (
            <TooltipHelpIcon content={helpTooltip} aria-label={helpAriaLabel} />
          ) : null}
        </div>
        {subtitle ? (
          <p className="max-w-2xl text-slate-600 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">{actions}</div> : null}
    </div>
  )
}

type PageToolbarCardProps = {
  children: ReactNode
  className?: string
}

/** Rounded filter / toolbar strip — matches customer list styling. */
export function PageToolbarCard({ children, className }: PageToolbarCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-slate-50/40 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-950/40 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
