import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<Variant, string> = {
  default: 'glass-button',
  outline: 'liquid-glass-sm text-[#273544] hover:border-[#0873F7]/40 transition-all',
  ghost: 'bg-transparent text-[#626F7F] hover:bg-white/40 border border-transparent',
  destructive: 'bg-[#EF4343] text-white hover:bg-[#d63030] border border-[#EF4343] transition-all hover:scale-[1.02] active:scale-[0.98]',
  success: 'bg-[#22c55e] text-white hover:bg-[#16a34a] border border-[#22c55e] transition-colors',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-xl',
  md: 'h-9 px-4 text-sm rounded-2xl',
  lg: 'h-10 px-6 text-sm rounded-2xl',
  icon: 'h-9 w-9 p-0 rounded-xl',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-medium',
          'cursor-pointer select-none',
          'disabled:opacity-50 disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0873F7] focus-visible:ring-offset-1',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
