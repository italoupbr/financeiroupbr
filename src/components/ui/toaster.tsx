import { useEffect } from 'react'
import { useToast } from './use-toast'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts, subscribe } = useToast()

  useEffect(() => {
    const unsub = subscribe()
    return unsub
  }, [subscribe])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-2xl p-4',
            'liquid-glass-md shadow-xl',
            'animate-in',
          )}
        >
          {t.variant === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />}
          {t.variant === 'destructive' && <XCircle className="h-5 w-5 text-[#EF4343] mt-0.5 shrink-0" />}
          {(!t.variant || t.variant === 'default') && <Info className="h-5 w-5 text-[#0873F7] mt-0.5 shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-[#273544]">{t.title}</p>
            {t.description && (
              <p className="text-xs text-[#626F7F] mt-0.5">{t.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
