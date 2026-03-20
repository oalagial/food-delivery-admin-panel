import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { TableHeadCell } from './ui/table'
import { cn } from '../lib/utils'
import type { OrderTableSortDir, OrderTableSortKey } from '../utils/orderTableSort'

type Props = {
  label: string
  colKey: OrderTableSortKey
  activeKey: OrderTableSortKey
  dir: OrderTableSortDir
  onSort: (k: OrderTableSortKey) => void
}

export function OrderTableSortHeadCell({ label, colKey, activeKey, dir, onSort }: Props) {
  const active = activeKey === colKey
  return (
    <TableHeadCell
      className={cn(
        'cursor-pointer select-none hover:bg-blue-100/60 dark:hover:bg-slate-600/40',
        active && 'text-indigo-700 dark:text-indigo-300'
      )}
      onClick={() => onSort(colKey)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center justify-center gap-1">
        {label}
        {active ? (
          dir === 'asc' ? (
            <FiChevronUp className="w-4 h-4 shrink-0" aria-hidden />
          ) : (
            <FiChevronDown className="w-4 h-4 shrink-0" aria-hidden />
          )
        ) : (
          <span className="inline-flex flex-col text-[10px] leading-none opacity-35" aria-hidden>
            <FiChevronUp className="w-3 h-3 -mb-0.5" />
            <FiChevronDown className="w-3 h-3" />
          </span>
        )}
      </span>
    </TableHeadCell>
  )
}
