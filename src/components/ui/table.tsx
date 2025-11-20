import * as React from 'react'
import { cn } from '../../lib/utils'

type TableProps = React.TableHTMLAttributes<HTMLTableElement>
type THeadProps = React.HTMLAttributes<HTMLTableSectionElement>
type TBodyProps = React.HTMLAttributes<HTMLTableSectionElement>
type TrProps = React.HTMLAttributes<HTMLTableRowElement>
type ThProps = React.ThHTMLAttributes<HTMLTableCellElement>
type TdProps = React.TdHTMLAttributes<HTMLTableCellElement>

export function Table({ className, ...props }: TableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200" {...props} />
    </div>
  )
}

export const TableHead = React.forwardRef<HTMLTableSectionElement, THeadProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-gray-50', className)} {...props} />
  )
)
TableHead.displayName = 'TableHead'

export const TableBody = React.forwardRef<HTMLTableSectionElement, TBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('bg-white divide-y divide-gray-200', className)} {...props} />
  )
)
TableBody.displayName = 'TableBody'

export const TableRow = React.forwardRef<HTMLTableRowElement, TrProps>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('odd:bg-white even:bg-gray-50', className)} {...props} />
  )
)
TableRow.displayName = 'TableRow'

export const TableHeadCell = React.forwardRef<HTMLTableCellElement, ThProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={cn('px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className)}
      {...props}
    />
  )
)
TableHeadCell.displayName = 'TableHeadCell'

export const TableCell = React.forwardRef<HTMLTableCellElement, TdProps>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-2 text-sm text-gray-700', className)} {...props} />
  )
)
TableCell.displayName = 'TableCell'

export default Table
