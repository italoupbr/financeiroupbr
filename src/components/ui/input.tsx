import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-xl px-3 py-2',
          'bg-white/55 border border-white/50',
          'text-sm text-[#273544] placeholder:text-[#626F7F]/60',
          'focus:outline-none focus:ring-2 focus:ring-[#0873F7]/30 focus:border-[#0873F7]/50 focus:bg-white/70',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-150',
          'backdrop-blur-sm',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
