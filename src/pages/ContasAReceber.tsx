import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, getMesAtual } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import {
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Inbox,
} from 'lucide-react'
import type { Receita, Cliente } from '@/types'

// ─── types ────────────────────────────────────────────────────────────────────

interface ReceitaComCliente {
  receita: Receita
  cliente: Cliente | undefined
  diasAtraso: number
  bucket: AgingBucket
}

type AgingBucket = 'a-vencer' | '0-7' | '8-15' | '16-30' | '30+'
type FilterTab = 'todos' | 'recorrentes' | 'variaveis' | 'em-atraso'

interface PagamentoForm {
  valor: string
  data_pagamento: string
  observacao: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const mesAtual = getMesAtual()

function calcDiasAtraso(diaPagamento: number | null): number {
  if (!diaPagamento) return 0
  const hoje = new Date()
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaPagamento)
  if (vencimento >= hoje) return 0
  const diff = hoje.getTime() - vencimento.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getBucket(diasAtraso: number, diaPagamento: number | null): AgingBucket {
  if (!diaPagamento) return 'a-vencer'
  const hoje = new Date()
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaPagamento)
  if (vencimento >= hoje) return 'a-vencer'
  if (diasAtraso <= 7) return '0-7'
  if (diasAtraso <= 15) return '8-15'
  if (diasAtraso <= 30) return '16-30'
  return '30+'
}

const AGING_BUCKETS: { key: AgingBucket; label: string; color: string; bg: string; border: string }[] = [
  { key: 'a-vencer', label: 'A vencer', color: '#0873F7', bg: '#eff6ff', border: '#bfdbfe' },
  { key: '0-7', label: '0–7 dias atraso', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: '8-15', label: '8–15 dias', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { key: '16-30', label: '16–30 dias', color: '#EF4343', bg: '#fef2f2', border: '#fecaca' },
  { key: '30+', label: '+30 dias', color: '#7f1d1d', bg: '#fef2f2', border: '#fca5a5' },
]

function diasAtrasoLabel(dias: number, diaPagamento: number | null): string {
  if (!diaPagamento) return '—'
  const hoje = new Date()
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaPagamento)
  if (vencimento >= hoje) {
    const diff = vencimento.getTime() - hoje.getTime()
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return daysLeft === 0 ? 'Hoje' : `${daysLeft}d para vencer`
  }
  return `${dias}d atraso`
}

function diasAtrasoColor(dias: number, diaPagamento: number | null): string {
  if (!diaPagamento) return '#626F7F'
  const hoje = new Date()
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaPagamento)
  if (vencimento >= hoje) return '#0873F7'
  if (dias <= 7) return '#f59e0b'
  if (dias <= 15) return '#f97316'
  if (dias <= 30) return '#EF4343'
  return '#7f1d1d'
}

