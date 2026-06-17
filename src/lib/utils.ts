import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''))
  return d.toLocaleDateString('pt-BR')
}

export function getMesAtual(): string {
  return getMesLabel(new Date())
}

export function getMesLabel(date: Date): string {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[date.getMonth()]}/${date.getFullYear()}`
}

export function getMesesAnteriores(count: number): string[] {
  const result: string[] = []
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${meses[d.getMonth()]}/${d.getFullYear()}`)
  }
  return result
}

export function parseMesReferencia(mes: string): Date {
  const mesesMap: Record<string, number> = {
    Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
    Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
  }
  const [m, y] = mes.split('/')
  return new Date(parseInt(y), mesesMap[m] ?? 0, 1)
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pago': return 'bg-green-100 text-green-700 border-green-200'
    case 'pendente': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'atrasado': return 'bg-red-100 text-red-700 border-red-200'
    case 'previsto': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'realizado': return 'bg-green-100 text-green-700 border-green-200'
    case 'fechado': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'aberto': return 'bg-blue-100 text-blue-700 border-blue-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pago: 'Pago',
    pendente: 'Pendente',
    atrasado: 'Atrasado',
    previsto: 'Previsto',
    realizado: 'Realizado',
    fechado: 'Fechado',
    aberto: 'Aberto',
  }
  return labels[status] ?? status
}

export function probabilidadeColor(prob: number): string {
  if (prob <= 30) return 'bg-red-100 text-red-700'
  if (prob <= 60) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T23:59:59')
  return d < new Date()
}

export function isWithinDays(dateStr: string | null | undefined, days: number): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T23:59:59')
  const limit = new Date()
  limit.setDate(limit.getDate() + days)
  return d >= new Date() && d <= limit
}
