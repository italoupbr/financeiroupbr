import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual, getMesesAnteriores } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Download, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { Receita, Despesa, FolhaPagamento, Imposto, Cliente, Empresa } from '@/types'
import jsPDF from 'jspdf'

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'pago'
      ? 'bg-green-500'
      : status === 'atrasado'
        ? 'bg-red-500'
        : 'bg-amber-400'
  return <span className={`inline-block w-2 h-2 rounded-full ${color} flex-shrink-0`} />
}

// ---------------------------------------------------------------------------
// Skeleton shimmer
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="liquid-glass-md rounded-3xl p-5 animate-pulse">
      <div className="h-3 w-28 bg-slate-200 rounded mb-3" />
      <div className="h-8 w-40 bg-slate-200 rounded mb-3" />
      <div className="h-3 w-48 bg-slate-100 rounded mb-1.5" />
      <div className="h-3 w-36 bg-slate-100 rounded" />
    </div>
  )
}

function SkeletonColumn() {
  return (
    <div className="liquid-glass-md rounded-3xl overflow-hidden animate-pulse">
      <div className="h-11 bg-slate-300" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.45)]">
          <div className="h-3 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
      ))}
      <div className="flex justify-between px-4 py-3 bg-slate-50">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-3 w-24 bg-slate-200 rounded" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Expandable category row
// ---------------------------------------------------------------------------

interface ExpandableRowProps {
  icon: string
  label: string
  value: number
  items: React.ReactNode
  rowBg: string
}

function ExpandableRow({ icon, label, value, items, rowBg }: ExpandableRowProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#f0f7ff] transition-colors ${rowBg}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="flex items-center gap-2 text-sm text-[#273544]">
          <span>{icon}</span>
          {label}
        </span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm text-[#EF4343]">{formatCurrency(value)}</span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-[#94a3b8]" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" />
          )}
        </span>
      </div>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[500px]' : 'max-h-0'}`}
      >
        {items}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Expandable revenue row
// ---------------------------------------------------------------------------

interface ExpandableReceitaRowProps {
  icon: string
  label: string
  value: number
  items: React.ReactNode
  rowBg: string
}

function ExpandableReceitaRow({ icon, label, value, items, rowBg }: ExpandableReceitaRowProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#f0f7ff] transition-colors ${rowBg}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="flex items-center gap-2 text-sm text-[#273544]">
          <span>{icon}</span>
          {label}
        </span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm text-[#22c55e] font-medium">{formatCurrency(value)}</span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-[#94a3b8]" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" />
          )}
        </span>
      </div>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[500px]' : 'max-h-0'}`}
      >
        {items}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Column header
// ---------------------------------------------------------------------------

function ColumnHeader({ left, right }: { left: string; right: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: '#1a2742' }}
    >
      <span className="text-white font-semibold text-sm">{left}</span>
      <span className="text-white/60 text-xs">{right}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column footer
// ---------------------------------------------------------------------------