function buildReminderMessage(nome: string, valor: number, mes: string): string {
  return `Olá ${nome}, tudo bem? Passando para avisar que sua mensalidade de ${formatCurrency(valor)} referente a ${mes} está em aberto. Aguardamos o pagamento. Qualquer dúvida estamos à disposição!`
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="liquid-glass-md rounded-3xl p-4 animate-pulse">
      <div className="h-3 w-24 bg-[rgba(255,255,255,0.45)] rounded mb-3" />
      <div className="h-7 w-32 bg-[rgba(255,255,255,0.45)] rounded mb-1" />
      <div className="h-2.5 w-16 bg-white/30 rounded" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <TableCell key={i}>
          <div className="h-4 bg-white/30 rounded animate-pulse" style={{ width: `${50 + i * 8}%` }} />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ContasAReceber() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const [pagamentoDialog, setPagamentoDialog] = useState(false)
  const [selectedReceita, setSelectedReceita] = useState<ReceitaComCliente | null>(null)
  const [pagamentoForm, setPagamentoForm] = useState<PagamentoForm>({
    valor: '',
    data_pagamento: new Date().toISOString().slice(0, 10),
    observacao: '',
  })
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState<FilterTab>('todos')
  const [expandedBuckets, setExpandedBuckets] = useState<Set<AgingBucket>>(new Set())

  // ── data loading ──────────────────────────────────────────────────────────

  async function loadData() {
    setLoading(true)
    try {
      const [receitasRes, clientesRes] = await Promise.all([
        supabase.from('receitas').select('*').eq('status', 'pendente'),
        supabase.from('clientes').select('*').eq('ativo', true).order('nome'),
      ])
      if (receitasRes.error) throw receitasRes.error
      if (clientesRes.error) throw clientesRes.error
      setReceitas(receitasRes.data ?? [])
      setClientes(clientesRes.data ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── MRR realizado (pago no mês atual) ─────────────────────────────────────

  const [mrrRealizado, setMrrRealizado] = useState(0)

  useEffect(() => {
    async function loadMrr() {
      try {
        const { data, error } = await supabase
          .from('receitas')
          .select('valor')
          .eq('status', 'pago')
          .eq('mes_referencia', mesAtual)
        if (error) throw error
        const total = (data ?? []).reduce((s, r) => s + (r.valor ?? 0), 0)
        setMrrRealizado(total)
      } catch {
        // silent — non-critical
      }
    }
    loadMrr()
  }, [])

  // ── derived data ──────────────────────────────────────────────────────────

  const enriched: ReceitaComCliente[] = receitas.map((r) => {
    const cliente = clientes.find((c) => c.id === r.cliente_id || c.nome === r.cliente_nome)
    const diasAtraso = calcDiasAtraso(cliente?.dia_pagamento ?? null)
    const bucket = getBucket(diasAtraso, cliente?.dia_pagamento ?? null)
    return { receita: r, cliente, diasAtraso, bucket }
  })

  const hoje = new Date()
  const todayDay = hoje.getDate()

  const totalAReceber = enriched.reduce((s, e) => s + (e.receita.valor ?? 0), 0)
  const vencenteHoje = enriched.filter((e) => e.cliente?.dia_pagamento === todayDay)
  const emAtraso = enriched.filter((e) => e.diasAtraso > 0)

  const vencenteHojeTotal = vencenteHoje.reduce((s, e) => s + (e.receita.valor ?? 0), 0)
  const emAtrasoTotal = emAtraso.reduce((s, e) => s + (e.receita.valor ?? 0), 0)

  // ── filter ────────────────────────────────────────────────────────────────

  const filtered = enriched.filter((e) => {
    if (activeTab === 'recorrentes') return e.cliente?.tipo === 'recorrente'
    if (activeTab === 'variaveis') return e.cliente?.tipo === 'variavel'
    if (activeTab === 'em-atraso') return e.diasAtraso > 0
    return true
  })

  const sorted = [...filtered].sort((a, b) => b.diasAtraso - a.diasAtraso)

  // ── aging buckets ─────────────────────────────────────────────────────────

  function getAgingRows(bucket: AgingBucket) {
    return sorted.filter((e) => e.bucket === bucket)
  }

  function toggleBucket(bucket: AgingBucket) {
    setExpandedBuckets((prev) => {
      const next = new Set(prev)
      if (next.has(bucket)) next.delete(bucket)
      else next.add(bucket)
      return next
    })
  }

  // ── actions ───────────────────────────────────────────────────────────────

  function openRegistrar(item: ReceitaComCliente) {
    setSelectedReceita(item)
    setPagamentoForm({
      valor: String(item.receita.valor ?? ''),
      data_pagamento: new Date().toISOString().slice(0, 10),
      observacao: '',
    })
    setPagamentoDialog(true)
  }

  async function handleRegistrar() {
    if (!selectedReceita) return
    if (!pagamentoForm.data_pagamento) {
      toast({ title: 'Informe a data do pagamento', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('receitas')
        .update({
          status: 'pago',
          data_pagamento: pagamentoForm.data_pagamento,
          valor: parseFloat(pagamentoForm.valor) || selectedReceita.receita.valor,
          observacao: pagamentoForm.observacao || selectedReceita.receita.observacao,
        })
        .eq('id', selectedReceita.receita.id)
      if (error) throw error
      toast({ title: 'Recebido!', variant: 'default' })
      setPagamentoDialog(false)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao registrar', description: err?.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function handleCopiarLembrete(item: ReceitaComCliente) {
    const nome = item.cliente?.nome ?? item.receita.cliente_nome ?? 'cliente'
    const msg = buildReminderMessage(nome, item.receita.valor ?? 0, item.receita.mes_referencia)
    navigator.clipboard
      .writeText(msg)
      .then(() => toast({ title: 'Mensagem copiada!', variant: 'default' }))
      .catch(() => toast({ title: 'Erro ao copiar', variant: 'destructive' }))
  }

  // ── render ────────────────────────────────────────────────────────────────

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'recorrentes', label: 'Recorrentes' },
    { key: 'variaveis', label: 'Variáveis' },
    { key: 'em-atraso', label: 'Em Atraso' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#273544]">Contas a Receber</h2>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total a Receber */}
          <div className="liquid-glass-md rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-[#0873F7]" />
              <span className="text-xs text-[#626F7F] font-medium">Total a Receber</span>
            </div>
            <p className="font-mono text-xl font-bold text-[#273544]">
              {formatCurrency(totalAReceber)}
            </p>
            <p className="text-xs text-[#626F7F] mt-1">{enriched.length} receitas pendentes</p>
          </div>

          {/* Vence Hoje */}
          <div className="liquid-glass-md rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[#f59e0b]" />
              <span className="text-xs text-[#626F7F] font-medium">Vence Hoje</span>
            </div>
            <p className="font-mono text-xl font-bold text-[#273544]">
              {formatCurrency(vencenteHojeTotal)}
            </p>
            <p className="text-xs text-[#626F7F] mt-1">{vencenteHoje.length} cliente{vencenteHoje.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Em Atraso */}
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-[#EF4343]" />
              <span className="text-xs text-[#EF4343] font-medium">Em Atraso</span>
            </div>
            <p className="font-mono text-xl font-bold text-[#EF4343]">
              {formatCurrency(emAtrasoTotal)}
            </p>
            <p className="text-xs text-[#EF4343] mt-1">{emAtraso.length} cliente{emAtraso.length !== 1 ? 's' : ''}</p>
          </div>

          {/* MRR Realizado */}
          <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-[#22c55e]" />
              <span className="text-xs text-[#22c55e] font-medium">MRR Realizado</span>
            </div>
            <p className="font-mono text-xl font-bold text-[#22c55e]">
              {formatCurrency(mrrRealizado)}
            </p>
            <p className="text-xs text-[#22c55e] mt-1">{mesAtual}</p>
          </div>
        </div>
      )}

      {/* ── Aging Table ── */}
      <div className="liquid-glass-md rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.45)]">
          <h3 className="text-sm font-semibold text-[#273544]">Aging de Recebíveis</h3>
          <p className="text-xs text-[#626F7F] mt-0.5">Clique em uma linha para expandir os detalhes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.45)] bg-white/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#626F7F] w-8" />
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#626F7F]">Situação</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#626F7F]">Clientes</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#626F7F]">Qtd</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#626F7F]">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-[rgba(255,255,255,0.45)]">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="px-5 py-3">
                          <div className="h-4 bg-white/30 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : AGING_BUCKETS.map(({ key, label, color, bg, border }) => {
                    const rows = getAgingRows(key)
                    const bucketTotal = rows.reduce((s, e) => s + (e.receita.valor ?? 0), 0)
                    const isExpanded = expandedBuckets.has(key)
                    const names = rows
                      .map((e) => e.cliente?.nome ?? e.receita.cliente_nome ?? '?')
                      .slice(0, 3)
                    const namesStr =
                      names.join(', ') + (rows.length > 3 ? ` +${rows.length - 3} mais` : '')

                    return (
                      <>
                        <tr
                          key={key}
                          className="border-b border-[rgba(255,255,255,0.45)] cursor-pointer hover:bg-white/30 transition-colors"
                          onClick={() => rows.length > 0 && toggleBucket(key)}
                        >
                          <td className="px-5 py-3 text-[#626F7F]">
                            {rows.length > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )
                            ) : null}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                              style={{ color, backgroundColor: bg, borderColor: border }}
                            >
                              {label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[#626F7F] text-xs max-w-xs truncate">
                            {rows.length === 0 ? (
                              <span className="text-[#94a3b8]">Nenhum</span>
                            ) : (
                              namesStr
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-[#273544]">
                            {rows.length}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-[#273544]">
                            {formatCurrency(bucketTotal)}
                          </td>
                        </tr>
                        {isExpanded && rows.length > 0 && (
                          <tr key={`${key}-expanded`} className="border-b border-[rgba(255,255,255,0.45)]">
                            <td colSpan={5} className="px-5 py-0">
                              <div className="rounded-lg border border-[rgba(255,255,255,0.45)] my-3 overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-white/30">
                                      <th className="text-left px-4 py-2 text-[#626F7F] font-medium">Cliente</th>
                                      <th className="text-left px-4 py-2 text-[#626F7F] font-medium">Tipo</th>
                                      <th className="text-right px-4 py-2 text-[#626F7F] font-medium">Valor</th>
                                      <th className="text-left px-4 py-2 text-[#626F7F] font-medium">Mês Ref.</th>
                                      <th className="text-right px-4 py-2 text-[#626F7F] font-medium">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((item) => (
                                      <tr key={item.receita.id} className="border-t border-white/30 bg-white/20">
                                        <td className="px-4 py-2.5 font-medium text-[#273544]">
                                          {item.cliente?.nome ?? item.receita.cliente_nome ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-[#626F7F] capitalize">
                                          {item.cliente?.tipo ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-[#273544]">
                                          {formatCurrency(item.receita.valor)}
                                        </td>
                                        <td className="px-4 py-2.5 text-[#626F7F]">
                                          {item.receita.mes_referencia}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-6 px-2 text-xs text-[#22c55e] border-[#bbf7d0] hover:bg-[#f0fdf4]"
                                              onClick={() => openRegistrar(item)}
                                            >
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Receber
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-6 px-2 text-xs text-[#626F7F] border-[rgba(255,255,255,0.45)] hover:bg-white/30"
                                              onClick={() => handleCopiarLembrete(item)}
                                            >
                                              <MessageSquare className="h-3 w-3 mr-1" />
                                              Lembrete
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Per-client Detail Table ── */}
      <div className="liquid-glass-md rounded-3xl overflow-hidden">
        {/* Filter Tabs */}
        <div className="flex items-center gap-0 border-b border-[rgba(255,255,255,0.45)] px-5 pt-4">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 mr-1 transition-colors ${
                activeTab === key
                  ? 'border-[#0873F7] text-[#0873F7]'
                  : 'border-transparent text-[#626F7F] hover:text-[#273544]'
              }`}
            >
              {label}
              {key !== 'todos' && (
                <span className="ml-1.5 text-xs text-[#94a3b8]">
                  {key === 'recorrentes'
                    ? `(${enriched.filter((e) => e.cliente?.tipo === 'recorrente').length})`
                    : key === 'variaveis'
                    ? `(${enriched.filter((e) => e.cliente?.tipo === 'variavel').length})`
                    : `(${emAtraso.length})`}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Dias Atraso</TableHead>
                  <TableHead>Dia Pag.</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
              </TableBody>
            </Table>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
              <Inbox className="h-10 w-10 mb-3 text-[#cbd5e1]" />
              <p className="text-sm font-medium">Nenhuma receita pendente</p>
              <p className="text-xs mt-1">Todos os recebimentos estão em dia.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Dias Atraso</TableHead>
                  <TableHead>Dia Pag.</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((item) => {
                  const nome = item.cliente?.nome ?? item.receita.cliente_nome ?? '—'
                  const tipo = item.cliente?.tipo ?? null
                  const diaPag = item.cliente?.dia_pagamento
                  const atrasoLabel = diasAtrasoLabel(item.diasAtraso, diaPag ?? null)
                  const atrasoColor = diasAtrasoColor(item.diasAtraso, diaPag ?? null)

                  return (
                    <TableRow key={item.receita.id}>
                      <TableCell className="font-medium text-[#273544]">{nome}</TableCell>
                      <TableCell>
                        {tipo ? (
                          <span
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize"
                            style={
                              tipo === 'recorrente'
                                ? { color: '#0873F7', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
                                : { color: '#626F7F', backgroundColor: '#f8fafc', borderColor: 'rgba(255,255,255,0.45)' }
                            }
                          >
                            {tipo === 'recorrente' ? 'Recorrente' : 'Variável'}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8] text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-[#273544]">
                        {formatCurrency(item.receita.valor)}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                          style={{
                            color: atrasoColor,
                            backgroundColor: atrasoColor + '14',
                            borderColor: atrasoColor + '40',
                          }}
                        >
                          {atrasoLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#626F7F]">
                        {diaPag != null ? `Dia ${diaPag}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#626F7F]">
                        {item.receita.mes_referencia}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[#22c55e] border-[#bbf7d0] hover:bg-[#f0fdf4] hover:text-[#16a34a]"
                            onClick={() => openRegistrar(item)}
                            title="Registrar recebimento"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Registrar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[#626F7F] border-[rgba(255,255,255,0.45)] hover:bg-white/30"
                            onClick={() => handleCopiarLembrete(item)}
                            title="Copiar lembrete de pagamento"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            Lembrete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Dialog: Registrar Recebimento ── */}
      <Dialog open={pagamentoDialog} onOpenChange={setPagamentoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>

          {selectedReceita && (
            <div className="rounded-lg bg-white/30 border border-[rgba(255,255,255,0.45)] px-4 py-3 mb-1 space-y-1">
              <p className="text-sm text-[#273544] font-medium">
                {selectedReceita.cliente?.nome ?? selectedReceita.receita.cliente_nome ?? '—'}
              </p>
              <p className="text-xs text-[#626F7F]">
                Referência: {selectedReceita.receita.mes_referencia}
                {selectedReceita.diasAtraso > 0 && (
                  <span className="ml-2 text-[#EF4343] font-medium">
                    {selectedReceita.diasAtraso}d em atraso
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="rec-valor">Valor Recebido (R$) *</Label>
              <Input
                id="rec-valor"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={pagamentoForm.valor}
                onChange={(e) => setPagamentoForm((f) => ({ ...f, valor: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="rec-data">Data do Pagamento *</Label>
              <Input
                id="rec-data"
                type="date"
                value={pagamentoForm.data_pagamento}
                onChange={(e) => setPagamentoForm((f) => ({ ...f, data_pagamento: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="rec-obs">Observação</Label>
              <Input
                id="rec-obs"
                placeholder="Opcional"
                value={pagamentoForm.observacao}
                onChange={(e) => setPagamentoForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleRegistrar}
              disabled={saving}
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
            >
              {saving ? 'Registrando...' : 'Confirmar Recebimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
