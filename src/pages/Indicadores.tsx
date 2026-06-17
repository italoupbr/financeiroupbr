import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual, getMesesAnteriores } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { DreMensal, HistoricoMRR, OrcamentoMensal, Cliente, FolhaPagamento, Receita, Despesa, Imposto } from '@/types'

// ─── constants ───────────────────────────────────────────────────────────────

const mesAtual = getMesAtual()

function getPrevMes(mes: string): string {
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [m, y] = mes.split('/')
  const idx = MESES.indexOf(m)
  return idx === 0 ? `Dez/${parseInt(y) - 1}` : `${MESES[idx - 1]}/${y}`
}

// ─── skeleton shimmer ─────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[rgba(255,255,255,0.45)] ${className}`}
    />
  )
}

function KpiSkeleton() {
  return (
    <div className="liquid-glass-md rounded-3xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="liquid-glass-md rounded-3xl p-5 space-y-3">
      <Skeleton className="h-4 w-40" />
      <div style={{ height }}><Skeleton className="h-full" /></div>
    </div>
  )
}

// ─── delta badge ─────────────────────────────────────────────────────────────

function Delta({
  value,
  suffix = '%',
  invert = false,
}: {
  value: number | null
  suffix?: string
  invert?: boolean
}) {
  if (value === null || !isFinite(value)) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-[#626F7F]">
        <Minus className="h-3 w-3" />
        <span>—</span>
      </span>
    )
  }
  const positive = invert ? value < 0 : value >= 0
  const color = positive ? 'text-[#22c55e]' : 'text-[#EF4343]'
  const Icon = value >= 0 ? TrendingUp : TrendingDown
  const formatted = `${value >= 0 ? '+' : ''}${value.toFixed(1)}${suffix} vs mês anterior`
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      <span>{formatted}</span>
    </span>
  )
}

// ─── progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, warn }: { pct: number; warn: boolean }) {
  const capped = Math.min(pct, 100)
  return (
    <div className="w-full bg-[#f1f5f9] rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{
          width: `${capped}%`,
          backgroundColor: warn ? '#f59e0b' : '#0873F7',
        }}
      />
    </div>
  )
}

// ─── KPI card ────────────────────────────────────────────────────────────────

type KpiColor = 'green' | 'amber' | 'red' | 'blue'

function KpiCard({
  label,
  value,
  delta,
  deltaInvert,
  color = 'blue',
}: {
  label: string
  value: string
  delta: number | null
  deltaInvert?: boolean
  color?: KpiColor
}) {
  const colorMap: Record<KpiColor, string> = {
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#EF4343',
    blue: '#0873F7',
  }
  return (
    <div className="liquid-glass-md rounded-3xl p-5 flex flex-col gap-2">
      <p className="text-[10px] font-semibold text-[#626F7F] uppercase tracking-widest">{label}</p>
      <p
        className="font-mono text-2xl font-bold leading-none"
        style={{ color: colorMap[color] }}
      >
        {value}
      </p>
      <Delta value={delta} invert={deltaInvert} />
    </div>
  )
}

// ─── data types ───────────────────────────────────────────────────────────────