function ColumnFooter({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: 'green' | 'red'
}) {
  const bg = variant === 'green' ? 'bg-[#f0fdf4]' : 'bg-[#fff5f5]'
  const textColor = variant === 'green' ? 'text-[#22c55e]' : 'text-[#EF4343]'

  return (
    <div className={`flex items-center justify-between px-4 py-3 ${bg}`}>
      <span className="text-sm font-bold text-[#273544]">{label}</span>
      <span className={`font-mono font-bold text-sm ${textColor}`}>{formatCurrency(value)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-6 text-center text-sm text-[#94a3b8]">{message}</div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function VisaoGeral() {
  const navigate = useNavigate()

  const [selectedMes, setSelectedMes] = useState<string>(getMesAtual())
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Raw data
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [folha, setFolha] = useState<FolhaPagamento[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [impostos, setImpostos] = useState<Imposto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empresa, setEmpresa] = useState<Empresa | null>(null)

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        receitasRes,
        folhaRes,
        despesasRes,
        impostosRes,
        clientesRes,
        empresaRes,
      ] = await Promise.all([
        supabase.from('receitas').select('*').eq('mes_referencia', selectedMes),
        supabase
          .from('folha_pagamento')
          .select('*')
          .eq('mes_referencia', selectedMes)
          .order('funcionario', { ascending: true }),
        supabase.from('despesas').select('*').eq('mes_referencia', selectedMes),
        supabase.from('impostos').select('*').eq('mes_referencia', selectedMes),
        supabase.from('clientes').select('*').eq('ativo', true),
        supabase.from('empresa').select('*').limit(1).maybeSingle(),
      ])

      if (receitasRes.error) throw receitasRes.error
      if (folhaRes.error) throw folhaRes.error
      if (despesasRes.error) throw despesasRes.error
      if (impostosRes.error) throw impostosRes.error
      if (clientesRes.error) throw clientesRes.error
      if (empresaRes.error) throw empresaRes.error

      setReceitas((receitasRes.data ?? []) as Receita[])
      setFolha((folhaRes.data ?? []) as FolhaPagamento[])
      setDespesas((despesasRes.data ?? []) as Despesa[])
      setImpostos((impostosRes.data ?? []) as Imposto[])
      setClientes((clientesRes.data ?? []) as Cliente[])
      setEmpresa((empresaRes.data ?? null) as Empresa | null)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Erro ao carregar Visao Geral:', err)
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedMes])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  const recorrentes = receitas.filter(r => {
    const cli = clientes.find(c => c.id === r.cliente_id || c.nome === r.cliente_nome)
    return cli?.tipo === 'recorrente'
  })
  const variaveis = receitas.filter(r => {
    const cli = clientes.find(c => c.id === r.cliente_id || c.nome === r.cliente_nome)
    return cli?.tipo === 'variavel'
  })
  const receita_recorrente = recorrentes.reduce((s, r) => s + r.valor, 0)
  const receita_variavel = variaveis.reduce((s, r) => s + r.valor, 0)
  const receita_total = receita_recorrente + receita_variavel

  const folha_total = folha.reduce((s, f) => s + f.salario, 0)

  const despesas_cartoes = despesas
    .filter(
      d =>
        d.forma_pagamento?.toLowerCase().includes('cart') ||
        d.categoria_tipo === 'cartao' ||
        d.categoria_nome?.toLowerCase().includes('cart'),
    )
    .reduce((s, d) => s + d.valor, 0)

  const despesas_escritorio = despesas
    .filter(
      d =>
        d.categoria_nome?.toLowerCase().includes('escrit') &&
        !d.forma_pagamento?.toLowerCase().includes('cart') &&
        d.categoria_tipo !== 'cartao',
    )
    .reduce((s, d) => s + d.valor, 0)

  const despesas_parcelas = despesas
    .filter(
      d =>
        (d.categoria_nome?.toLowerCase().includes('parcela') ||
          d.categoria_nome?.toLowerCase().includes('financiament') ||
          d.categoria_tipo === 'financeiro') &&
        !d.forma_pagamento?.toLowerCase().includes('cart') &&
        d.categoria_tipo !== 'cartao',
    )
    .reduce((s, d) => s + d.valor, 0)

  const impostos_total = impostos.reduce((s, i) => s + i.valor, 0)

  const despesa_total =
    folha_total + despesas_cartoes + despesas_escritorio + despesas_parcelas + impostos_total
  const despesas_col2_total = despesas_cartoes + despesas_escritorio + despesas_parcelas + impostos_total

  const caixa_reserva = empresa?.caixa_reserva ?? 4000
  const resultado_operacional = receita_total - despesa_total
  const divisao_lucro = receita_total - despesa_total - caixa_reserva
  const divisao_por_socio = Math.max(0, divisao_lucro) / 3

  // ---------------------------------------------------------------------------
  // Folha sort: CLT/PJ first, Pró-labore last
  // ---------------------------------------------------------------------------

  const folha_sorted = [...folha].sort((a, b) => {
    const aProlabore = a.tipo?.toLowerCase().includes('pro') || a.tipo?.toLowerCase().includes('pró')
    const bProlabore = b.tipo?.toLowerCase().includes('pro') || b.tipo?.toLowerCase().includes('pró')
    if (aProlabore && !bProlabore) return 1
    if (!aProlabore && bProlabore) return -1
    return a.funcionario.localeCompare(b.funcionario)
  })

  // ---------------------------------------------------------------------------
  // Despesa item groups
  // ---------------------------------------------------------------------------

  const cartoes_items = despesas.filter(
    d =>
      d.forma_pagamento?.toLowerCase().includes('cart') ||
      d.categoria_tipo === 'cartao' ||
      d.categoria_nome?.toLowerCase().includes('cart'),
  )

  const escritorio_items = despesas.filter(
    d =>
      d.categoria_nome?.toLowerCase().includes('escrit') &&
      !d.forma_pagamento?.toLowerCase().includes('cart') &&
      d.categoria_tipo !== 'cartao',
  )

  const parcelas_items = despesas.filter(
    d =>
      (d.categoria_nome?.toLowerCase().includes('parcela') ||
        d.categoria_nome?.toLowerCase().includes('financiament') ||
        d.categoria_tipo === 'financeiro') &&
      !d.forma_pagamento?.toLowerCase().includes('cart') &&
      d.categoria_tipo !== 'cartao',
  )

  // ---------------------------------------------------------------------------
  // PDF Export
  // ---------------------------------------------------------------------------

  function exportPDF() {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const now = new Date()
      const dateStr = now.toLocaleDateString('pt-BR')
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      // Header
      doc.setFillColor(26, 39, 66) // #1a2742
      doc.rect(0, 0, pageWidth, 28, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      doc.text('UPSEND BRASIL', pageWidth / 2, 12, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(`Visao Geral  |  ${selectedMes}  |  Gerado em ${dateStr} as ${timeStr}`, pageWidth / 2, 20, { align: 'center' })

      let y = 38

      // KPI block
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text('RESUMO FINANCEIRO', 20, y)
      y += 6

      const kpiData = [
        ['Receita Total', formatCurrency(receita_total), 'Recorrente: ' + formatCurrency(receita_recorrente) + '  |  Variavel: ' + formatCurrency(receita_variavel)],
        ['Despesa Total', formatCurrency(despesa_total), 'Folha: ' + formatCurrency(folha_total) + '  |  Impostos: ' + formatCurrency(impostos_total)],
        ['Resultado Operacional', formatCurrency(resultado_operacional), 'Margem: ' + (receita_total > 0 ? ((resultado_operacional / receita_total) * 100).toFixed(1) : '0') + '%'],
        ['Divisao de Lucro', formatCurrency(divisao_lucro), divisao_lucro >= 0 ? formatCurrency(divisao_por_socio) + ' por socio (div 3)' : 'Prejuizo - sem distribuicao'],
      ]

      kpiData.forEach(([label, value, sub], i) => {
        const x = 20
        const w = (pageWidth - 40)
        const boxY = y + i * 18
        doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255)
        doc.rect(x, boxY, w, 16, 'F')
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.2)
        doc.rect(x, boxY, w, 16, 'S')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(56, 73, 94)
        doc.text(label, x + 3, boxY + 6)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text(value, x + w - 3, boxY + 6, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(100, 116, 139)
        doc.text(sub, x + 3, boxY + 12)
      })

      y += kpiData.length * 18 + 8

      // Folha table
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text('FOLHA DE PAGAMENTO', 20, y)
      y += 5

      doc.setFillColor(26, 39, 66)
      doc.rect(20, y, pageWidth - 40, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('Funcionario', 23, y + 5.5)
      doc.text('Salario', pageWidth - 22, y + 5.5, { align: 'right' })
      y += 8

      if (folha_sorted.length === 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text('Nenhum registro de folha', 23, y + 5)
        y += 10
      } else {
        folha_sorted.forEach((f, i) => {
          const rowY = y + i * 7
          doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252)
          doc.rect(20, rowY, pageWidth - 40, 7, 'F')
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(56, 73, 94)
          doc.text(f.funcionario + (f.tipo ? ' (' + f.tipo + ')' : ''), 23, rowY + 5)
          doc.text(formatCurrency(f.salario), pageWidth - 22, rowY + 5, { align: 'right' })
        })
        y += folha_sorted.length * 7
      }

      // Folha footer
      doc.setFillColor(240, 253, 244)
      doc.rect(20, y, pageWidth - 40, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(56, 73, 94)
      doc.text('TOTAL FOLHA', 23, y + 5.5)
      doc.setTextColor(34, 197, 94)
      doc.text(formatCurrency(folha_total), pageWidth - 22, y + 5.5, { align: 'right' })
      y += 14

      // Despesas + Impostos
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text('DESPESAS E IMPOSTOS', 20, y)
      y += 5

      doc.setFillColor(26, 39, 66)
      doc.rect(20, y, pageWidth - 40, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('Categoria', 23, y + 5.5)
      doc.text('Valor', pageWidth - 22, y + 5.5, { align: 'right' })
      y += 8

      const despesaRows = [
        ['Cartoes Upsend', formatCurrency(despesas_cartoes)],
        ['Escritorio', formatCurrency(despesas_escritorio)],
        ['Parcelas', formatCurrency(despesas_parcelas)],
        ['Impostos', formatCurrency(impostos_total)],
      ]
      despesaRows.forEach(([label, value], i) => {
        const rowY = y + i * 7
        doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252)
        doc.rect(20, rowY, pageWidth - 40, 7, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(56, 73, 94)
        doc.text(label, 23, rowY + 5)
        doc.setTextColor(239, 68, 68)
        doc.text(value, pageWidth - 22, rowY + 5, { align: 'right' })
      })
      y += despesaRows.length * 7

      doc.setFillColor(255, 245, 245)
      doc.rect(20, y, pageWidth - 40, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(56, 73, 94)
      doc.text('TOTAL DESPESAS', 23, y + 5.5)
      doc.setTextColor(239, 68, 68)
      doc.text(formatCurrency(despesas_col2_total), pageWidth - 22, y + 5.5, { align: 'right' })
      y += 14

      // Result block
      doc.setFillColor(26, 39, 66)
      doc.roundedRect(20, y, pageWidth - 40, 46, 3, 3, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      const resultRows: [string, string, boolean][] = [
        ['Receita Total', formatCurrency(receita_total), false],
        ['(-) Despesa Total', formatCurrency(despesa_total), false],
        ['(-) Caixa Upsend', formatCurrency(caixa_reserva), false],
      ]
      resultRows.forEach(([label, value], i) => {
        const rowY = y + 8 + i * 9
        doc.setTextColor(i === 2 ? 200 : 255, i === 2 ? 200 : 255, i === 2 ? 200 : 255)
        doc.text(label, 24, rowY)
        doc.text(value, pageWidth - 22, rowY, { align: 'right' })
      })

      doc.setDrawColor(60, 80, 120)
      doc.setLineWidth(0.3)
      doc.line(24, y + 35, pageWidth - 22, y + 35)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      if (divisao_lucro >= 0) {
        doc.setTextColor(34, 197, 94)
      } else {
        doc.setTextColor(239, 68, 68)
      }
      doc.text('DIVISAO DE LUCRO', 24, y + 43)
      doc.text(formatCurrency(divisao_lucro), pageWidth - 22, y + 43, { align: 'right' })
      y += 56

      // Socios
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const socioList = [
        { nome: 'Italo Ribeiro', pct: '33,33%' },
        { nome: 'Gabriel Diniz', pct: '33,33%' },
        { nome: 'Antonio Alves', pct: '33,34%' },
      ]
      const socioW = (pageWidth - 40) / 3
      socioList.forEach((s, i) => {
        const sx = 20 + i * socioW
        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.2)
        doc.roundedRect(sx, y, socioW - 2, 18, 2, 2, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(56, 73, 94)
        doc.text(s.nome, sx + socioW / 2 - 1, y + 6, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(100, 116, 139)
        doc.text(s.pct, sx + socioW / 2 - 1, y + 11, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        if (divisao_lucro >= 0) {
          doc.setTextColor(34, 197, 94)
        } else {
          doc.setTextColor(148, 163, 184)
        }
        doc.text(formatCurrency(divisao_por_socio), sx + socioW / 2 - 1, y + 16, { align: 'center' })
      })
      y += 22

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 14
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(20, footerY - 4, pageWidth - 20, footerY - 4)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text('Painel CFO Upsend Brasil', pageWidth / 2, footerY, { align: 'center' })

      const safeMes = selectedMes.replace('/', '_')
      doc.save(`VisaoGeral_${safeMes}.pdf`)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' })
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const margem =
    receita_total > 0
      ? ((resultado_operacional / receita_total) * 100).toFixed(1)
      : '0.0'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6" style={{ backgroundColor: '#F2F6FA', minHeight: '100vh' }}>

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1a2742]">Visao Geral</h1>
          <p className="text-sm text-[#626F7F]">Resumo Executivo &middot; {selectedMes}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedMes} onValueChange={setSelectedMes}>
            <SelectTrigger className="w-36">
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

          <span className="text-xs text-[#94a3b8]">
            {lastUpdated
              ? 'Atualizado: ' + lastUpdated.toLocaleString('pt-BR')
              : '--'}
          </span>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/50 bg-white/50 text-sm text-[#273544] hover:bg-white/70 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Section 1 — KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Card 1: Receita Total */}
            <div className="liquid-glass-md rounded-3xl p-5">
              <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide mb-2">Receita Total</p>
              <p className="font-mono text-3xl font-bold text-[#22c55e] mb-3">
                {formatCurrency(receita_total)}
              </p>
              <p className="text-xs text-[#626F7F]">
                <span className="font-medium text-[#273544]">{formatCurrency(receita_recorrente)}</span> recorrente
                {' / '}
                <span className="font-medium text-[#273544]">{formatCurrency(receita_variavel)}</span> variavel
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">
                Reserva operacional: <span className="font-medium">{formatCurrency(caixa_reserva)}</span>
              </p>
            </div>

            {/* Card 2: Despesa Total */}
            <div className="liquid-glass-md rounded-3xl p-5">
              <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide mb-2">Despesa Total</p>
              <p className="font-mono text-3xl font-bold text-[#EF4343] mb-3">
                {formatCurrency(despesa_total)}
              </p>
              <p className="text-xs text-[#626F7F]">
                Folha{' '}
                <span className="font-medium text-[#273544]">{formatCurrency(folha_total)}</span>
                {' · '}
                Despesas{' '}
                <span className="font-medium text-[#273544]">
                  {formatCurrency(despesas_cartoes + despesas_escritorio + despesas_parcelas)}
                </span>
                {' · '}
                Impostos{' '}
                <span className="font-medium text-[#273544]">{formatCurrency(impostos_total)}</span>
              </p>
            </div>

            {/* Card 3: Resultado Operacional */}
            <div className="liquid-glass-md rounded-3xl p-5">
              <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide mb-2">Resultado Operacional</p>
              <p
                className={`font-mono text-3xl font-bold mb-1 ${
                  resultado_operacional >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'
                }`}
              >
                {formatCurrency(resultado_operacional)}
              </p>
              <p className="text-xs text-[#94a3b8] mb-1">Antes da reserva de caixa</p>
              <p className="text-xs text-[#626F7F]">
                Margem:{' '}
                <span
                  className={`font-semibold ${
                    resultado_operacional >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'
                  }`}
                >
                  {margem}%
                </span>
              </p>
            </div>

            {/* Card 4: Divisao de Lucro */}
            <div className="liquid-glass-md rounded-3xl p-5">
              <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide mb-2">Divisao de Lucro</p>
              <p
                className={`font-mono text-3xl font-bold mb-2 ${
                  divisao_lucro >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'
                }`}
              >
                {formatCurrency(divisao_lucro)}
              </p>
              {divisao_lucro >= 0 ? (
                <p className="text-xs text-[#626F7F]">
                  <span className="font-medium text-[#273544]">{formatCurrency(divisao_por_socio)}</span> por socio (div 3)
                </p>
              ) : (
                <p className="text-xs font-medium text-[#EF4343]">Prejuizo sem distribuicao este mes</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Section 2 — Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Column 1: Folha */}
        {loading ? (
          <SkeletonColumn />
        ) : (
          <div className="liquid-glass-md rounded-3xl overflow-hidden">
            <ColumnHeader left="FOLHA UPSEND BRASIL" right="Valor a Pagar" />

            {folha_sorted.length === 0 ? (
              <EmptyState message="Nenhum registro de folha para este mes." />
            ) : (
              folha_sorted.map((f, i) => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.45)] hover:bg-[#f0f7ff] transition-colors ${
                    i % 2 === 0 ? 'bg-white/30' : 'bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm text-[#273544]">
                    <StatusDot status={f.status} />
                    <span>
                      {f.funcionario}
                      {f.cargo && (
                        <span className="text-xs text-[#94a3b8] ml-1">({f.cargo})</span>
                      )}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-[#273544]">{formatCurrency(f.salario)}</span>
                </div>
              ))
            )}

            <ColumnFooter label="VALOR TOTAL" value={folha_total} variant="green" />
          </div>
        )}

        {/* Column 2: Despesas */}
        {loading ? (
          <SkeletonColumn />
        ) : (
          <div className="liquid-glass-md rounded-3xl overflow-hidden">
            <ColumnHeader left="DESPESAS UPSEND BRASIL" right="Valor a Pagar" />

            {/* Cartoes */}
            <ExpandableRow
              icon="💳"
              label="Cartoes Upsend"
              value={despesas_cartoes}
              rowBg="bg-white/30 border-b border-white/30"
              items={
                cartoes_items.length === 0 ? (
                  <div className="px-8 py-2 text-xs text-[#94a3b8] border-b border-[rgba(255,255,255,0.45)] bg-[#fafafa]">
                    Nenhuma despesa no cartao
                  </div>
                ) : (
                  <div className="bg-[#fafafa] border-b border-[rgba(255,255,255,0.45)]">
                    {cartoes_items.map(d => (
                      <div key={d.id} className="flex justify-between items-center px-8 py-2 border-b border-[#f1f5f9] last:border-0">
                        <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
                          <StatusDot status={d.status} />
                          {d.descricao}
                          {d.forma_pagamento && (
                            <span className="text-[#94a3b8]">({d.forma_pagamento})</span>
                          )}
                        </span>
                        <span className="font-mono text-xs text-[#EF4343]">{formatCurrency(d.valor)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            />

            {/* Escritorio */}
            <ExpandableRow
              icon="🏢"
              label="Escritorio"
              value={despesas_escritorio}
              rowBg="bg-white/10 border-b border-white/30"
              items={
                escritorio_items.length === 0 ? (
                  <div className="px-8 py-2 text-xs text-[#94a3b8] border-b border-[rgba(255,255,255,0.45)] bg-[#fafafa]">
                    Nenhuma despesa de escritorio
                  </div>
                ) : (
                  <div className="bg-[#fafafa] border-b border-[rgba(255,255,255,0.45)]">
                    {escritorio_items.map(d => (
                      <div key={d.id} className="flex justify-between items-center px-8 py-2 border-b border-[#f1f5f9] last:border-0">
                        <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
                          <StatusDot status={d.status} />
                          {d.descricao}
                        </span>
                        <span className="font-mono text-xs text-[#EF4343]">{formatCurrency(d.valor)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            />

            {/* Parcelas */}
            <ExpandableRow
              icon="📋"
              label="Parcelas"
              value={despesas_parcelas}
              rowBg="bg-white/30 border-b border-white/30"
              items={
                parcelas_items.length === 0 ? (
                  <div className="px-8 py-2 text-xs text-[#94a3b8] border-b border-[rgba(255,255,255,0.45)] bg-[#fafafa]">
                    Nenhuma parcela ou financiamento
                  </div>
                ) : (
                  <div className="bg-[#fafafa] border-b border-[rgba(255,255,255,0.45)]">
                    {parcelas_items.map(d => (
                      <div key={d.id} className="flex justify-between items-center px-8 py-2 border-b border-[#f1f5f9] last:border-0">
                        <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
                          <StatusDot status={d.status} />
                          {d.descricao}
                        </span>
                        <span className="font-mono text-xs text-[#EF4343]">{formatCurrency(d.valor)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            />

            {/* Impostos */}
            <ExpandableRow
              icon="🧾"
              label="Impostos"
              value={impostos_total}
              rowBg="bg-white/10 border-b border-white/30"
              items={
                impostos.length === 0 ? (
                  <div className="px-8 py-2 text-xs text-[#94a3b8] border-b border-[rgba(255,255,255,0.45)] bg-[#fafafa]">
                    Nenhum imposto registrado
                  </div>
                ) : (
                  <div className="bg-[#fafafa] border-b border-[rgba(255,255,255,0.45)]">
                    {impostos.map(imp => (
                      <div key={imp.id} className="flex justify-between items-center px-8 py-2 border-b border-[#f1f5f9] last:border-0">
                        <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
                          <StatusDot status={imp.status} />
                          <strong>{imp.tipo}</strong>
                          {imp.descricao && <span className="text-[#94a3b8]">({imp.descricao})</span>}
                        </span>
                        <span className="font-mono text-xs text-[#EF4343]">{formatCurrency(imp.valor)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            />

            <ColumnFooter label="VALOR TOTAL" value={despesas_col2_total} variant="red" />
          </div>
        )}

        {/* Column 3: Receita */}
        {loading ? (
          <SkeletonColumn />
        ) : (
          <div className="liquid-glass-md rounded-3xl overflow-hidden">
            <ColumnHeader left="RECEITA UPSEND BRASIL" right="Valor a Receber" />

            {/* Recorrentes */}
            <ExpandableReceitaRow
              icon="🟢"
              label="Clientes Recorrentes"
              value={receita_recorrente}
              rowBg="bg-white/30 border-b border-white/30"
              items={
                recorrentes.length === 0 ? (
                  <div className="px-8 py-2 text-xs text-[#94a3b8] border-b border-[rgba(255,255,255,0.45)] bg-[#fafafa]">
                    Nenhum cliente recorrente este mes
                  </div>
                ) : (
                  <div className="bg-[#fafafa] border-b border-[rgba(255,255,255,0.45)]">
                    {recorrentes.map(r => (
                      <div key={r.id} className="flex justify-between items-center px-8 py-2 border-b border-[#f1f5f9] last:border-0">
                        <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
                          <StatusDot status={r.status} />
                          {r.cliente_nome ?? 'Cliente'}
                        </span>
                        <span className="font-mono text-xs text-[#22c55e]">{formatCurrency(r.valor)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            />

            {/* Variaveis */}
            <ExpandableReceitaRow
              icon="🔵"
              label="Clientes Variaveis"
              value={receita_variavel}
              rowBg="bg-white/10 border-b border-white/30"
              items={
                variaveis.length === 0 ? (
                  <div className="px-8 py-2 text-xs text-[#94a3b8] border-b border-[rgba(255,255,255,0.45)] bg-[#fafafa]">
                    Nenhum cliente variavel este mes
                  </div>
                ) : (
                  <div className="bg-[#fafafa] border-b border-[rgba(255,255,255,0.45)]">
                    {variaveis.map(r => (
                      <div key={r.id} className="flex justify-between items-center px-8 py-2 border-b border-[#f1f5f9] last:border-0">
                        <span className="flex items-center gap-1.5 text-xs text-[#626F7F]">
                          <StatusDot status={r.status} />
                          {r.cliente_nome ?? 'Cliente'}
                        </span>
                        <span className="font-mono text-xs text-[#22c55e]">{formatCurrency(r.valor)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            />

            <ColumnFooter label="VALOR TOTAL" value={receita_total} variant="green" />
          </div>
        )}
      </div>

      {/* Section 3 — Result box */}
      {!loading && (
        <div className="max-w-xl mx-auto space-y-4">
          {/* Dark navy result block */}
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{ backgroundColor: '#1a2742' }}
          >
            {/* Rows */}
            {[
              { label: 'Receita Total', value: receita_total, opacity: 'text-white' },
              { label: '(-) Despesa Total', value: despesa_total, opacity: 'text-white/80' },
              { label: '(-) Caixa Upsend', value: caixa_reserva, opacity: 'text-white/60' },
            ].map(({ label, value, opacity }) => (
              <div key={label} className="flex items-center justify-between">
                <span className={`text-sm ${opacity}`}>{label}</span>
                <span className={`font-mono text-sm font-medium ${opacity}`}>{formatCurrency(value)}</span>
              </div>
            ))}

            <hr className="border-white/20" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">DIVISAO DE LUCRO</span>
              <span
                className={`font-mono text-xl font-bold ${
                  divisao_lucro >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'
                }`}
              >
                {formatCurrency(divisao_lucro)}
              </span>
            </div>
          </div>

          {/* Socios cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { nome: 'Italo Ribeiro', pct: '33,33%' },
              { nome: 'Gabriel Diniz', pct: '33,33%' },
              { nome: 'Antonio Alves', pct: '33,34%' },
            ].map(s => (
              <div
                key={s.nome}
                className="liquid-glass-md rounded-3xl p-4 text-center"
              >
                <p className="text-xs font-semibold text-[#273544] mb-0.5">{s.nome}</p>
                <p className="text-xs text-[#94a3b8] mb-2">{s.pct}</p>
                <p
                  className={`font-mono text-sm font-bold ${
                    divisao_lucro >= 0 ? 'text-[#22c55e]' : 'text-[#94a3b8]'
                  }`}
                >
                  {divisao_lucro >= 0 ? formatCurrency(divisao_por_socio) : 'R$ 0,00'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4 — Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[rgba(255,255,255,0.45)]">
        <span className="text-xs text-[#94a3b8]">
          {lastUpdated
            ? 'Ultima atualizacao: ' + lastUpdated.toLocaleString('pt-BR')
            : '--'}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/50 bg-white/50 text-sm text-[#273544] hover:bg-white/70 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={exportPDF}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/50 bg-white/50 text-sm text-[#273544] hover:bg-white/70 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar PDF
          </button>

          <button
            onClick={() => navigate('/dre')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0873F7] text-white text-sm hover:bg-[#0e6cd6] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Editar no DRE
          </button>
        </div>
      </div>
    </div>
  )
}
