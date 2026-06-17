import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  getMesAtual,
  getMesesAnteriores,
  isOverdue,
  isWithinDays,
} from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Pencil,
  TrendingUp,
  BarChart2,
  Archive,
  PlusCircle,
  RefreshCw,
} from 'lucide-react'
import type { Investimento, RendimentoInvestimento } from '@/types'

// ─── Tipo config ──────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<Investimento['tipo'], string> = {
  caixa_reserva: 'Caixa',
  cdb: 'CDB',
  poupanca: 'Poupança',
  fundo: 'Fundo',
  outro: 'Outro',
}

const TIPO_ICONS: Record<Investimento['tipo'], string> = {
  caixa_reserva: '💰',
  cdb: '🏦',
  poupanca: '💳',
  fundo: '📈',
  outro: '💎',
}

const TIPO_BADGE: Record<Investimento['tipo'], string> = {
  caixa_reserva: 'bg-slate-100 text-slate-600 border-slate-200',
  cdb: 'bg-blue-100 text-blue-700 border-blue-200',
  poupanca: 'bg-green-100 text-green-700 border-green-200',
  fundo: 'bg-purple-100 text-purple-700 border-purple-200',
  outro: 'bg-gray-100 text-gray-600 border-gray-200',
}

// ─── Empty form factories ─────────────────────────────────────────────────────

function emptyForm() {
  return {
    nome: '',
    tipo: 'outro' as Investimento['tipo'],
    instituicao: '',
    valor_investido: '',
    saldo_atual: '',
    taxa_juros: '',
    data_inicio: '',
    data_vencimento: '',
    observacao: '',
  }
}

