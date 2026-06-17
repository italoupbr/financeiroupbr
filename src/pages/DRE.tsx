import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual, getMesesAnteriores } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { calculateDRE } from '@/lib/formulas'
import { Download, Lock } from 'lucide-react'
import type { DreMensal, Socio, Empresa, Receita, Despesa, FolhaPagamento, Imposto } from '@/types'
import jsPDF from 'jspdf'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DREValues {
  receitaRecorrente: number
  receitaVariavel: number
  receitaTotal: number
  receitaLiquida: number
  folha: number
  despesasSoftware: number
  despesasEscritorio: number
  despesasParcelas: number
  impostosDAS: number
  impostosOutros: number
  despesasOperacionais: number
  despesasFinanceiras: number
  despesaTotal: number
  ebitda: number
  margemEbitda: number
  lucroLiquido: number
  caixaReserva: number
  lucroDistribuivel: number
  distribuicao: { nome: string; percentual: number; valor: number }[]
}

type CompareMode = 'none' | 'prevMonth' | 'prevYear'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns "YYYY-MM" for the month prior to the given "YYYY-MM" string */
function getPreviousMonth(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Returns "YYYY-MM" for the same month one year back */
function getPreviousYear(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  return `${year - 1}-${String(month).padStart(2, '0')}`
}

/** Format delta percentage with ▲/▼ prefix */
function formatDelta(current: number, compare: number): { text: string; positive: boolean | null } {
  if (compare === 0) return { text: '—', positive: null }
  const pct = ((current - compare) / Math.abs(compare)) * 100
  const positive = pct >= 0
  return {
    text: `${positive ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`,
    positive,
  }
}

// ---------------------------------------------------------------------------
// DREStatement sub-component
// ---------------------------------------------------------------------------

interface DREStatementProps {
  values: DREValues
  empresa: Empresa | null
  mes: string
  compareValues?: DREValues | null
  compareMode?: CompareMode
}

function DREStatement({ values, empresa, mes, compareValues, compareMode }: DREStatementProps) {
  const hasCompare = !!compareValues && compareMode && compareMode !== 'none'

  const compareLabel =
    compareMode === 'prevMonth'
      ? getPreviousMonth(mes)
      : compareMode === 'prevYear'
        ? getPreviousYear(mes)
        : ''

  const Row = ({
    label,
    value,
    compareValue,
    bold,
    indent,
    color,
    hideCompare,
  }: {
    label: string
    value: number
    compareValue?: number
    bold?: boolean
    indent?: boolean
    color?: string
    hideCompare?: boolean
  }) => {
    const delta = hasCompare && !hideCompare && compareValue !== undefined
      ? formatDelta(value, compareValue)
      : null

    return (
      <div
        className={`flex justify-between items-center py-1.5 ${indent ? 'pl-6' : ''} ${bold ? 'font-semibold' : ''}`}
      >
        <span className="text-sm text-[#273544] flex-1">{label}</span>

        {hasCompare && !hideCompare && (
          <span className="font-mono text-xs text-[#94a3b8] w-28 text-right pr-4">
            {compareValue !== undefined ? formatCurrency(compareValue) : '—'}
          </span>
        )}

        <span
          className={`font-mono text-sm ${bold ? 'font-bold' : ''} ${color || 'text-[#273544]'} w-28 text-right`}
        >
          {formatCurrency(value)}
        </span>

        {hasCompare && !hideCompare && (
          <span
            className={`font-mono text-xs w-20 text-right ${
              delta?.positive === true
                ? 'text-[#22c55e]'
                : delta?.positive === false
                  ? 'text-[#EF4343]'
                  : 'text-[#94a3b8]'
            }`}
          >
            {delta?.text ?? '—'}
          </span>
        )}
      </div>
    )
  }

  const Divider = () => <hr className="border-[rgba(255,255,255,0.45)] my-2" />

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold text-[#626F7F] uppercase tracking-wider pt-3 pb-1">
      {children}
    </div>
  )

  const aliquota = empresa?.aliquota_simples ?? 12.5

  return (
    <div className="liquid-glass-md rounded-3xl p-6 max-w-3xl">
      {/* Title */}
      <div className="mb-4 pb-4 border-b border-[rgba(255,255,255,0.45)]">
        <h2 className="font-bold text-[#273544]">{empresa?.nome ?? 'Upsend Brasil'}</h2>
        <p className="text-sm text-[#626F7F]">DRE — Demonstração do Resultado do Exercício</p>
        <p className="text-sm text-[#626F7F]">Período: {mes}</p>
        {hasCompare && (
          <p className="text-xs text-[#94a3b8] mt-1">
            Comparando com: {compareLabel}
          </p>
        )}
      </div>

      {/* Column headers when comparing */}
      {hasCompare && (
        <div className="flex justify-end items-center gap-0 mb-1 pb-1 border-b border-[rgba(255,255,255,0.45)]">
          <span className="text-xs text-[#94a3b8] w-28 text-right pr-4">{compareLabel}</span>
          <span className="text-xs font-semibold text-[#273544] w-28 text-right">{mes}</span>
          <span className="text-xs text-[#626F7F] w-20 text-right">Δ</span>
        </div>
      )}

      <SectionHeader>Receita Bruta</SectionHeader>
      <Row
        label="Clientes Recorrentes (MRR)"
        value={values.receitaRecorrente}
        compareValue={compareValues?.receitaRecorrente}
        indent
      />
      <Row
        label="Clientes Variáveis"
        value={values.receitaVariavel}
        compareValue={compareValues?.receitaVariavel}
        indent
      />
      <Divider />
      <Row
        label="(=) RECEITA TOTAL"
        value={values.receitaTotal}
        compareValue={compareValues?.receitaTotal}
        bold
        color="text-[#273544]"
      />

      <SectionHeader>(-) Deduções</SectionHeader>
      <Row
        label={`Simples Nacional (~${aliquota}%)`}
        value={values.impostosDAS}
        compareValue={compareValues?.impostosDAS}
        indent
      />
      <Divider />
      <Row
        label="(=) RECEITA LÍQUIDA"
        value={values.receitaLiquida}
        compareValue={compareValues?.receitaLiquida}
        bold
      />

      <SectionHeader>(-) Custos e Despesas Operacionais</SectionHeader>
      <Row
        label="Folha de Pagamento"
        value={values.folha}
        compareValue={compareValues?.folha}
        indent
      />
      <Row
        label="Software e Plataformas"
        value={values.despesasSoftware}
        compareValue={compareValues?.despesasSoftware}
        indent
      />
      <Row
        label="Escritório"
        value={values.despesasEscritorio}
        compareValue={compareValues?.despesasEscritorio}
        indent
      />
      <Divider />

      {/* EBITDA with enhanced margin label */}
      <Row
        label="(=) EBITDA"
        value={values.ebitda}
        compareValue={compareValues?.ebitda}
        bold
        color={values.ebitda >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'}
      />
      <div className={`flex justify-end ${hasCompare ? 'pr-48' : ''}`}>
        <span className="text-right text-xs font-semibold text-[#0873F7] mb-2 bg-white/30 px-2 py-0.5 rounded">
          Margem: {values.margemEbitda.toFixed(1)}%
        </span>
      </div>

      <SectionHeader>(-) Despesas Financeiras e Impostos</SectionHeader>
      <Row
        label="Parcelas / Financiamentos"
        value={values.despesasParcelas}
        compareValue={compareValues?.despesasParcelas}
        indent
      />
      <Row
        label="DARF / Outros Impostos"
        value={values.impostosOutros}
        compareValue={compareValues?.impostosOutros}
        indent
      />
      <Divider />
      <Row
        label="(=) LUCRO LÍQUIDO"
        value={values.lucroLiquido}
        compareValue={compareValues?.lucroLiquido}
        bold
        color={values.lucroLiquido >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'}
      />
      <Row
        label="(-) Reserva de Caixa"
        value={values.caixaReserva}
        compareValue={compareValues?.caixaReserva}
        color="text-[#626F7F]"
      />
      <Divider />

      {/* Lucro Distribuível highlight box */}
      <div className="bg-white/30 border border-[#0873F7]/20 rounded-lg p-3 my-3">
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#273544] text-sm">(=) LUCRO DISTRIBUÍVEL</span>
          <div className="flex items-center gap-4">
            {hasCompare && compareValues && (
              <>
                <span className="font-mono text-sm text-[#94a3b8]">
                  {formatCurrency(compareValues.lucroDistribuivel)}
                </span>
                {(() => {
                  const d = formatDelta(values.lucroDistribuivel, compareValues.lucroDistribuivel)
                  return (
                    <span
                      className={`font-mono text-xs ${
                        d.positive === true
                          ? 'text-[#22c55e]'
                          : d.positive === false
                            ? 'text-[#EF4343]'
                            : 'text-[#94a3b8]'
                      }`}
                    >
                      {d.text}
                    </span>
                  )
                })()}
              </>
            )}
            <span
              className={`font-mono font-bold text-lg ${
                values.lucroDistribuivel >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'
              }`}
            >
              {formatCurrency(values.lucroDistribuivel)}
            </span>
          </div>
        </div>
      </div>

      <SectionHeader>Distribuição por Sócio</SectionHeader>
      {values.distribuicao.map(
        (s: { nome: string; percentual: number; valor: number }, i: number) => (
          <Row
            key={i}
            label={`${s.nome} (${s.percentual}%)`}
            value={s.valor}
            compareValue={compareValues?.distribuicao[i]?.valor}
            indent
          />
        ),
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading spinner
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 rounded-full border-4 border-[#0873F7]/20 border-t-[#0873F7] animate-spin" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DRE() {
  const [selectedMes, setSelectedMes] = useState<string>(getMesAtual())
  const [compareMode, setCompareMode] = useState<CompareMode>('none')
  const [dre, setDre] = useState<DreMensal | null>(null)
  const [compareDre, setCompareDre] = useState<DreMensal | null>(null)
  const [socios, setSocios] = useState<Socio[]>([])
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [liveData, setLiveData] = useState<{
    receitas: Receita[]
    despesas: Despesa[]
    folha: FolhaPagamento[]
    impostos: Imposto[]
  } | null>(null)
  const [compareLiveData, setCompareLiveData] = useState<{
    receitas: Receita[]
    despesas: Despesa[]
    folha: FolhaPagamento[]
    impostos: Imposto[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fecharDialog, setFecharDialog] = useState(false)

  // -------------------------------------------------------------------------
  // Derived comparison month
  // -------------------------------------------------------------------------

  const compareMes =
    compareMode === 'prevMonth'
      ? getPreviousMonth(selectedMes)
      : compareMode === 'prevYear'
        ? getPreviousYear(selectedMes)
        : null

  // -------------------------------------------------------------------------
  // Helper: fetch live transaction data for a given month
  // -------------------------------------------------------------------------

  async function fetchLiveForMonth(mes: string) {
    const [receitasRes, despesasRes, folhaRes, impostosRes] = await Promise.all([
      supabase.from('receitas').select('*, clientes(tipo)').eq('mes_referencia', mes),
      supabase.from('despesas').select('*').eq('mes_referencia', mes),
      supabase.from('folha_pagamento').select('*').eq('mes_referencia', mes),
      supabase.from('impostos').select('*').eq('mes_referencia', mes),
    ])
    return {
      receitas: (receitasRes.data ?? []) as Receita[],
      despesas: (despesasRes.data ?? []) as Despesa[],
      folha: (folhaRes.data ?? []) as FolhaPagamento[],
      impostos: (impostosRes.data ?? []) as Imposto[],
    }
  }

  // -------------------------------------------------------------------------
  // Data fetching — primary month
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setDre(null)
      setLiveData(null)

      try {
        const [dreRes, sociosRes, empresaRes] = await Promise.all([
          supabase
            .from('dre_mensal')
            .select('*')
            .eq('mes_referencia', selectedMes)
            .maybeSingle(),
          supabase
            .from('socios')
            .select('*')
            .eq('ativo', true)
            .or('participa_distribuicao.eq.true,participa_distribuicao.is.null')
            .order('nome'),
          supabase.from('empresa').select('*').limit(1).maybeSingle(),
        ])

        if (cancelled) return

        const dreData: DreMensal | null = dreRes.data ?? null
        const sociosData: Socio[] = sociosRes.data ?? []
        const empresaData: Empresa | null = empresaRes.data ?? null

        setSocios(sociosData)
        setEmpresa(empresaData)
        setDre(dreData)

        // Fetch live data when there is no closed DRE
        if (!dreData || dreData.status !== 'fechado') {
          const live = await fetchLiveForMonth(selectedMes)
          if (cancelled) return
          setLiveData(live)
        }
      } catch (err) {
        console.error('Erro ao carregar DRE:', err)
        toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [selectedMes])

  // -------------------------------------------------------------------------
  // Data fetching — comparison month
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!compareMes) {
      setCompareDre(null)
      setCompareLiveData(null)
      return
    }

    let cancelled = false

    async function loadCompare() {
      try {
        const { data: dreData } = await supabase
          .from('dre_mensal')
          .select('*')
          .eq('mes_referencia', compareMes)
          .maybeSingle()

        if (cancelled) return

        setCompareDre(dreData ?? null)

        if (!dreData || dreData.status !== 'fechado') {
          const live = await fetchLiveForMonth(compareMes!)
          if (cancelled) return
          setCompareLiveData(live)
        } else {
          setCompareLiveData(null)
        }
      } catch (err) {
        console.error('Erro ao carregar DRE de comparação:', err)
        toast({ title: 'Erro ao carregar dados de comparação', variant: 'destructive' })
      }
    }

    loadCompare()
    return () => {
      cancelled = true
    }
  }, [compareMes])

  // -------------------------------------------------------------------------
  // Compute DRE values from raw data or closed record
  // -------------------------------------------------------------------------

  function buildDREValues(
    dreRecord: DreMensal | null,
    live: { receitas: Receita[]; despesas: Despesa[]; folha: FolhaPagamento[]; impostos: Imposto[] } | null,
    sociosList: Socio[],
    empresaData: Empresa | null,
  ): DREValues {
    if (dreRecord && dreRecord.status === 'fechado') {
      const receitaTotal = dreRecord.receita_total
      const lucroDistribuivel = dreRecord.lucro_distribuivel
      const distribuicao = sociosList.map(s => ({
        nome: s.nome,
        percentual: s.percentual,
        valor: Math.max(0, lucroDistribuivel) * (s.percentual / 100),
      }))
      return {
        receitaRecorrente: dreRecord.receita_recorrente,
        receitaVariavel: dreRecord.receita_variavel,
        receitaTotal,
        receitaLiquida: receitaTotal - dreRecord.impostos_das,
        folha: dreRecord.folha_total,
        despesasSoftware: dreRecord.despesas_software,
        despesasEscritorio: dreRecord.despesas_escritorio,
        despesasParcelas: dreRecord.despesas_parcelas,
        impostosDAS: dreRecord.impostos_das,
        impostosOutros: dreRecord.impostos_outros,
        despesasOperacionais: dreRecord.folha_total + dreRecord.despesas_software + dreRecord.despesas_escritorio,
        despesasFinanceiras: dreRecord.despesas_parcelas + dreRecord.impostos_outros,
        despesaTotal: dreRecord.despesa_total,
        ebitda: dreRecord.ebitda,
        margemEbitda: receitaTotal > 0 ? (dreRecord.ebitda / receitaTotal) * 100 : 0,
        lucroLiquido: dreRecord.lucro_liquido,
        caixaReserva: dreRecord.caixa_reserva,
        lucroDistribuivel,
        distribuicao,
      }
    }

    const receitas = live?.receitas ?? []
    const despesas = live?.despesas ?? []
    const folha = live?.folha ?? []
    const impostos = live?.impostos ?? []

    const receitaRecorrente = receitas
      .filter((r: Receita & { clientes?: { tipo?: string } | null }) => {
        const joined = (r as Receita & { clientes?: { tipo?: string } | null }).clientes
        return joined?.tipo === 'recorrente'
      })
      .reduce((s: number, r: Receita) => s + r.valor, 0)

    const receitaTotal = receitas.reduce((s: number, r: Receita) => s + r.valor, 0)
    const receitaVariavel = receitaTotal - receitaRecorrente

    const folhaTotal = folha.reduce((s: number, f: FolhaPagamento) => s + f.salario, 0)

    const despesasSoftware = despesas
      .filter((d: Despesa) => d.categoria_nome?.toLowerCase().includes('software'))
      .reduce((s: number, d: Despesa) => s + d.valor, 0)

    const despesasEscritorio = despesas
      .filter(
        (d: Despesa) =>
          d.categoria_nome?.toLowerCase().includes('escritório') ||
          d.categoria_nome?.toLowerCase().includes('escritorio'),
      )
      .reduce((s: number, d: Despesa) => s + d.valor, 0)

    const despesasParcelas = despesas
      .filter((d: Despesa) => d.categoria_tipo === 'financeiro')
      .reduce((s: number, d: Despesa) => s + d.valor, 0)

    const impostosDAS = impostos
      .filter((i: Imposto) => i.tipo === 'DAS')
      .reduce((s: number, i: Imposto) => s + i.valor, 0)

    const impostosOutros = impostos
      .filter((i: Imposto) => i.tipo !== 'DAS')
      .reduce((s: number, i: Imposto) => s + i.valor, 0)

    const caixaReserva = empresaData?.caixa_reserva ?? 4000

    const result = calculateDRE({
      receitaRecorrente,
      receitaVariavel,
      folha: folhaTotal,
      despesasSoftware,
      despesasEscritorio,
      despesasParcelas,
      impostosDAS,
      impostosOutros,
      caixaReserva,
      socios: sociosList.map(s => ({ nome: s.nome, percentual: s.percentual })),
    })

    return {
      receitaRecorrente,
      receitaVariavel,
      receitaTotal: result.receitaTotal,
      receitaLiquida: result.receitaLiquida,
      folha: folhaTotal,
      despesasSoftware,
      despesasEscritorio,
      despesasParcelas,
      impostosDAS,
      impostosOutros,
      despesasOperacionais: result.despesasOperacionais,
      despesasFinanceiras: result.despesasFinanceiras,
      despesaTotal: result.despesaTotal,
      ebitda: result.ebitda,
      margemEbitda: result.margemEbitda,
      lucroLiquido: result.lucroLiquido,
      caixaReserva,
      lucroDistribuivel: result.lucroDistribuivel,
      distribuicao: result.distribuicao,
    }
  }

  const dreValues: DREValues = buildDREValues(dre, liveData, socios, empresa)

  const compareValues: DREValues | null =
    compareMes
      ? buildDREValues(compareDre, compareLiveData, socios, empresa)
      : null

  // -------------------------------------------------------------------------
  // Fechar mês
  // -------------------------------------------------------------------------

  async function handleFecharMes() {
    setSaving(true)
    try {
      const payload = {
        mes_referencia: selectedMes,
        receita_recorrente: dreValues.receitaRecorrente,
        receita_variavel: dreValues.receitaVariavel,
        receita_total: dreValues.receitaTotal,
        folha_total: dreValues.folha,
        despesas_software: dreValues.despesasSoftware,
        despesas_escritorio: dreValues.despesasEscritorio,
        despesas_parcelas: dreValues.despesasParcelas,
        impostos_das: dreValues.impostosDAS,
        impostos_outros: dreValues.impostosOutros,
        despesa_total: dreValues.despesaTotal,
        ebitda: dreValues.ebitda,
        lucro_liquido: dreValues.lucroLiquido,
        caixa_reserva: dreValues.caixaReserva,
        lucro_distribuivel: dreValues.lucroDistribuivel,
        status: 'fechado' as const,
        fechado_em: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('dre_mensal')
        .upsert(payload, { onConflict: 'mes_referencia' })

      if (error) throw error

      const { data } = await supabase
        .from('dre_mensal')
        .select('*')
        .eq('mes_referencia', selectedMes)
        .maybeSingle()

      setDre(data ?? null)
      setFecharDialog(false)
      toast({ title: `Mês ${selectedMes} fechado com sucesso.` })
    } catch (err) {
      console.error('Erro ao fechar mês:', err)
      toast({ title: 'Erro ao fechar mês', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Export PDF
  // -------------------------------------------------------------------------

  function exportPDF() {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const now = new Date()
      const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      // ---- Header ----
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(18, 123, 240) // #0873F7
      doc.text('UPSEND BRASIL', pageWidth / 2, 22, { align: 'center' })

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(56, 73, 94) // #273544
      doc.text('Demonstração do Resultado do Exercício', pageWidth / 2, 31, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139) // #626F7F
      doc.text(`Período: ${selectedMes}`, pageWidth / 2, 39, { align: 'center' })
      doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth / 2, 46, { align: 'center' })

      // Header rule
      doc.setDrawColor(18, 123, 240)
      doc.setLineWidth(0.5)
      doc.line(20, 50, pageWidth - 20, 50)

      let y = 60
      doc.setTextColor(0, 0, 0)

      const addRow = (label: string, value: number, bold = false) => {
        if (bold) doc.setFont('helvetica', 'bold')
        else doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(56, 73, 94)
        doc.text(label, 22, y)
        doc.text(formatCurrency(value), pageWidth - 20, y, { align: 'right' })
        y += 7
      }

      const addDivider = (thin = true) => {
        doc.setDrawColor(thin ? 200 : 100, thin ? 200 : 100, thin ? 200 : 100)
        doc.setLineWidth(thin ? 0.2 : 0.5)
        doc.line(20, y, pageWidth - 20, y)
        y += 5
      }

      const addSectionHeader = (text: string) => {
        y += 3
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(text.toUpperCase(), 22, y)
        doc.setTextColor(56, 73, 94)
        doc.setFontSize(10)
        y += 6
      }

      const addNote = (text: string) => {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(text, pageWidth - 20, y, { align: 'right' })
        doc.setTextColor(56, 73, 94)
        y += 6
      }

      addSectionHeader('Receita Bruta')
      addRow('    Clientes Recorrentes (MRR)', dreValues.receitaRecorrente)
      addRow('    Clientes Variáveis', dreValues.receitaVariavel)
      addDivider()
      addRow('(=) Receita Total', dreValues.receitaTotal, true)

      addSectionHeader(`(-) Deduções`)
      addRow(`    Simples Nacional (~${empresa?.aliquota_simples ?? 12.5}%)`, dreValues.impostosDAS)
      addDivider()
      addRow('(=) Receita Líquida', dreValues.receitaLiquida, true)

      addSectionHeader('(-) Custos e Despesas Operacionais')
      addRow('    Folha de Pagamento', dreValues.folha)
      addRow('    Software e Plataformas', dreValues.despesasSoftware)
      addRow('    Escritório', dreValues.despesasEscritorio)
      addDivider()
      addRow('(=) EBITDA', dreValues.ebitda, true)
      addNote(`Margem EBITDA: ${dreValues.margemEbitda.toFixed(1)}%`)

      addSectionHeader('(-) Despesas Financeiras e Impostos')
      addRow('    Parcelas / Financiamentos', dreValues.despesasParcelas)
      addRow('    DARF / Outros Impostos', dreValues.impostosOutros)
      addDivider()
      addRow('(=) Lucro Líquido', dreValues.lucroLiquido, true)
      addRow('(-) Reserva de Caixa', dreValues.caixaReserva)
      addDivider(false)

      // Lucro distribuível highlight
      doc.setFillColor(237, 241, 250) // #F2F6FA
      doc.roundedRect(20, y - 2, pageWidth - 40, 12, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(56, 73, 94)
      doc.text('(=) LUCRO DISTRIBUÍVEL', 24, y + 6)
      doc.text(formatCurrency(dreValues.lucroDistribuivel), pageWidth - 22, y + 6, { align: 'right' })
      y += 18

      if (dreValues.distribuicao.length > 0) {
        addSectionHeader('Distribuição por Sócio')
        dreValues.distribuicao.forEach(s => {
          addRow(`    ${s.nome} (${s.percentual}%)`, s.valor)
        })
      }

      // ---- Footer ----
      const footerY = doc.internal.pageSize.getHeight() - 25
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(20, footerY, pageWidth - 20, footerY)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text('Gerado pelo Painel CFO Upsend Brasil', pageWidth / 2, footerY + 6, { align: 'center' })

      // Digital signature line
      doc.text('__________________________', pageWidth - 20, footerY + 14, { align: 'right' })
      doc.text('Responsável Financeiro', pageWidth - 20, footerY + 19, { align: 'right' })

      const safeMes = selectedMes.replace('/', '_')
      doc.save(`DRE_${safeMes}.pdf`)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' })
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedMes} onValueChange={setSelectedMes}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMesesAnteriores(12).map(m => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period comparison toggle */}
        <div className="flex rounded-md border border-[rgba(255,255,255,0.45)] overflow-hidden">
          {(
            [
              { mode: 'none' as CompareMode, label: 'Este mês' },
              { mode: 'prevMonth' as CompareMode, label: 'vs Mês Anterior' },
              { mode: 'prevYear' as CompareMode, label: 'vs Ano Anterior' },
            ] as const
          ).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setCompareMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                compareMode === mode
                  ? 'bg-[#0873F7] text-white'
                  : 'bg-white/50 text-[#626F7F] hover:bg-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {dre?.status === 'fechado' && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
            <Lock className="h-3 w-3" /> Mês fechado
          </span>
        )}

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={loading}>
            <Download className="h-3.5 w-3.5 mr-1" /> Exportar PDF
          </Button>
          {dre?.status !== 'fechado' && (
            <Button size="sm" onClick={() => setFecharDialog(true)} disabled={loading}>
              <Lock className="h-3.5 w-3.5 mr-1" /> Fechar Mês
            </Button>
          )}
        </div>
      </div>

      {/* DRE Statement */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DREStatement
          values={dreValues}
          empresa={empresa}
          mes={selectedMes}
          compareValues={compareValues}
          compareMode={compareMode}
        />
      )}

      {/* Fechar Mês Dialog */}
      <Dialog open={fecharDialog} onOpenChange={setFecharDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar mês {selectedMes}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#626F7F]">
            Ao fechar o mês, os valores do DRE serão gravados e o período ficará bloqueado para
            edição. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setFecharDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleFecharMes} disabled={saving}>
              {saving ? 'Salvando...' : 'Confirmar Fechamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
