import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, probabilidadeColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { TrendingUp, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, UserCheck, AlertTriangle } from 'lucide-react'
import { simulatePipeline } from '@/lib/formulas'
import type { Pipeline as PipelineType, Socio } from '@/types'

const FASES = ['Prospecção', 'Proposta', 'Negociação', 'Ganho', 'Perdido'] as const
type Fase = typeof FASES[number]

const SERVICOS_OPTIONS = ['Site', 'SEO Local', 'GEO/IA', 'Tráfego Pago', 'Consultoria']

const emptyForm = {
  empresa: '',
  contato: '',
  fase: 'Prospecção' as Fase,
  servicos: [] as string[],
  ticket_unico: '',
  ticket_recorrente: '',
  mes_entrada_estimado: '',
  probabilidade: '50',
  observacao: '',
  data_followup: '',
}

// ─── Follow-up helpers ────────────────────────────────────────────────────────

function getFollowupStatus(data_followup: string | null): 'overdue' | 'soon' | 'ok' | null {
  if (!data_followup) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const followup = new Date(data_followup + 'T00:00:00')
  const diffMs = followup.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 2) return 'soon'
  return 'ok'
}

function diffDays(data_followup: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const followup = new Date(data_followup + 'T00:00:00')
  return Math.ceil((followup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 min-w-max lg:min-w-0">
      {FASES.map(fase => (
        <div key={fase} className="w-64 lg:w-auto lg:flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-20 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
            <div className="h-3 w-12 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="liquid-glass-md rounded-3xl p-4 shadow-sm space-y-2">
                <div className="h-4 w-3/4 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-[rgba(255,255,255,0.45)] rounded animate-pulse mt-3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Convert dialog ───────────────────────────────────────────────────────────

interface ConvertDialogProps {
  lead: PipelineType | null
  onClose: () => void
  onConverted: () => void
}

function ConvertDialog({ lead, onClose, onConverted }: ConvertDialogProps) {
  const [converting, setConverting] = useState(false)

  async function handleConvert() {
    if (!lead) return
    setConverting(true)
    try {
      const tipo = lead.ticket_recorrente > 0 ? 'recorrente' : 'variavel'
      const valor = lead.ticket_recorrente > 0 ? lead.ticket_recorrente : lead.ticket_unico

      const { error: clienteError } = await supabase.from('clientes').insert({
        nome: lead.empresa,
        tipo,
        valor_mensalidade: valor,
        ativo: true,
        criado_em: new Date().toISOString(),
        observacao: lead.observacao ?? null,
      })

      if (clienteError) throw clienteError

      const { error: pipelineError } = await supabase
        .from('pipeline')
        .update({ fase: 'Ganho', atualizado_em: new Date().toISOString() })
        .eq('id', lead.id)

      if (pipelineError) throw pipelineError

      toast({ title: 'Cliente criado com sucesso!' })
      onConverted()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao converter'
      toast({ title: 'Erro ao converter', description: msg, variant: 'destructive' })
    } finally {
      setConverting(false)
    }
  }

  if (!lead) return null

  const tipo = lead.ticket_recorrente > 0 ? 'recorrente' : 'variavel'
  const valor = lead.ticket_recorrente > 0 ? lead.ticket_recorrente : lead.ticket_unico

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Converter em Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-[#626F7F]">
            Converter <strong className="text-[#273544]">{lead.empresa}</strong> em cliente ativo?
          </p>
          <div className="bg-white/20 rounded-lg border border-[rgba(255,255,255,0.45)] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#626F7F]">Nome</span>
              <span className="font-medium text-[#273544]">{lead.empresa}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#626F7F]">Tipo</span>
              <span className="font-medium text-[#273544] capitalize">{tipo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#626F7F]">Valor mensalidade</span>
              <span className="font-mono font-bold text-[#22c55e]">{formatCurrency(valor)}</span>
            </div>
            {lead.observacao && (
              <div className="flex justify-between gap-4">
                <span className="text-[#626F7F] shrink-0">Observação</span>
                <span className="text-[#273544] text-right">{lead.observacao}</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={converting}>Cancelar</Button>
          </DialogClose>
          <Button
            onClick={handleConvert}
            disabled={converting}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white gap-1.5"
          >
            <UserCheck className="h-4 w-4" />
            {converting ? 'Convertendo...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Pipeline() {
  const [leads, setLeads] = useState<PipelineType[]>([])
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<PipelineType | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [simFase, setSimFase] = useState<string | null>(null)
  const [convertTarget, setConvertTarget] = useState<PipelineType | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const [{ data: leadsData, error: leadsError }, { data: sociosData, error: sociosError }] = await Promise.all([
        supabase.from('pipeline').select('*').order('criado_em', { ascending: false }),
        supabase.from('socios').select('*').eq('ativo', true),
      ])
      if (leadsError) throw leadsError
      if (sociosError) throw sociosError
      setLeads(leadsData ?? [])
      setSocios(sociosData ?? [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados'
      toast({ title: 'Erro ao carregar pipeline', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  function prefillForm(lead: PipelineType) {
    setForm({
      empresa: lead.empresa,
      contato: lead.contato ?? '',
      fase: lead.fase,
      servicos: lead.servicos ?? [],
      ticket_unico: String(lead.ticket_unico),
      ticket_recorrente: String(lead.ticket_recorrente),
      mes_entrada_estimado: lead.mes_entrada_estimado ?? '',
      probabilidade: String(lead.probabilidade),
      observacao: lead.observacao ?? '',
      data_followup: lead.data_followup ?? '',
    })
  }

  function openAdd() {
    setEditingLead(null)
    setForm({ ...emptyForm })
    setDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    const payload = {
      empresa: form.empresa,
      contato: form.contato || null,
      fase: form.fase,
      servicos: form.servicos.length > 0 ? form.servicos : null,
      ticket_unico: parseFloat(form.ticket_unico) || 0,
      ticket_recorrente: parseFloat(form.ticket_recorrente) || 0,
      mes_entrada_estimado: form.mes_entrada_estimado || null,
      probabilidade: parseInt(form.probabilidade) || 0,
      observacao: form.observacao || null,
      data_followup: form.data_followup || null,
      atualizado_em: now,
    }
    try {
      if (editingLead) {
        const { error } = await supabase.from('pipeline').update(payload).eq('id', editingLead.id)
        if (error) throw error
        toast({ title: 'Lead atualizado' })
      } else {
        const { error } = await supabase.from('pipeline').insert({ ...payload, criado_em: now })
        if (error) throw error
        toast({ title: 'Lead adicionado' })
      }
      setDialog(false)
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      toast({ title: 'Erro ao salvar lead', description: msg, variant: 'destructive' })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lead?')) return
    try {
      const { error } = await supabase.from('pipeline').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Lead excluído' })
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir'
      toast({ title: 'Erro ao excluir lead', description: msg, variant: 'destructive' })
    }
  }

  async function moveFase(lead: PipelineType, direction: 1 | -1) {
    const faseIdx = FASES.indexOf(lead.fase)
    const newFase = FASES[faseIdx + direction]
    if (!newFase) return
    try {
      const { error } = await supabase
        .from('pipeline')
        .update({ fase: newFase, atualizado_em: new Date().toISOString() })
        .eq('id', lead.id)
      if (error) throw error
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao mover lead'
      toast({ title: 'Erro ao mover lead', description: msg, variant: 'destructive' })
    }
  }

  function toggleServico(s: string) {
    setForm(f => ({
      ...f,
      servicos: f.servicos.includes(s)
        ? f.servicos.filter(x => x !== s)
        : [...f.servicos, s],
    }))
  }

  const sim = simulatePipeline(leads, simFase, socios.map(s => s.percentual))

  const overdueCount = leads.filter(l => getFollowupStatus(l.data_followup) === 'overdue').length

  // ─── Lead Card ───────────────────────────────────────────────────────────────

  function LeadCard({ lead }: { lead: PipelineType }) {
    const faseIdx = FASES.indexOf(lead.fase)
    const canGoNext = faseIdx < FASES.length - 1 && lead.fase !== 'Perdido'
    const canGoPrev = faseIdx > 0
    const followupStatus = getFollowupStatus(lead.data_followup)

    const cardBorder =
      followupStatus === 'overdue'
        ? 'border-[rgba(255,255,255,0.45)] border-l-4 border-l-amber-500'
        : 'border-[rgba(255,255,255,0.45)]'

    return (
      <div className={`liquid-glass-md rounded-3xl p-4 ${cardBorder}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm text-[#273544] leading-tight">{lead.empresa}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${probabilidadeColor(lead.probabilidade)}`}>
            {lead.probabilidade}%
          </span>
        </div>

        {lead.contato && (
          <p className="text-xs text-[#626F7F] mt-1">{lead.contato}</p>
        )}

        {lead.servicos && lead.servicos.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.servicos.map(s => (
              <span key={s} className="text-xs bg-white/30 text-[#0873F7] px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Follow-up badges */}
        {followupStatus === 'overdue' && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              Follow-up atrasado
            </span>
          </div>
        )}
        {followupStatus === 'soon' && lead.data_followup && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
              Follow-up em {diffDays(lead.data_followup)}d
            </span>
          </div>
        )}
        {followupStatus === 'ok' && lead.data_followup && (
          <p className="text-xs text-[#94a3b8] mt-2">
            Follow-up: {new Date(lead.data_followup + 'T00:00:00').toLocaleDateString('pt-BR')}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f1f5f9]">
          <span className="font-mono text-sm font-bold text-[#22c55e]">
            {formatCurrency(lead.ticket_recorrente)}/mês
          </span>
          {lead.ticket_unico > 0 && (
            <span className="font-mono text-xs text-[#626F7F]">
              + {formatCurrency(lead.ticket_unico)}
            </span>
          )}
        </div>

        {/* Convert button for Ganho phase */}
        {lead.fase === 'Ganho' && (
          <div className="mt-2">
            <button
              onClick={() => setConvertTarget(lead)}
              className="w-full text-xs font-medium bg-green-50 hover:bg-green-100 text-[#22c55e] border border-green-200 rounded-lg px-2 py-1.5 transition-colors flex items-center justify-center gap-1"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Converter para Cliente
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() => canGoPrev && moveFase(lead, -1)}
            disabled={!canGoPrev}
            className="p-1 rounded hover:bg-white/30 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-[#626F7F]" />
          </button>
          <button
            onClick={() => canGoNext && moveFase(lead, 1)}
            disabled={!canGoNext}
            className="p-1 rounded hover:bg-white/30 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5 text-[#626F7F]" />
          </button>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => { setEditingLead(lead); prefillForm(lead); setDialog(true) }}
              className="p-1 rounded hover:bg-white/30 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#626F7F]" />
            </button>
            <button
              onClick={() => handleDelete(lead.id)}
              className="p-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#273544]">Pipeline Comercial</h1>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertTriangle className="h-3.5 w-3.5" />
                {overdueCount} follow-up{overdueCount > 1 ? 's' : ''} atrasado{overdueCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-[#626F7F]">Acompanhe oportunidades e simule receita futura</p>
        </div>
        <Button onClick={openAdd} className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Novo Lead
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 overflow-x-auto">
            <KanbanSkeleton />
          </div>
          <div className="liquid-glass-md rounded-3xl p-5 w-full lg:w-72 lg:shrink-0 space-y-3">
            <div className="h-5 w-24 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
            <div className="h-10 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
            <div className="h-16 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
            <div className="h-16 bg-[rgba(255,255,255,0.45)] rounded animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Kanban */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 min-w-max lg:min-w-0">
              {FASES.map(fase => {
                const faseleads = leads.filter(l => l.fase === fase)
                const faseTotal = faseleads.reduce((s, l) => s + l.ticket_recorrente, 0)
                return (
                  <div key={fase} className="w-64 lg:w-auto lg:flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#626F7F] uppercase">{fase}</span>
                      <span className="text-xs font-mono text-[#626F7F]">
                        {faseleads.length} · {formatCurrency(faseTotal)}
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[100px]">
                      {faseleads.map(lead => (
                        <LeadCard key={lead.id} lead={lead} />
                      ))}
                      {faseleads.length === 0 && (
                        <div className="rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.45)] h-20 flex items-center justify-center">
                          <span className="text-xs text-[#94a3b8]">Vazio</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Simulator sidebar */}
          <div className="liquid-glass-md rounded-3xl p-5 w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-20 self-start">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#0873F7]" />
              <h3 className="font-semibold text-[#273544]">Simulador</h3>
            </div>
            <Select
              value={simFase ?? 'all'}
              onValueChange={v => setSimFase(v === 'all' ? null : v)}
            >
              <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os leads</SelectItem>
                {FASES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="space-y-3">
              <div className="p-3 bg-white/30 rounded-lg">
                <p className="text-xs text-[#626F7F]">MRR Ponderado</p>
                <p className="font-mono font-bold text-[#0873F7]">{formatCurrency(sim.mrrWeighted)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-[#626F7F]">Lucro Adicional Estimado (30%)</p>
                <p className="font-mono font-bold text-[#22c55e]">{formatCurrency(sim.lucroAdicional)}</p>
              </div>
              {socios.length > 0 && (
                <div className="border-t border-[rgba(255,255,255,0.45)] pt-3">
                  <p className="text-xs font-semibold text-[#626F7F] mb-2">Impacto por Sócio</p>
                  {socios.map((s, i) => (
                    <div key={s.id} className="flex justify-between text-sm py-1">
                      <span className="text-[#626F7F] truncate">{s.nome}</span>
                      <span className="font-mono text-[#273544]">
                        {formatCurrency(sim.distribuicao[i] ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-[#626F7F] border-t border-[rgba(255,255,255,0.45)] pt-3">
                {leads.filter(l => l.fase !== 'Perdido').length} leads ativos · MRR potencial{' '}
                {formatCurrency(leads.filter(l => l.fase !== 'Perdido').reduce((s, l) => s + l.ticket_recorrente, 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <Label>Empresa</Label>
              <Input
                value={form.empresa}
                onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Contato</Label>
              <Input
                value={form.contato}
                onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fase</Label>
              <Select value={form.fase} onValueChange={v => setForm(f => ({ ...f, fase: v as Fase }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FASES.map(fase => (
                    <SelectItem key={fase} value={fase}>{fase}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Serviços</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {SERVICOS_OPTIONS.map(s => (
                  <label
                    key={s}
                    className={`flex items-center gap-1.5 text-sm cursor-pointer px-2.5 py-1 rounded-full border transition-colors ${
                      form.servicos.includes(s)
                        ? 'bg-[#0873F7] text-white border-[#0873F7]'
                        : 'border-[rgba(255,255,255,0.45)] text-[#626F7F] hover:border-[#0873F7]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.servicos.includes(s)}
                      onChange={() => toggleServico(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ticket Único (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.ticket_unico}
                  onChange={e => setForm(f => ({ ...f, ticket_unico: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ticket Recorrente/mês (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.ticket_recorrente}
                  onChange={e => setForm(f => ({ ...f, ticket_recorrente: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Mês de Entrada Estimado</Label>
              <Input
                value={form.mes_entrada_estimado}
                onChange={e => setForm(f => ({ ...f, mes_entrada_estimado: e.target.value }))}
                placeholder="Jun/2026"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Probabilidade de Fechamento</Label>
                <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded-full ${probabilidadeColor(parseInt(form.probabilidade) || 0)}`}>
                  {form.probabilidade}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.probabilidade}
                onChange={e => setForm(f => ({ ...f, probabilidade: e.target.value }))}
                className="w-full accent-[#0873F7]"
              />
            </div>

            <div>
              <Label>Data de Follow-up</Label>
              <Input
                type="date"
                value={form.data_followup}
                onChange={e => setForm(f => ({ ...f, data_followup: e.target.value }))}
              />
            </div>

            <div>
              <Label>Observação</Label>
              <textarea
                value={form.observacao}
                onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                rows={3}
                className="w-full mt-1 rounded-md border border-[rgba(255,255,255,0.45)] bg-white/60 px-3 py-2 text-sm text-[#273544] placeholder:text-[#626F7F]/60 focus:outline-none focus:ring-2 focus:ring-[#0873F7] focus:border-transparent resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">{editingLead ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert to Client Dialog */}
      <ConvertDialog
        lead={convertTarget}
        onClose={() => setConvertTarget(null)}
        onConverted={() => { setConvertTarget(null); fetchData() }}
      />
    </div>
  )
}
