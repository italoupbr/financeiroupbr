import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { asaas } from '@/lib/asaas'
import { formatCurrency, formatDate, getMesAtual } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import {
  RefreshCw, CheckCircle2, Clock, AlertCircle, Zap, TrendingUp,
} from 'lucide-react'
import type { Receita } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Payment {
  id: string
  customer: string
  customerName: string
  value: number
  status: string
  paymentDate: string | null
  dueDate: string
  description: string | null
  billingType: string
}

// ─── Matching logic ───────────────────────────────────────────────────────────

const LEGAL_STOP = /\b(ltda|s\.?a\.?|me|epp|eireli|servicos|servico|comercio|houara|brasil|consultoria)\b/g

function kw(s: string): Set<string> {
  const words = s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(LEGAL_STOP, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
  return new Set(words)
}

function namesMatch(a: string, b: string): boolean {
  const setA = kw(a)
  const setB = kw(b)
  for (const w of setA) if (setB.has(w)) return true
  return false
}

function findMatch(name: string, value: number, pool: Receita[]): Receita | null {
  const byValue = pool.filter(r => Math.abs(r.valor - value) / Math.max(r.valor, 0.01) < 0.02)
  if (byValue.length === 1) return byValue[0]
  for (const r of byValue) if (namesMatch(name, r.cliente_nome ?? '')) return r
  for (const r of pool) {
    const diff = Math.abs(r.valor - value) / Math.max(r.valor, 0.01)
    if (diff < 0.05 && namesMatch(name, r.cliente_nome ?? '')) return r
  }
  return null
}

function daysDiff(dateStr: string): number {
  const target = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

function billingLabel(type: string): string {
  const map: Record<string, string> = {
    PIX: 'Pix', BOLETO: 'Boleto', CREDIT_CARD: 'Cartão', TRANSFER: 'TED', DEPOSIT: 'Depósito',
  }
  return map[type] ?? type
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegracaoAsaas() {
  const [received, setReceived] = useState<Payment[]>([])
  const [pending, setPending] = useState<Payment[]>([])
  const [overdue, setOverdue] = useState<Payment[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mes = getMesAtual()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSyncDone(false)

    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const dateFrom = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const dateTo = new Date(y, m + 1, 0).toISOString().split('T')[0]

    try {
      const [charges, customers, supaRes] = await Promise.all([
        asaas.getMonthCharges(dateFrom, dateTo),
        asaas.getCustomersAll(),
        supabase.from('receitas').select('*').eq('mes_referencia', mes).order('cliente_nome'),
      ])

      const custMap = new Map<string, string>()
      for (const c of customers) custMap.set(c.id, c.name)

      const enrich = (p: any): Payment => ({
        id: p.id,
        customer: p.customer,
        customerName: custMap.get(p.customer) ?? p.description ?? '—',
        value: p.value,
        status: p.status,
        paymentDate: p.paymentDate ?? null,
        dueDate: p.dueDate,
        description: p.description ?? null,
        billingType: p.billingType ?? '',
      })

      setReceived((charges.received as any[]).map(enrich))
      setPending((charges.pending as any[]).map(enrich))
      setOverdue((charges.overdue as any[]).map(enrich))
      setReceitas(supaRes.data ?? [])
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Sync ─────────────────────────────────────────────────────────────────

  async function sincronizar() {
    setSyncing(true)
    let updated = 0
    const pool = receitas.filter(r => r.status !== 'pago')

    for (const p of received) {
      const match = findMatch(p.customerName, p.value, pool)
      if (!match) continue
      const { error } = await supabase
        .from('receitas')
        .update({
          status: 'pago',
          data_pagamento: p.paymentDate ?? new Date().toISOString().split('T')[0],
        })
        .eq('id', match.id)
      if (!error) {
        updated++
        const idx = pool.findIndex(r => r.id === match.id)
        if (idx !== -1) pool.splice(idx, 1)
      }
    }

    setSyncing(false)
    setSyncDone(true)
    toast({
      title: updated > 0
        ? `${updated} receita${updated !== 1 ? 's' : ''} sincronizada${updated !== 1 ? 's' : ''}`
        : 'Tudo já estava sincronizado',
      description: updated > 0
        ? 'Status atualizado para "pago" no banco'
        : 'Nenhuma atualização necessária',
      variant: updated > 0 ? 'default' : 'destructive',
    })
    await fetchData()
  }

  // ─── KPIs ─────────────────────────────────────────────────────────────────

  const totalReceived = received.reduce((s, p) => s + p.value, 0)
  const totalPending  = pending.reduce((s, p) => s + p.value, 0)
  const totalOverdue  = overdue.reduce((s, p) => s + p.value, 0)
  const totalExpected = totalReceived + totalPending + totalOverdue
  const taxa = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0

  const mesLabel = mes.split('/')[0]

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="liquid-glass-md rounded-3xl p-5 animate-pulse">
          <div className="h-4 w-56 bg-white/40 rounded mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/30 rounded-2xl" />)}
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="liquid-glass-md rounded-3xl p-5 animate-pulse">
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => <div key={j} className="h-12 bg-white/30 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="liquid-glass-md rounded-3xl p-10 text-center">
          <AlertCircle className="h-10 w-10 text-[#EF4343] mx-auto mb-3" />
          <p className="text-[#273544] font-semibold mb-1">Erro ao carregar dados</p>
          <p className="text-sm text-[#626F7F] mb-4">{error}</p>
          <Button onClick={fetchData}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-[#626F7F]">Dados em tempo real via API Asaas · {mes}</p>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
          <Button
            onClick={sincronizar}
            disabled={syncing || received.length === 0}
            size="sm"
            className="gap-1.5"
          >
            {syncing
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Zap className="h-3.5 w-3.5" />}
            {syncing ? 'Sincronizando...' : 'Sincronizar com DB'}
          </Button>
          {syncDone && (
            <span className="flex items-center gap-1 text-sm text-[#22c55e] font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Concluído
            </span>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] font-medium mb-1">Recebido em {mesLabel}</p>
          <p className="font-mono text-xl font-bold text-[#22c55e]">{formatCurrency(totalReceived)}</p>
          <p className="text-xs text-[#626F7F] mt-1">{received.length} pagamento{received.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] font-medium mb-1">Aguardando</p>
          <p className="font-mono text-xl font-bold text-[#f59e0b]">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-[#626F7F] mt-1">{pending.length} cobrança{pending.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] font-medium mb-1">Vencido</p>
          <p className="font-mono text-xl font-bold text-[#EF4343]">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-[#626F7F] mt-1">{overdue.length} cobrança{overdue.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] font-medium mb-1">Taxa de Recebimento</p>
          <p className="font-mono text-xl font-bold text-[#0873F7]">{taxa.toFixed(0)}%</p>
          <p className="text-xs text-[#626F7F] mt-1">do esperado em {mesLabel}</p>
        </div>
      </div>

      {/* Received */}
      {received.length > 0 && (
        <div className="liquid-glass-md rounded-3xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/30">
            <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
            <span className="font-semibold text-[#273544] text-sm">
              Recebidos em {mesLabel} ({received.length})
            </span>
            <span className="ml-auto font-mono text-sm font-bold text-[#22c55e]">
              {formatCurrency(totalReceived)}
            </span>
          </div>
          <div className="divide-y divide-white/20">
            {received.map(p => {
              const match = findMatch(p.customerName, p.value, receitas)
              const alreadyPaid = match?.status === 'pago'
              return (
                <div key={p.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-[#273544]">{p.customerName}</span>
                      {p.billingType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#0873F7]/10 text-[#0873F7] font-medium">
                          {billingLabel(p.billingType)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#626F7F] mt-0.5">
                      {p.paymentDate
                        ? `Pago em ${formatDate(p.paymentDate)}`
                        : `Vencimento: ${formatDate(p.dueDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-bold text-[#273544]">
                      {formatCurrency(p.value)}
                    </span>
                    {match ? (
                      alreadyPaid ? (
                        <span className="flex items-center gap-1 text-xs text-[#22c55e] font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Pago no DB
                        </span>
                      ) : (
                        <span className="text-xs text-[#f59e0b] font-medium bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          Pendente no DB
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-[#626F7F]">Sem cadastro</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="liquid-glass-md rounded-3xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/30">
            <Clock className="h-4 w-4 text-[#f59e0b]" />
            <span className="font-semibold text-[#273544] text-sm">
              Aguardando Pagamento ({pending.length})
            </span>
            <span className="ml-auto font-mono text-sm font-bold text-[#f59e0b]">
              {formatCurrency(totalPending)}
            </span>
          </div>
          <div className="divide-y divide-white/20">
            {pending.map(p => {
              const days = daysDiff(p.dueDate)
              return (
                <div key={p.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-[#273544]">{p.customerName}</span>
                    <p className="text-xs text-[#626F7F] mt-0.5">
                      Vence em {formatDate(p.dueDate)}
                      {days > 0 && ` · em ${days} dia${days !== 1 ? 's' : ''}`}
                      {days === 0 && ' · hoje'}
                      {days < 0 && (
                        <span className="text-[#EF4343]"> · {Math.abs(days)} dia{Math.abs(days) !== 1 ? 's' : ''} em atraso</span>
                      )}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#273544] shrink-0">
                    {formatCurrency(p.value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="liquid-glass-md rounded-3xl overflow-hidden border border-red-200/50">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/30 bg-red-50/20">
            <AlertCircle className="h-4 w-4 text-[#EF4343]" />
            <span className="font-semibold text-[#273544] text-sm">
              Vencidos sem Pagamento ({overdue.length})
            </span>
            <span className="ml-auto font-mono text-sm font-bold text-[#EF4343]">
              {formatCurrency(totalOverdue)}
            </span>
          </div>
          <div className="divide-y divide-white/20">
            {overdue.map(p => {
              const days = Math.abs(daysDiff(p.dueDate))
              return (
                <div key={p.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-[#273544]">{p.customerName}</span>
                    <p className="text-xs text-[#EF4343] mt-0.5">
                      Venceu em {formatDate(p.dueDate)} · {days} dia{days !== 1 ? 's' : ''} em atraso
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#EF4343] shrink-0">
                    {formatCurrency(p.value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {received.length === 0 && pending.length === 0 && overdue.length === 0 && (
        <div className="liquid-glass-md rounded-3xl p-12 text-center">
          <TrendingUp className="h-8 w-8 text-[#0873F7] mx-auto mb-3" />
          <p className="text-sm text-[#626F7F]">Nenhuma cobrança encontrada para {mes}</p>
        </div>
      )}
    </div>
  )
}
