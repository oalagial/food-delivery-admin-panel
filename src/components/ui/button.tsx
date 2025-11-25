import * as React from 'react'
import { cn } from '../../lib/utils'

type Variant = 'default' | 'primary' | 'ghost' | 'danger'
type Size = 'default' | 'sm'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Optional icon to render inside the button (use react-icons) */
  icon?: React.ReactElement
  /** Position of the icon relative to children */
  iconPosition?: 'left' | 'right'
}

const base = 'inline-flex items-center gap-2 rounded-md border font-medium transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 disabled:pointer-events-none'

const variantClasses: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-800 border-transparent hover:bg-gray-200',
  primary: 'bg-blue-600 text-white border-transparent hover:bg-blue-700',
  ghost: 'bg-transparent border-gray-200 text-gray-800 hover:bg-gray-50',
  danger: 'bg-red-600 text-white border-transparent hover:bg-red-700',
}

const sizeClasses: Record<Size, string> = {
  default: 'px-3 py-1 text-sm',
  sm: 'px-2 py-0.5 text-sm',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', icon, iconPosition = 'left', children, ...props }, ref) => {
    // ensure icon gets a consistent size class
    const renderIcon = icon && React.isValidElement(icon)
      ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: cn('inline-block', (icon.props && (icon.props as any).className) || 'w-4 h-4') })
      : null

    return (
      <button
        ref={ref}
        className={cn(base, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {renderIcon && iconPosition === 'left' ? renderIcon : null}
        {children}
        {renderIcon && iconPosition === 'right' ? renderIcon : null}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
