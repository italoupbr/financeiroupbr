import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'muted' | 'outline'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#0873F7]/10 text-[#0873F7] border border-[#0873F7]/20',
  success: 'bg-green-50 text-green-700 border border-green-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  muted: 'bg-white/40 text-[#626F7F] border border-white/50',
  outline: 'bg-transparent text-[#626F7F] border border-white/40',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