function emptyRendForm(inv: Investimento | null) {
  return {
    mes_referencia: getMesAtual(),
    saldo_anterior: inv ? String(inv.saldo_atual) : '',
    rendimento: '',
    taxa_aplicada: '',
    observacao: '',
  }
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
        </td>
      ))}
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Investimentos() {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [rendimentos, setRendimentos] = useState<RendimentoInvestimento[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showInativos, setShowInativos] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Investimento | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  // Rendimento modal
  const [rendimentoModal, setRendimentoModal] = useState<Investimento | null>(null)
  const [rendForm, setRendForm] = useState(emptyRendForm(null))
  const [savingRend, setSavingRend] = useState(false)

  // Inativar confirm
  const [inativarTarget, setInativarTarget] = useState<Investimento | null>(null)
  const [inativando, setInativando] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [invRes, rendRes] = await Promise.all([
        supabase.from('investimentos').select('*').order('criado_em'),
        supabase.from('rendimentos_investimentos').select('*').order('criado_em'),
      ])
      if (invRes.error) throw invRes.error
      if (rendRes.error) throw rendRes.error
      setInvestimentos((invRes.data ?? []) as Investimento[])
      setRendimentos((rendRes.data ?? []) as RendimentoInvestimento[])
      setLastUpdated(new Date())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ─── KPI computations ──────────────────────────────────────────────────────

  const ativos = investimentos.filter((i) => i.ativo)
  const totalInvestido = ativos.reduce((s, i) => s + i.valor_investido, 0)
  const saldoTotal = ativos.reduce((s, i) => s + i.saldo_atual, 0)
  const rentabilidadeAcumulada = saldoTotal - totalInvestido

  const mesAtual = getMesAtual()
  const rendimentosMes = rendimentos.filter((r) => r.mes_referencia === mesAtual)
  const rendimentoMesTotal = rendimentosMes.reduce((s, r) => s + r.rendimento, 0)
  const taxaMedia =
    rendimentosMes.length > 0
      ? rendimentosMes.reduce((s, r) => s + (r.taxa_aplicada ?? 0), 0) / rendimentosMes.length
      : 0

  const caixaReserva = ativos.find((i) => i.tipo === 'caixa_reserva')

  // ─── Table rows ────────────────────────────────────────────────────────────

  const visibleRows = showInativos ? investimentos : ativos

  // ─── Chart data ────────────────────────────────────────────────────────────

  const meses6 = getMesesAnteriores(6)
  const chartData = meses6.map((mes) => ({
    mes,
    rendimento: rendimentos
      .filter((r) => r.mes_referencia === mes)
      .reduce((s, r) => s + r.rendimento, 0),
  }))

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function vencimentoCell(data: string | null) {
    if (!data) return <span className="text-[#626F7F]">-</span>
    if (isOverdue(data))
      return <span className="text-[#EF4343] font-medium">Vencido</span>
    if (isWithinDays(data, 30))
      return (
        <span className="text-[#f59e0b] font-medium">
          {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}
        </span>
      )
    return <span>{new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
  }

  function signedCurrency(value: number) {
    const sign = value >= 0 ? '+' : ''
    return (
      <span style={{ color: value >= 0 ? '#22c55e' : '#EF4343' }}>
        {sign}
        {formatCurrency(value)}
      </span>
    )
  }

  // ─── Add/Edit modal handlers ───────────────────────────────────────────────

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(inv: Investimento) {
    setEditing(inv)
    setForm({
      nome: inv.nome,
      tipo: inv.tipo,
      instituicao: inv.instituicao ?? '',
      valor_investido: String(inv.valor_investido),
      saldo_atual: String(inv.saldo_atual),
      taxa_juros: inv.taxa_juros != null ? String(inv.taxa_juros) : '',
      data_inicio: inv.data_inicio ?? '',
      data_vencimento: inv.data_vencimento ?? '',
      observacao: inv.observacao ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' })
      return
    }
    if (!form.valor_investido) {
      toast({ title: 'Valor investido obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const valorInvestido = parseFloat(form.valor_investido) || 0
      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        instituicao: form.instituicao.trim() || null,
        valor_investido: valorInvestido,
        saldo_atual: form.saldo_atual ? parseFloat(form.saldo_atual) : valorInvestido,
        taxa_juros: form.taxa_juros ? parseFloat(form.taxa_juros) : null,
        data_inicio: form.data_inicio || null,
        data_vencimento: form.data_vencimento || null,
        observacao: form.observacao.trim() || null,
      }
      if (editing) {
        const { error } = await supabase
          .from('investimentos')
          .update(payload)
          .eq('id', editing.id)
        if (error) throw error
        toast({ title: 'Investimento atualizado' })
      } else {
        const { error } = await supabase.from('investimentos').insert(payload)
        if (error) throw error
        toast({ title: 'Investimento adicionado' })
      }
      setModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Rendimento modal handlers ─────────────────────────────────────────────

  function openRendimento(inv: Investimento) {
    setRendimentoModal(inv)
    setRendForm(emptyRendForm(inv))
  }

  async function handleSaveRendimento() {
    if (!rendimentoModal) return
    if (!rendForm.rendimento) {
      toast({ title: 'Rendimento obrigatório', variant: 'destructive' })
      return
    }
    setSavingRend(true)
    try {
      const saldoAnt = parseFloat(rendForm.saldo_anterior) || 0
      const rend = parseFloat(rendForm.rendimento) || 0
      const novoSaldo = saldoAnt + rend

      const { error: rErr } = await supabase.from('rendimentos_investimentos').insert({
        investimento_id: rendimentoModal.id,
        mes_referencia: rendForm.mes_referencia,
        rendimento: rend,
        taxa_aplicada: rendForm.taxa_aplicada ? parseFloat(rendForm.taxa_aplicada) : null,
        saldo_anterior: saldoAnt,
        saldo_atual: novoSaldo,
        observacao: rendForm.observacao.trim() || null,
      })
      if (rErr) throw rErr

      const { error: uErr } = await supabase
        .from('investimentos')
        .update({ saldo_atual: novoSaldo })
        .eq('id', rendimentoModal.id)
      if (uErr) throw uErr

      toast({ title: 'Rendimento registrado' })
      setRendimentoModal(null)
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao registrar rendimento'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setSavingRend(false)
    }
  }

  // ─── Inativar handler ──────────────────────────────────────────────────────

  async function handleInativar() {
    if (!inativarTarget) return
    setInativando(true)
    try {
      const { error } = await supabase
        .from('investimentos')
        .update({ ativo: false })
        .eq('id', inativarTarget.id)
      if (error) throw error
      toast({ title: `${inativarTarget.nome} inativado` })
      setInativarTarget(null)
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao inativar'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setInativando(false)
    }
  }

  // ─── Computed for rendimento modal ─────────────────────────────────────────

  const rendSaldoResultante =
    (parseFloat(rendForm.saldo_anterior) || 0) + (parseFloat(rendForm.rendimento) || 0)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Section 1: KPI cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Investido */}
        <div
          className="liquid-glass-md rounded-3xl p-5"
          style={{ borderColor: 'rgba(255,255,255,0.45)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#626F7F] mb-2">
            Total Investido
          </p>
          <p className="text-2xl font-bold" style={{ color: '#0873F7' }}>
            {formatCurrency(totalInvestido)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">{ativos.length} aplicações ativas</p>
        </div>

        {/* Card 2: Saldo Total Atual */}
        <div
          className="liquid-glass-md rounded-3xl p-5"
          style={{ borderColor: 'rgba(255,255,255,0.45)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#626F7F] mb-2">
            Saldo Total Atual
          </p>
          <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {formatCurrency(saldoTotal)}
          </p>
          <p className="text-xs mt-1">
            Rentabilidade acumulada:{' '}
            <span
              style={{
                color: rentabilidadeAcumulada >= 0 ? '#22c55e' : '#EF4343',
                fontWeight: 600,
              }}
            >
              {rentabilidadeAcumulada >= 0 ? '+' : ''}
              {formatCurrency(rentabilidadeAcumulada)}
            </span>
          </p>
        </div>

        {/* Card 3: Rendimento Este Mes */}
        <div
          className="liquid-glass-md rounded-3xl p-5"
          style={{ borderColor: 'rgba(255,255,255,0.45)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#626F7F] mb-2">
            Rendimento Este Mes
          </p>
          {rendimentosMes.length === 0 ? (
            <p className="text-sm text-[#94a3b8] mt-1">Nenhum rendimento registrado</p>
          ) : (
            <>
              <p
                className="text-2xl font-bold"
                style={{ color: rendimentoMesTotal > 0 ? '#22c55e' : '#EF4343' }}
              >
                {formatCurrency(rendimentoMesTotal)}
              </p>
              <p className="text-xs text-[#626F7F] mt-1">
                Taxa media: {taxaMedia.toFixed(2)}% a.m.
              </p>
            </>
          )}
        </div>

        {/* Card 4: Caixa Reserva */}
        <div
          className="liquid-glass-md rounded-3xl p-5"
          style={{ borderColor: 'rgba(255,255,255,0.45)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#626F7F] mb-2">
            Caixa Reserva
          </p>
          <p className="text-2xl font-bold" style={{ color: '#626F7F' }}>
            {formatCurrency(caixaReserva?.saldo_atual ?? 4000)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">Reserva operacional protegida</p>
        </div>
      </div>

      {/* ── Section 2: Investments table ─────────────────────────────────── */}
      <div className="liquid-glass-md rounded-3xl">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
          <h2 className="text-sm font-semibold text-[#273544]">Aplicações</h2>
          <label className="flex items-center gap-2 text-xs text-[#626F7F] cursor-pointer">
            <input
              type="checkbox"
              checked={showInativos}
              onChange={(e) => setShowInativos(e.target.checked)}
              className="rounded"
            />
            Mostrar Inativos
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
                {[
                  'Nome',
                  'Tipo',
                  'Instituição',
                  'Valor Investido',
                  'Saldo Atual',
                  'Rentab.',
                  'Taxa a.m.',
                  'Vencimento',
                  'Ações',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#626F7F]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <p className="text-[#626F7F] text-sm mb-3">Nenhum investimento cadastrado</p>
                    <Button size="sm" onClick={openAdd}>
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Adicionar primeiro investimento
                    </Button>
                  </td>
                </tr>
              ) : (
                <>
                  {visibleRows.map((inv) => {
                    const rentab = inv.saldo_atual - inv.valor_investido
                    const isExpanded = expandedRow === inv.id
                    const histRows = rendimentos
                      .filter((r) => r.investimento_id === inv.id)
                      .sort((a, b) => a.mes_referencia.localeCompare(b.mes_referencia))

                    return (
                      <>
                        <tr
                          key={inv.id}
                          className={`border-b transition-colors hover:bg-white/20 ${!inv.ativo ? 'opacity-50' : ''}`}
                          style={{ borderColor: '#f1f5f9' }}
                        >
                          <td className="px-4 py-3 font-medium text-[#273544]">{inv.nome}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${TIPO_BADGE[inv.tipo]}`}
                            >
                              {TIPO_ICONS[inv.tipo]} {TIPO_LABELS[inv.tipo]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#626F7F]">
                            {inv.instituicao ?? <span className="text-[#cbd5e1]">-</span>}
                          </td>
                          <td className="px-4 py-3 text-[#273544]">
                            {formatCurrency(inv.valor_investido)}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#22c55e]">
                            {formatCurrency(inv.saldo_atual)}
                          </td>
                          <td className="px-4 py-3">{signedCurrency(rentab)}</td>
                          <td className="px-4 py-3 text-[#626F7F]">
                            {inv.taxa_juros != null ? `${inv.taxa_juros}%` : '-'}
                          </td>
                          <td className="px-4 py-3">{vencimentoCell(inv.data_vencimento)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEdit(inv)}
                                title="Editar"
                                className="p-1.5 rounded hover:bg-white/30 text-[#626F7F] hover:text-[#0873F7] transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openRendimento(inv)}
                                title="Registrar Rendimento"
                                className="p-1.5 rounded hover:bg-white/30 text-[#626F7F] hover:text-[#22c55e] transition-colors"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setExpandedRow(isExpanded ? null : inv.id)
                                }
                                title="Historico"
                                className={`p-1.5 rounded hover:bg-white/30 transition-colors ${isExpanded ? 'text-[#0873F7]' : 'text-[#626F7F] hover:text-[#0873F7]'}`}
                              >
                                <BarChart2 className="h-3.5 w-3.5" />
                              </button>
                              {inv.ativo && (
                                <button
                                  onClick={() => setInativarTarget(inv)}
                                  title="Inativar"
                                  className="p-1.5 rounded hover:bg-red-50 text-[#626F7F] hover:text-[#EF4343] transition-colors"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded history sub-table */}
                        {isExpanded && (
                          <tr key={`${inv.id}-hist`} className="bg-white/20">
                            <td colSpan={9} className="px-6 py-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-[#626F7F] mb-3">
                                Historico de Rendimentos: {inv.nome}
                              </p>
                              {histRows.length === 0 ? (
                                <p className="text-xs text-[#94a3b8]">Nenhum rendimento registrado.</p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
                                      {['Mes', 'Saldo Anterior', 'Rendimento', 'Taxa %', 'Saldo Apos', 'Notas'].map((h) => (
                                        <th
                                          key={h}
                                          className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]"
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {histRows.map((r) => (
                                      <tr key={r.id} className="border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
                                        <td className="px-3 py-2 font-medium text-[#273544]">
                                          {r.mes_referencia}
                                        </td>
                                        <td className="px-3 py-2 text-[#626F7F]">
                                          {r.saldo_anterior != null
                                            ? formatCurrency(r.saldo_anterior)
                                            : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-[#22c55e] font-medium">
                                          +{formatCurrency(r.rendimento)}
                                        </td>
                                        <td className="px-3 py-2 text-[#626F7F]">
                                          {r.taxa_aplicada != null ? `${r.taxa_aplicada}%` : '-'}
                                        </td>
                                        <td className="px-3 py-2 font-medium text-[#273544]">
                                          {r.saldo_atual != null
                                            ? formatCurrency(r.saldo_atual)
                                            : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-[#626F7F]">
                                          {r.observacao ?? '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}

                  {/* Footer totals row */}
                  <tr className="bg-white/20 font-bold">
                    <td className="px-4 py-3 text-[#273544]">TOTAL</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-[#273544]">
                      {formatCurrency(totalInvestido)}
                    </td>
                    <td className="px-4 py-3 text-[#22c55e]">
                      {formatCurrency(saldoTotal)}
                    </td>
                    <td className="px-4 py-3">{signedCurrency(rentabilidadeAcumulada)}</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Rendimentos chart ─────────────────────────────────── */}
      <div className="liquid-glass-md rounded-3xl p-5" style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
        <h2 className="text-sm font-semibold text-[#273544] mb-4">Rendimentos Mensais</h2>
        {chartData.every((d) => d.rendimento === 0) ? (
          <div className="flex items-center justify-center h-40 text-[#94a3b8] text-sm">
            Nenhum rendimento registrado ainda
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0873F7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0873F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#626F7F' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#626F7F' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCurrency(v).replace('R$ ', 'R$ ')}
                width={80}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), 'Rendimento']}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.45)',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="rendimento"
                stroke="#0873F7"
                strokeWidth={2}
                fill="url(#rendGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
        <p className="text-xs text-[#94a3b8]">
          {lastUpdated
            ? `Ultima atualizacao: ${lastUpdated.toLocaleTimeString('pt-BR')}`
            : 'Carregando...'}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={openAdd} style={{ background: '#0873F7' }}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Novo Investimento
          </Button>
        </div>
      </div>

      {/* ── Add/Edit Modal ───────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Investimento' : 'Novo Investimento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: CDB Sicoob 120% CDI"
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v as Investimento['tipo'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caixa_reserva">Caixa Reserva</SelectItem>
                    <SelectItem value="cdb">CDB</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="fundo">Fundo</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Instituição</Label>
                <Input
                  value={form.instituicao}
                  onChange={(e) => setForm({ ...form, instituicao: e.target.value })}
                  placeholder="Ex: Sicoob, Inter, XP"
                />
              </div>
              <div>
                <Label>Valor Investido (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor_investido}
                  onChange={(e) => setForm({ ...form, valor_investido: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Saldo Atual (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.saldo_atual}
                  onChange={(e) => setForm({ ...form, saldo_atual: e.target.value })}
                  placeholder="Padrão: igual ao valor investido"
                />
              </div>
              <div>
                <Label>Taxa de Juros (% a.m.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxa_juros}
                  onChange={(e) => setForm({ ...form, taxa_juros: e.target.value })}
                  placeholder="Ex: 0.85"
                />
              </div>
              <div>
                <Label>Data de Inicio</Label>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={form.data_vencimento}
                  onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Observação</Label>
                <textarea
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: '#0873F7' }}>
              {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Registrar Rendimento Modal ───────────────────────────────────── */}
      <Dialog
        open={rendimentoModal !== null}
        onOpenChange={(open) => { if (!open) setRendimentoModal(null) }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Rendimento</DialogTitle>
          </DialogHeader>
          {rendimentoModal && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-[#626F7F]">
                Aplicação: <span className="font-medium text-[#273544]">{rendimentoModal.nome}</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Mes de Referencia</Label>
                  <Select
                    value={rendForm.mes_referencia}
                    onValueChange={(v) => setRendForm({ ...rendForm, mes_referencia: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getMesesAnteriores(12).map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Saldo Anterior (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rendForm.saldo_anterior}
                    onChange={(e) =>
                      setRendForm({ ...rendForm, saldo_anterior: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Rendimento (R$) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rendForm.rendimento}
                    onChange={(e) =>
                      setRendForm({ ...rendForm, rendimento: e.target.value })
                    }
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Taxa Aplicada (% a.m.)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={rendForm.taxa_aplicada}
                    onChange={(e) =>
                      setRendForm({ ...rendForm, taxa_aplicada: e.target.value })
                    }
                    placeholder="Ex: 0.85"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Label>Saldo Resultante</Label>
                  <div
                    className="mt-1 px-3 py-2 rounded-md border text-sm font-semibold"
                    style={{
                      background: '#f8fafc',
                      borderColor: 'rgba(255,255,255,0.45)',
                      color: '#22c55e',
                    }}
                  >
                    {formatCurrency(rendSaldoResultante)}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Observação</Label>
                  <Input
                    value={rendForm.observacao}
                    onChange={(e) =>
                      setRendForm({ ...rendForm, observacao: e.target.value })
                    }
                    placeholder="Notas opcionais..."
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRendimentoModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRendimento}
              disabled={savingRend}
              style={{ background: '#0873F7' }}
            >
              {savingRend ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Inativar Confirmation Modal ──────────────────────────────────── */}
      <Dialog
        open={inativarTarget !== null}
        onOpenChange={(open) => { if (!open) setInativarTarget(null) }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inativar {inativarTarget?.nome}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#626F7F] py-2">
            Esta aplicação sera marcada como inativa e não contara nos totais.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInativarTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleInativar}
              disabled={inativando}
            >
              {inativando ? 'Inativando...' : 'Inativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
