import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function notify() {
  toastListeners.forEach(fn => fn([...toasts]))
}

export function toast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { ...t, id }]
  notify()
  setTimeout(() => {
    toasts = toasts.filter(x => x.id !== id)
    notify()
  }, 4000)
}

export function useToast() {
  const [list, setList] = useState<Toast[]>(toasts)

  const subscribe = useCallback(() => {
    const fn = (t: Toast[]) => setList(t)
    toastListeners.push(fn)
    return () => {
      toastListeners = toastListeners.filter(x => x !== fn)
    }
  }, [])

  return { toasts: list, subscribe }
}
