import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  formatDate,
  getMesAtual,
  isOverdue,
  isWithinDays,
} from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { CalendarDays, Check, List } from 'lucide-react'
import type { Despesa, FolhaPagamento, Imposto } from '@/types'

// ─── Discriminated union ──────────────────────────────────────────────────────

type ItemTipo = 'despesa' | 'folha' | 'imposto'

interface UnifiedItem {
  id: string
  tipo: ItemTipo
  descricao: string
  categoria: string | null
  data_vencimento: string | null
  valor: number
  status: string
}

function toUnified(
  despesas: Despesa[],
  folha: FolhaPagamento[],
  impostos: Imposto[]
): UnifiedItem[] {
  const d: UnifiedItem[] = despesas.map((x) => ({
    id: x.id,
    tipo: 'despesa',
    descricao: x.descricao,
    categoria: x.categoria_nome,
    data_vencimento: x.data_vencimento,
    valor: x.valor,
    status: x.status,
  }))

  const f: UnifiedItem[] = folha.map((x) => ({
    id: x.id,
    tipo: 'folha',
    descricao: x.funcionario + (x.cargo ? ` — ${x.cargo}` : ''),
    categoria: 'Folha de Pagamento',
    data_vencimento: x.data_pagamento,
    valor: x.salario,
    status: x.status,
  }))

  const i: UnifiedItem[] = impostos.map((x) => ({
    id: x.id,
    tipo: 'imposto',
    descricao: x.tipo + (x.descricao ? ` — ${x.descricao}` : ''),
    categoria: 'Impostos',
    data_vencimento: x.data_vencimento,
    valor: x.valor,
    status: x.status,
  }))

  return [...d, ...f, ...i]
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

function sortItems(items: UnifiedItem[]): UnifiedItem[] {
  return [...items].sort((a, b) => {
    const aOver = isOverdue(a.data_vencimento)
    const bOver = isOverdue(b.data_vencimento)
    if (aOver && !bOver) return -1
    if (!aOver && bOver) return 1
    if (!a.data_vencimento && !b.data_vencimento) return 0
    if (!a.data_vencimento) return 1
    if (!b.data_vencimento) return -1
    return a.data_vencimento.localeCompare(b.data_vencimento)
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

function getStatusLabel(item: UnifiedItem): string {
  if (isOverdue(item.data_vencimento)) return 'Atrasado'
  if (isToday(item.data_vencimento)) return 'Vence hoje'
  if (isWithinDays(item.data_vencimento, 7)) return 'Vence em 7d'
  return 'Pendente'
}

function getStatusStyle(item: UnifiedItem): string {
  if (isOverdue(item.data_vencimento))
    return 'bg-red-100 text-red-700 border-red-200'
  if (isToday(item.data_vencimento))
    return 'bg-orange-100 text-orange-700 border-orange-200'
  if (isWithinDays(item.data_vencimento, 7))
    return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

type TipoBadge = Record<ItemTipo, string>
const TIPO_LABEL: Record<ItemTipo, string> = {
  despesa: 'Despesa',
  folha: 'Folha',
  imposto: 'Imposto',
}
const TIPO_STYLE: TipoBadge = {
  despesa: 'bg-blue-100 text-blue-700 border-blue-200',
  folha: 'bg-purple-100 text-purple-700 border-purple-200',
  imposto: 'bg-red-100 text-red-700 border-red-200',
}

type FilterTab = 'todos' | 'despesas' | 'folha' | 'impostos' | 'atraso'

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

interface CalendarDay {
  day: number
  items: UnifiedItem[]
}

function buildCalendarData(
  items: UnifiedItem[],
  year: number,
  month: number
): (CalendarDay | null)[] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)
  const cells: (CalendarDay | null)[] = Array(firstDow).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayItems = items.filter((i) => i.data_vencimento === dateStr)
    cells.push({ day: d, items: dayItems })
  }

  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function dotColor(items: UnifiedItem[]): string {
  if (items.some((i) => isOverdue(i.data_vencimento))) return '#EF4343'
  if (items.some((i) => isToday(i.data_vencimento))) return '#f97316'
  if (items.some((i) => isWithinDays(i.data_vencimento, 7))) return '#f59e0b'
  return '#94a3b8'
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[rgba(255,255,255,0.45)] ${className ?? ''}`}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContasAPagar() {
  const mesAtual = getMesAtual()

  // Parse mesAtual to get year/month for calendar
  const parseMes = useCallback((mes: string) => {
    const mesesMap: Record<string, number> = {
      Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
      Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
    }
    const [m, y] = mes.split('/')
    return { year: parseInt(y), month: mesesMap[m] ?? 0 }
  }, [])

  const { year: calYear, month: calMonth } = parseMes(mesAtual)

  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [folha, setFolha] = useState<FolhaPagamento[]>([])
  const [impostos, setImpostos] = useState<Imposto[]>([])
  const [pagosDespesas, setPagosDespesas] = useState<Despesa[]>([])
  const [pagosFolha, setPagosFolha] = useState<FolhaPagamento[]>([])
  const [pagosImpostos, setPagosImpostos] = useState<Imposto[]>([])

  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')
  const [calendarView, setCalendarView] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [dRes, fRes, iRes, dpRes, fpRes, ipRes] = await Promise.all([
        supabase
          .from('despesas')
          .select('*')
          .eq('mes_referencia', mesAtual)
          .in('status', ['pendente', 'atrasado']),
        supabase
          .from('folha_pagamento')
          .select('*')
          .eq('mes_referencia', mesAtual)
          .eq('status', 'pendente'),
        supabase
          .from('impostos')
          .select('*')
          .eq('mes_referencia', mesAtual)
          .eq('status', 'pendente'),
        // paid items for "Já Pago" summary
        supabase
          .from('despesas')
          .select('*')
          .eq('mes_referencia', mesAtual)
          .eq('status', 'pago'),
        supabase
          .from('folha_pagamento')
          .select('*')
          .eq('mes_referencia', mesAtual)
          .eq('status', 'pago'),
        supabase
          .from('impostos')
          .select('*')
          .eq('mes_referencia', mesAtual)
          .eq('status', 'pago'),
      ])

      if (dRes.error) throw dRes.error
      if (fRes.error) throw fRes.error
      if (iRes.error) throw iRes.error
      if (dpRes.error) throw dpRes.error
      if (fpRes.error) throw fpRes.error
      if (ipRes.error) throw ipRes.error

      setDespesas(dRes.data ?? [])
      setFolha(fRes.data ?? [])
      setImpostos(iRes.data ?? [])
      setPagosDespesas(dpRes.data ?? [])
      setPagosFolha(fpRes.data ?? [])
      setPagosImpostos(ipRes.data ?? [])
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar contas a pagar',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function marcarPago(item: UnifiedItem) {
    const today = new Date().toISOString().split('T')[0]
    setMarkingPaid(item.id)
    try {
      let error: { message: string } | null = null

      if (item.tipo === 'despesa') {
        const res = await supabase
          .from('despesas')
          .update({ status: 'pago', data_pagamento: today })
          .eq('id', item.id)
        error = res.error
      } else if (item.tipo === 'folha') {
        const res = await supabase
          .from('folha_pagamento')
          .update({ status: 'pago', data_pagamento: today })
          .eq('id', item.id)
        error = res.error
      } else {
        const res = await supabase
          .from('impostos')
          .update({ status: 'pago', data_pagamento: today })
          .eq('id', item.id)
        error = res.error
      }

      if (error) throw error
      toast({ title: 'Marcado como pago', variant: 'success' })
      await fetchData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao marcar como pago',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setMarkingPaid(null)
    }
  }

  // ─── Computed ───────────────────────────────────────────────────────────────

  const allPending = toUnified(despesas, folha, impostos)
  const sorted = sortItems(allPending)

  const totalPendente = allPending.reduce((s, i) => s + i.valor, 0)

  const totalPago =
    pagosDespesas.reduce((s, d) => s + d.valor, 0) +
    pagosFolha.reduce((s, f) => s + f.salario, 0) +
    pagosImpostos.reduce((s, i) => s + i.valor, 0)

  const totalRestante = totalPendente

  const vencendo7 = allPending.filter(
    (i) => isWithinDays(i.data_vencimento, 7)
  )
  const vencendo7Count = vencendo7.length
  const vencendo7Sum = vencendo7.reduce((s, i) => s + i.valor, 0)

  // Aging buckets
  const bucketAVencer = sorted.filter(
    (i) => !isOverdue(i.data_vencimento) && !isToday(i.data_vencimento) && !isWithinDays(i.data_vencimento, 7)
  )
  const bucketEm7 = sorted.filter(
    (i) => isWithinDays(i.data_vencimento, 7)
  )
  const bucketHoje = sorted.filter((i) => isToday(i.data_vencimento))
  const bucketVencido = sorted.filter((i) => isOverdue(i.data_vencimento))

  // Filter tabs
  const filteredItems = (() => {
    switch (activeTab) {
      case 'despesas':
        return sorted.filter((i) => i.tipo === 'despesa')
      case 'folha':
        return sorted.filter((i) => i.tipo === 'folha')
      case 'impostos':
        return sorted.filter((i) => i.tipo === 'imposto')
      case 'atraso':
        return sorted.filter((i) => isOverdue(i.data_vencimento))
      default:
        return sorted
    }
  })()

  // Calendar data
  const calCells = buildCalendarData(allPending, calYear, calMonth)
  const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((k) => (
            <div
              key={k}
              className="liquid-glass-md rounded-3xl p-4 space-y-2"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <div className="liquid-glass-md rounded-3xl p-5 space-y-3">
          {[0, 1, 2, 3, 4].map((k) => (
            <Skeleton key={k} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#273544]">Contas a Pagar</h2>
          <p className="text-sm text-[#626F7F]">{mesAtual}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCalendarView((v) => !v)}
          className={calendarView ? 'bg-white/30 border-[#0873F7] text-[#0873F7]' : ''}
          title={calendarView ? 'Visualização em lista' : 'Visualização em calendário'}
        >
          {calendarView ? (
            <List className="h-4 w-4" />
          ) : (
            <CalendarDays className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] mb-1">Total a Pagar este mês</p>
          <p className="font-mono font-bold text-[#273544] text-base">
            {formatCurrency(totalPendente + totalPago)}
          </p>
          <p className="text-xs text-[#626F7F] mt-0.5">
            {allPending.length + pagosDespesas.length + pagosFolha.length + pagosImpostos.length} itens
          </p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] mb-1">Já Pago</p>
          <p className="font-mono font-bold text-[#22c55e] text-base">
            {formatCurrency(totalPago)}
          </p>
          <p className="text-xs text-[#626F7F] mt-0.5">
            {pagosDespesas.length + pagosFolha.length + pagosImpostos.length} itens
          </p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] mb-1">A Pagar restante</p>
          <p className="font-mono font-bold text-[#f59e0b] text-base">
            {formatCurrency(totalRestante)}
          </p>
          <p className="text-xs text-[#626F7F] mt-0.5">
            {allPending.length} itens
          </p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] mb-1">Vencendo em 7 dias</p>
          <p className="font-mono font-bold text-[#EF4343] text-base">
            {formatCurrency(vencendo7Sum)}
          </p>
          <p className="text-xs text-[#626F7F] mt-0.5">
            {vencendo7Count} {vencendo7Count === 1 ? 'item' : 'itens'}
          </p>
        </div>
      </div>

      {/* ── Aging buckets ─────────────────────────────────────────────────────── */}
      <div className="liquid-glass-md rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F2F6FA' }}>
              <th className="text-left px-4 py-2.5 text-[#273544] font-semibold">Situação</th>
              <th className="text-center px-4 py-2.5 text-[#273544] font-semibold">Qtd</th>
              <th className="text-right px-4 py-2.5 text-[#273544] font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[rgba(255,255,255,0.45)]">
              <td className="px-4 py-2.5 text-[#626F7F]">A vencer</td>
              <td className="px-4 py-2.5 text-center text-[#273544] font-medium">{bucketAVencer.length}</td>
              <td className="px-4 py-2.5 text-right font-mono text-[#273544]">
                {formatCurrency(bucketAVencer.reduce((s, i) => s + i.valor, 0))}
              </td>
            </tr>
            <tr className="border-t border-[rgba(255,255,255,0.45)]">
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[#f59e0b] font-medium">
                  Vence em 7d
                </span>
              </td>
              <td className="px-4 py-2.5 text-center font-medium" style={{ color: '#f59e0b' }}>{bucketEm7.length}</td>
              <td className="px-4 py-2.5 text-right font-mono font-medium" style={{ color: '#f59e0b' }}>
                {formatCurrency(bucketEm7.reduce((s, i) => s + i.valor, 0))}
              </td>
            </tr>
            <tr className="border-t border-[rgba(255,255,255,0.45)]">
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: '#f97316' }}>
                  Vence hoje
                </span>
              </td>
              <td className="px-4 py-2.5 text-center font-medium" style={{ color: '#f97316' }}>{bucketHoje.length}</td>
              <td className="px-4 py-2.5 text-right font-mono font-medium" style={{ color: '#f97316' }}>
                {formatCurrency(bucketHoje.reduce((s, i) => s + i.valor, 0))}
              </td>
            </tr>
            <tr className="border-t border-[rgba(255,255,255,0.45)]">
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[#EF4343] font-medium">
                  Vencido
                </span>
              </td>
              <td className="px-4 py-2.5 text-center font-medium text-[#EF4343]">{bucketVencido.length}</td>
              <td className="px-4 py-2.5 text-right font-mono font-medium text-[#EF4343]">
                {formatCurrency(bucketVencido.reduce((s, i) => s + i.valor, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Calendar view ─────────────────────────────────────────────────────── */}
      {calendarView && (
        <div className="liquid-glass-md rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-[#273544] mb-4">{mesAtual} — Calendário de Vencimentos</h3>
          <div className="grid grid-cols-7 gap-1">
            {DOW_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-[#626F7F] py-1"
              >
                {d}
              </div>
            ))}
            {calCells.map((cell, idx) => {
              if (cell === null) {
                return <div key={`empty-${idx}`} />
              }
              const hasItems = cell.items.length > 0
              const color = hasItems ? dotColor(cell.items) : null
              const tooltipLines = cell.items
                .map((i) => `${i.descricao}: ${formatCurrency(i.valor)}`)
                .join('\n')

              return (
                <div
                  key={`day-${cell.day}`}
                  className="relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg min-h-[42px] cursor-default"
                  style={{
                    backgroundColor: hoveredDay === cell.day && hasItems ? '#F2F6FA' : undefined,
                  }}
                  onMouseEnter={() => hasItems && setHoveredDay(cell.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={hasItems ? tooltipLines : undefined}
                >
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: hasItems ? color ?? '#273544' : '#94a3b8',
                    }}
                  >
                    {cell.day}
                  </span>
                  {hasItems && (
                    <span
                      className="h-2 w-2 rounded-full mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: color ?? '#94a3b8' }}
                    />
                  )}
                  {hoveredDay === cell.day && hasItems && (
                    <div
                      className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1 bg-[#273544] text-white text-xs rounded-lg shadow-lg px-2.5 py-2 whitespace-nowrap min-w-[160px]"
                      style={{ pointerEvents: 'none' }}
                    >
                      {cell.items.map((i) => (
                        <div key={i.id} className="flex justify-between gap-3">
                          <span className="truncate max-w-[120px]">{i.descricao}</span>
                          <span className="font-mono font-medium">{formatCurrency(i.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[rgba(255,255,255,0.45)]">
            <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
              <span className="h-2 w-2 rounded-full bg-[#EF4343]" /> Vencido
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
              <span className="h-2 w-2 rounded-full bg-[#f97316]" /> Vence hoje
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Vence em breve
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
              <span className="h-2 w-2 rounded-full bg-[#94a3b8]" /> A vencer
            </span>
          </div>
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────────────────────── */}
      <div className="liquid-glass-md rounded-3xl p-5">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 mb-4 border-b border-[rgba(255,255,255,0.45)] pb-3">
          {(
            [
              { key: 'todos', label: 'Todos' },
              { key: 'despesas', label: 'Despesas' },
              { key: 'folha', label: 'Folha' },
              { key: 'impostos', label: 'Impostos' },
              { key: 'atraso', label: 'Em Atraso' },
            ] as { key: FilterTab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === t.key ? '#0873F7' : 'transparent',
                color: activeTab === t.key ? '#ffffff' : '#626F7F',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Check
              className="h-10 w-10 mb-3"
              style={{ color: '#22c55e' }}
            />
            <p className="text-sm font-medium text-[#273544]">Nenhum pagamento pendente</p>
            <p className="text-xs text-[#626F7F] mt-1">Todos os itens desta categoria estão em dia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const overdue = isOverdue(item.data_vencimento)
                  return (
                    <TableRow key={`${item.tipo}-${item.id}`}>
                      <TableCell className="font-medium text-[#273544] max-w-[200px] truncate">
                        {item.descricao}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${TIPO_STYLE[item.tipo]}`}
                        >
                          {TIPO_LABEL[item.tipo]}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#626F7F] text-sm">
                        {item.categoria ?? (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: overdue ? '#EF4343' : '#273544', fontWeight: overdue ? 600 : 400 }}
                        >
                          {formatDate(item.data_vencimento)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[#273544]">
                        {formatCurrency(item.valor)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStatusStyle(item)}`}
                        >
                          {getStatusLabel(item)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => marcarPago(item)}
                          disabled={markingPaid === item.id}
                          title="Marcar como pago"
                        >
                          {markingPaid === item.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredItems.length > 0 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-[rgba(255,255,255,0.45)]">
            <span className="text-xs text-[#626F7F]">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
            </span>
            <span className="font-mono font-bold text-sm text-[#273544]">
              Total: {formatCurrency(filteredItems.reduce((s, i) => s + i.valor, 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
