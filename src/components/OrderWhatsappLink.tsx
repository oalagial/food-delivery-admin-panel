import { useTranslation } from 'react-i18next'
import { FaWhatsapp } from 'react-icons/fa'
import { cn } from '../lib/utils'
import { whatsappMeHref } from '../utils/whatsappUrl'

type OrderWhatsappLinkProps = {
  phone?: string | null
  className?: string
  /** Icon-only (table / compact) or full-width row (mobile cards). */
  variant?: 'icon' | 'inline'
}

export function OrderWhatsappLink({ phone, className, variant = 'icon' }: OrderWhatsappLinkProps) {
  const { t } = useTranslation()
  const href = whatsappMeHref(phone)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center rounded-md text-[#25D366] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600',
        variant === 'inline' &&
          'w-full gap-2 border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      aria-label={t('common.openWhatsappAria')}
    >
      <FaWhatsapp className={variant === 'inline' ? 'h-6 w-6 shrink-0' : 'h-5 w-5'} aria-hidden />
      {variant === 'inline' ? <span>{t('common.whatsappContact')}</span> : null}
    </a>
  )
}