interface PageData {
  dreHistory: DreMensal[]
  mrrHistory: HistoricoMRR[]
  clientesAtivos: Cliente[]
  folhaMesAtual: FolhaPagamento[]
  orcamentoMesAtual: OrcamentoMensal[]
  receitasMesAtual: Receita[]
  despesasMesAtual: Despesa[]
  impostosMesAtual: Imposto[]
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Indicadores() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const meses6 = getMesesAnteriores(6)
  const prevMes = getPrevMes(mesAtual)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        dreRes,
        mrrRes,
        clientesRes,
        folhaRes,
        orcamentoRes,
        receitasRes,
        despesasRes,
        impostosRes,
      ] = await Promise.all([
        supabase
          .from('dre_mensal')
          .select('*')
          .in('mes_referencia', meses6)
          .order('mes_referencia', { ascending: true }),
        supabase
          .from('historico_mrr')
          .select('*')
          .in('mes_referencia', meses6)
          .order('mes_referencia', { ascending: true }),
        supabase.from('clientes').select('*').eq('ativo', true),
        supabase.from('folha_pagamento').select('*').eq('mes_referencia', mesAtual),
        supabase.from('orcamento_mensal').select('*').eq('mes_referencia', mesAtual),
        supabase.from('receitas').select('*').eq('mes_referencia', mesAtual),
        supabase.from('despesas').select('*').eq('mes_referencia', mesAtual),
        supabase.from('impostos').select('*').eq('mes_referencia', mesAtual),
      ])

      // surface any hard errors
      const erros = [dreRes, mrrRes, clientesRes, folhaRes, orcamentoRes, receitasRes, despesasRes, impostosRes]
        .map((r) => (r as { error?: { message?: string } }).error?.message)
        .filter(Boolean)
      if (erros.length > 0) throw new Error(erros[0])

      setData({
        dreHistory: (dreRes.data ?? []) as DreMensal[],
        mrrHistory: (mrrRes.data ?? []) as HistoricoMRR[],
        clientesAtivos: (clientesRes.data ?? []) as Cliente[],
        folhaMesAtual: (folhaRes.data ?? []) as FolhaPagamento[],
        orcamentoMesAtual: (orcamentoRes.data ?? []) as OrcamentoMensal[],
        receitasMesAtual: (receitasRes.data ?? []) as Receita[],
        despesasMesAtual: (despesasRes.data ?? []) as Despesa[],
        impostosMesAtual: (impostosRes.data ?? []) as Imposto[],
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(msg)
      toast({ title: 'Erro ao carregar indicadores', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [meses6.join(',')])

  useEffect(() => {
    loadData()
  }, [])

  // ─── derived values ─────────────────────────────────────────────────────────

  const derived = (() => {
    if (!data) return null

    const {
      dreHistory,
      mrrHistory,
      clientesAtivos,
      folhaMesAtual,
      orcamentoMesAtual,
      receitasMesAtual,
      despesasMesAtual,
      impostosMesAtual,
    } = data

    const dreMes = dreHistory.find((d) => d.mes_referencia === mesAtual) ?? null
    const drePrev = dreHistory.find((d) => d.mes_referencia === prevMes) ?? null

    // ── live totals ───────────────────────────────────────────────────────────
    const receitaTotal = dreMes
      ? dreMes.receita_total
      : receitasMesAtual.reduce((s, r) => s + r.valor, 0)

    const ebitda = dreMes
      ? dreMes.ebitda
      : (() => {
          const folhaTotal = folhaMesAtual.reduce((s, f) => s + f.salario, 0)
          const desp = despesasMesAtual.reduce((s, d) => s + d.valor, 0)
          const imp = impostosMesAtual.reduce((s, i) => s + i.valor, 0)
          return receitaTotal - folhaTotal - desp - imp
        })()

    const folhaTotal = dreMes
      ? dreMes.folha_total
      : folhaMesAtual.reduce((s, f) => s + f.salario, 0)

    const impostosTotal = impostosMesAtual.reduce((s, i) => s + i.valor, 0)

    // ── prev month values ─────────────────────────────────────────────────────
    const receitaTotalPrev = drePrev?.receita_total ?? null

    // ── KPI 1: Margem EBITDA ─────────────────────────────────────────────────
    const margemEbitda = receitaTotal > 0 ? (ebitda / receitaTotal) * 100 : 0
    const margemEbitdaPrev =
      drePrev && drePrev.receita_total > 0
        ? (drePrev.ebitda / drePrev.receita_total) * 100
        : null
    const margemEbitdaDelta =
      margemEbitdaPrev !== null ? margemEbitda - margemEbitdaPrev : null
    const margemColor: 'green' | 'amber' | 'red' =
      margemEbitda > 20 ? 'green' : margemEbitda >= 10 ? 'amber' : 'red'

    // ── KPI 2: MRR Growth ────────────────────────────────────────────────────
    const clientesRecorrentes = clientesAtivos.filter((c) => c.tipo === 'recorrente')
    const mrrAtual = clientesRecorrentes.reduce((s, c) => s + (c.valor_mensalidade ?? 0), 0)
    const mrrPrevRecord = mrrHistory.find((m) => m.mes_referencia === prevMes)
    const mrrPrev: number | null =
      mrrPrevRecord?.mrr ?? drePrev?.receita_recorrente ?? null
    const mrrGrowth =
      mrrPrev && mrrPrev > 0 ? ((mrrAtual - mrrPrev) / mrrPrev) * 100 : null
    const mrrGrowthColor: 'green' | 'red' =
      mrrGrowth !== null && mrrGrowth >= 0 ? 'green' : 'red'

    // ── KPI 3: Receita por Funcionário ───────────────────────────────────────
    const headcount = folhaMesAtual.length
    const receitaPorFunc = headcount > 0 ? receitaTotal / headcount : null
    const receitaTotalPrevVal = receitaTotalPrev ?? null
    const headcountPrev = null // not tracked historically, omit delta
    const receitaPorFuncPrev =
      drePrev && folhaMesAtual.length > 0
        ? drePrev.receita_total / folhaMesAtual.length
        : null
    const receitaPorFuncDelta =
      receitaPorFunc !== null && receitaPorFuncPrev !== null
        ? ((receitaPorFunc - receitaPorFuncPrev) / receitaPorFuncPrev) * 100
        : null
    void headcountPrev // suppress lint

    // ── KPI 4: Folha / Receita % ─────────────────────────────────────────────
    const folhaRatio = receitaTotal > 0 ? (folhaTotal / receitaTotal) * 100 : 0
    const folhaRatioPrev =
      drePrev && drePrev.receita_total > 0
        ? (drePrev.folha_total / drePrev.receita_total) * 100
        : null
    const folhaRatioDelta = folhaRatioPrev !== null ? folhaRatio - folhaRatioPrev : null
    const folhaRatioColor: 'green' | 'amber' | 'red' =
      folhaRatio < 30 ? 'green' : folhaRatio <= 40 ? 'amber' : 'red'

    // ── KPI 5: Ticket Médio Recorrente ───────────────────────────────────────
    const ticketMedio =
      clientesRecorrentes.length > 0 ? mrrAtual / clientesRecorrentes.length : null
    const mrrPrevVal = mrrPrev ?? null
    const countPrevRec = clientesRecorrentes.length // no historical count
    const ticketMedioPrev =
      mrrPrevVal !== null && countPrevRec > 0 ? mrrPrevVal / countPrevRec : null
    const ticketMedioDelta =
      ticketMedio !== null && ticketMedioPrev !== null
        ? ((ticketMedio - ticketMedioPrev) / ticketMedioPrev) * 100
        : null

    // ── KPI 6: LTV Médio ─────────────────────────────────────────────────────
    const avgMensalidade =
      clientesRecorrentes.length > 0
        ? clientesRecorrentes.reduce((s, c) => s + (c.valor_mensalidade ?? 0), 0) /
          clientesRecorrentes.length
        : null
    const ltvMedio = avgMensalidade !== null ? avgMensalidade * 12 : null
    const ltvMedioPrev =
      mrrPrevVal !== null && countPrevRec > 0 ? (mrrPrevVal / countPrevRec) * 12 : null
    const ltvMedioDelta =
      ltvMedio !== null && ltvMedioPrev !== null
        ? ((ltvMedio - ltvMedioPrev) / ltvMedioPrev) * 100
        : null

    void receitaTotalPrevVal // suppress lint

    // ── MRR Evolution Chart ───────────────────────────────────────────────────
    const mrrChartData = meses6.map((mes) => {
      const hist = mrrHistory.find((m) => m.mes_referencia === mes)
      const dre = dreHistory.find((d) => d.mes_referencia === mes)
      let mrr = hist?.mrr ?? dre?.receita_recorrente ?? null
      if (mes === mesAtual && mrr === null) mrr = mrrAtual
      return {
        mes: mes.split('/')[0],
        mrr: mrr ?? 0,
      }
    })

    // ── Orçado vs Realizado ───────────────────────────────────────────────────
    let orcChartData: { categoria: string; orcado: number; realizado: number }[]
    if (orcamentoMesAtual.length > 0) {
      orcChartData = orcamentoMesAtual.map((o) => ({
        categoria: o.categoria,
        orcado: o.valor_orcado,
        realizado: o.valor_realizado,
      }))
    } else {
      // build from live data
      const softwareRealizado = despesasMesAtual
        .filter((d) => d.categoria_nome?.toLowerCase().includes('software'))
        .reduce((s, d) => s + d.valor, 0)
      const escritorioRealizado = despesasMesAtual
        .filter(
          (d) =>
            d.categoria_nome?.toLowerCase().includes('escrit') ||
            d.categoria_nome?.toLowerCase().includes('escritório')
        )
        .reduce((s, d) => s + d.valor, 0)
      const parcelasRealizado = despesasMesAtual
        .filter((d) => d.categoria_tipo === 'financeiro')
        .reduce((s, d) => s + d.valor, 0)

      orcChartData = [
        { categoria: 'Folha', orcado: drePrev?.folha_total ?? 0, realizado: folhaTotal },
        { categoria: 'Software', orcado: drePrev?.despesas_software ?? 0, realizado: softwareRealizado },
        { categoria: 'Escritório', orcado: drePrev?.despesas_escritorio ?? 0, realizado: escritorioRealizado },
        { categoria: 'Parcelas', orcado: drePrev?.despesas_parcelas ?? 0, realizado: parcelasRealizado },
        { categoria: 'Impostos', orcado: drePrev?.impostos_das ?? 0, realizado: impostosTotal },
      ].filter((r) => r.orcado > 0 || r.realizado > 0)
    }

    // ── Top 5 Clientes por Receita ────────────────────────────────────────────
    const receitaByCliente = new Map<string, number>()
    for (const r of receitasMesAtual) {
      const key = r.cliente_nome ?? 'Sem nome'
      receitaByCliente.set(key, (receitaByCliente.get(key) ?? 0) + r.valor)
    }
    const top5Clientes = Array.from(receitaByCliente.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome, valor }))

    // ── Despesas como % da Receita ────────────────────────────────────────────
    const softwareTotal = despesasMesAtual
      .filter((d) => d.categoria_nome?.toLowerCase().includes('software'))
      .reduce((s, d) => s + d.valor, 0)
    const escritorioTotal = despesasMesAtual
      .filter(
        (d) =>
          d.categoria_nome?.toLowerCase().includes('escrit') ||
          d.categoria_nome?.toLowerCase().includes('escritório')
      )
      .reduce((s, d) => s + d.valor, 0)
    const parcelasTotal = despesasMesAtual
      .filter((d) => d.categoria_tipo === 'financeiro')
      .reduce((s, d) => s + d.valor, 0)

    const tabelaDespesas = [
      { categoria: 'Folha', valor: folhaTotal },
      { categoria: 'Software', valor: softwareTotal },
      { categoria: 'Escritório', valor: escritorioTotal },
      { categoria: 'Parcelas', valor: parcelasTotal },
      { categoria: 'Impostos', valor: impostosTotal },
    ]

    return {
      margemEbitda,
      margemEbitdaDelta,
      margemColor,
      mrrAtual,
      mrrGrowth,
      mrrGrowthColor,
      receitaPorFunc,
      receitaPorFuncDelta,
      folhaRatio,
      folhaRatioDelta,
      folhaRatioColor,
      ticketMedio,
      ticketMedioDelta,
      ltvMedio,
      ltvMedioDelta,
      mrrChartData,
      orcChartData,
      top5Clientes,
      tabelaDespesas,
      receitaTotal,
    }
  })()

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#273544]">KPIs Financeiros — {mesAtual}</h2>
          <p className="text-xs text-[#626F7F] mt-0.5">
            Indicadores calculados com base nos dados do mês atual
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="text-[#626F7F] hover:text-[#273544]"
          title="Atualizar dados"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ── Error banner ── */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={loadData}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : !derived ? (
        <div className="text-sm text-[#626F7F] liquid-glass-md rounded-3xl p-6 text-center">
          Nenhum dado disponível para o período.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              label="Margem EBITDA"
              value={`${derived.margemEbitda.toFixed(1)}%`}
              delta={derived.margemEbitdaDelta}
              color={derived.margemColor}
            />
            <KpiCard
              label="MRR Growth"
              value={derived.mrrGrowth !== null ? `${derived.mrrGrowth.toFixed(1)}%` : '—'}
              delta={derived.mrrGrowth}
              color={derived.mrrGrowthColor}
            />
            <KpiCard
              label="Receita / Func."
              value={derived.receitaPorFunc !== null ? formatCurrency(derived.receitaPorFunc) : '—'}
              delta={derived.receitaPorFuncDelta}
              color="blue"
            />
            <KpiCard
              label="Folha / Receita"
              value={`${derived.folhaRatio.toFixed(1)}%`}
              delta={derived.folhaRatioDelta}
              deltaInvert
              color={derived.folhaRatioColor}
            />
            <KpiCard
              label="Ticket Médio Rec."
              value={derived.ticketMedio !== null ? formatCurrency(derived.ticketMedio) : '—'}
              delta={derived.ticketMedioDelta}
              color="blue"
            />
            <KpiCard
              label="LTV Médio"
              value={derived.ltvMedio !== null ? formatCurrency(derived.ltvMedio) : '—'}
              delta={derived.ltvMedioDelta}
              color="blue"
            />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* MRR Evolution */}
            <div className="liquid-glass-md rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-[#273544] mb-4">Evolução do MRR</h3>
              {derived.mrrChartData.every((d) => d.mrr === 0) ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-[#626F7F]">
                  Sem dados de MRR para exibir
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={derived.mrrChartData}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0873F7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0873F7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#626F7F' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#626F7F' }}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                      width={42}
                    />
                    <Tooltip
                      formatter={(v: unknown) => [formatCurrency(Number(v)), 'MRR']}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      stroke="#0873F7"
                      strokeWidth={2}
                      fill="url(#mrrGrad)"
                      name="MRR"
                      dot={{ r: 3, fill: '#0873F7' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Orçado vs Realizado */}
            <div className="liquid-glass-md rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-[#273544] mb-4">Orçado vs Realizado</h3>
              {derived.orcChartData.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-[#626F7F]">
                  Sem dados de orçamento para exibir
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={derived.orcChartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="categoria"
                      tick={{ fontSize: 10, fill: '#626F7F' }}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#626F7F' }}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                      width={42}
                    />
                    <Tooltip
                      formatter={(v: unknown, name: unknown) => [
                        formatCurrency(Number(v)),
                        name === 'orcado' ? 'Orçado' : 'Realizado',
                      ]}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === 'orcado' ? 'Orçado' : 'Realizado'
                      }
                    />
                    <Bar dataKey="orcado" fill="rgba(255,255,255,0.45)" radius={[3, 3, 0, 0]} name="orcado" />
                    <Bar dataKey="realizado" fill="#0873F7" radius={[3, 3, 0, 0]} name="realizado" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top 5 Clientes */}
            <div className="liquid-glass-md rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-[#273544] mb-4">
                Top 5 Clientes por Receita
              </h3>
              {derived.top5Clientes.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-[#626F7F]">
                  Nenhuma receita lançada no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={derived.top5Clientes}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#626F7F' }}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      tick={{ fontSize: 10, fill: '#626F7F' }}
                      width={90}
                    />
                    <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), 'Receita']} />
                    <Bar dataKey="valor" radius={[0, 3, 3, 0]} name="Receita">
                      {derived.top5Clientes.map((_, i) => (
                        <Cell key={i} fill="#22c55e" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Despesas como % da Receita ── */}
          <div className="liquid-glass-md rounded-3xl p-5">
            <h3 className="text-sm font-semibold text-[#273544] mb-4">
              Despesas como % da Receita — {mesAtual}
            </h3>
            {derived.tabelaDespesas.every((r) => r.valor === 0) ? (
              <p className="text-sm text-[#626F7F] text-center py-6">
                Nenhuma despesa registrada para o período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.45)]">
                      <td className="pb-2 font-semibold text-[#273544] w-1/4">Categoria</td>
                      <td className="pb-2 font-semibold text-[#273544] text-right w-1/4">Valor</td>
                      <td className="pb-2 font-semibold text-[#273544] text-right w-16">% Receita</td>
                      <td className="pb-2 w-1/3 pl-4"></td>
                    </tr>
                  </thead>
                  <tbody>
                    {derived.tabelaDespesas.map((row) => {
                      const pct =
                        derived.receitaTotal > 0
                          ? (row.valor / derived.receitaTotal) * 100
                          : 0
                      const warn = pct > 30
                      return (
                        <tr
                          key={row.categoria}
                          className={`border-b border-[#f1f5f9] last:border-0 ${
                            warn ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-3 font-medium text-[#273544]">{row.categoria}</td>
                          <td className="py-3 font-mono text-right text-[#273544]">
                            {formatCurrency(row.valor)}
                          </td>
                          <td
                            className={`py-3 font-mono text-right text-xs font-semibold ${
                              warn ? 'text-[#f59e0b]' : 'text-[#626F7F]'
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </td>
                          <td className="py-3 pl-4">
                            <ProgressBar pct={pct} warn={warn} />
                          </td>
                        </tr>
                      )
                    })}
                    {/* Total row */}
                    <tr className="border-t-2 border-[rgba(255,255,255,0.45)]">
                      <td className="pt-3 font-bold text-[#273544]">Total Despesas</td>
                      <td className="pt-3 font-mono font-bold text-right text-[#273544]">
                        {formatCurrency(
                          derived.tabelaDespesas.reduce((s, r) => s + r.valor, 0)
                        )}
                      </td>
                      <td className="pt-3 font-mono font-bold text-right text-xs text-[#273544]">
                        {derived.receitaTotal > 0
                          ? `${(
                              (derived.tabelaDespesas.reduce((s, r) => s + r.valor, 0) /
                                derived.receitaTotal) *
                              100
                            ).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── loading chart skeletons while data is present but refreshing ── */}
      {loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-1">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      )}
    </div>
  )
}
