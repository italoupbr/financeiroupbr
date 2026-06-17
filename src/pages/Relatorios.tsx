import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual, getMesesAnteriores } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Download, FileText, FileSpreadsheet, TrendingUp } from 'lucide-react'
import type { DreMensal, Cliente, FluxoCaixa } from '@/types'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

function exportExcel(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')
  XLSX.writeFile(wb, filename)
}

export default function Relatorios() {
  const [dreHistory, setDreHistory] = useState<DreMensal[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixa[]>([])
  const [selectedMesPDF, setSelectedMesPDF] = useState(getMesAtual())
  const [loading, setLoading] = useState(true)

  const meses = getMesesAnteriores(12)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [{ data: dreData, error: e1 }, { data: clientesData, error: e2 }, { data: fcData, error: e3 }] = await Promise.all([
          supabase
            .from('dre_mensal')
            .select('*')
            .in('mes_referencia', getMesesAnteriores(12))
            .order('mes_referencia'),
          supabase.from('clientes').select('*').order('nome'),
          supabase.from('fluxo_caixa').select('*').order('data_prevista'),
        ])
        if (e1) throw e1
        if (e2) throw e2
        if (e3) throw e3
        setDreHistory(dreData ?? [])
        setClientes(clientesData ?? [])
        setFluxoCaixa(fcData ?? [])
      } catch (err: any) {
        console.error('[Relatorios] fetchAll:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Chart data
  const dreChartData = getMesesAnteriores(12).map(mes => {
    const dre = dreHistory.find(d => d.mes_referencia === mes)
    return {
      mes,
      receita_total: dre?.receita_total ?? 0,
      lucro_liquido: dre?.lucro_liquido ?? 0,
    }
  })

  const mrrChartData = getMesesAnteriores(12).map(mes => {
    const dre = dreHistory.find(d => d.mes_referencia === mes)
    return {
      mes,
      receita_recorrente: dre?.receita_recorrente ?? 0,
    }
  })

  // PDF Export: DRE
  function exportDREPDF() {
    const dre = dreHistory.find(d => d.mes_referencia === selectedMesPDF)
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(18, 123, 240)
    doc.text('Upsend Brasil', 20, 22)

    doc.setFontSize(12)
    doc.setTextColor(56, 73, 94)
    doc.text(`DRE — ${selectedMesPDF}`, 20, 32)

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40)

    if (!dre) {
      doc.setFontSize(11)
      doc.setTextColor(239, 68, 68)
      doc.text('Nenhum dado disponível para o mês selecionado.', 20, 60)
      doc.save(`DRE_${selectedMesPDF.replace('/', '_')}.pdf`)
      return
    }

    const rows: { label: string; value: number; bold?: boolean; separator?: boolean }[] = [
      { label: 'RECEITAS', value: 0, bold: true, separator: true },
      { label: 'Receita Recorrente', value: dre.receita_recorrente },
      { label: 'Receita Variável', value: dre.receita_variavel },
      { label: 'RECEITA TOTAL', value: dre.receita_total, bold: true },
      { label: '', value: 0, separator: true },
      { label: 'DESPESAS', value: 0, bold: true, separator: true },
      { label: 'Folha de Pagamento', value: dre.folha_total },
      { label: 'Software e Ferramentas', value: dre.despesas_software },
      { label: 'Escritório e Outros', value: dre.despesas_escritorio },
      { label: 'Parcelas / Financiamentos', value: dre.despesas_parcelas },
      { label: 'DAS (Simples Nacional)', value: dre.impostos_das },
      { label: 'Outros Impostos', value: dre.impostos_outros },
      { label: 'DESPESA TOTAL', value: dre.despesa_total, bold: true },
      { label: '', value: 0, separator: true },
      { label: 'EBITDA', value: dre.ebitda, bold: true },
      { label: 'Reserva de Caixa', value: dre.caixa_reserva },
      { label: 'LUCRO LÍQUIDO', value: dre.lucro_liquido, bold: true },
      { label: 'LUCRO DISTRIBUÍVEL', value: dre.lucro_distribuivel, bold: true },
    ]

    let y = 54
    for (const row of rows) {
      if (row.separator) {
        doc.setDrawColor(226, 232, 240)
        doc.line(20, y, 190, y)
        y += 4
        if (!row.label) continue
      }

      if (row.bold) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(56, 73, 94)
      } else {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
      }

      if (row.label) {
        doc.text(row.label, 20, y)
        if (row.value !== 0 || row.bold) {
          const valStr = formatCurrency(row.value)
          const valWidth = doc.getTextWidth(valStr)
          const color = row.value < 0 ? [239, 68, 68] : [56, 73, 94]
          doc.setTextColor(color[0], color[1], color[2])
          doc.text(valStr, 190 - valWidth, y)
        }
        y += 7
      }

      if (y > 270) {
        doc.addPage()
        y = 20
      }
    }

    doc.save(`DRE_${selectedMesPDF.replace('/', '_')}.pdf`)
  }

  // Excel: DRE comparativo
  function exportDREExcel() {
    const data = dreHistory.map(d => ({
      'Mês': d.mes_referencia,
      'Receita Recorrente': d.receita_recorrente,
      'Receita Variável': d.receita_variavel,
      'Receita Total': d.receita_total,
      'Folha Total': d.folha_total,
      'Despesas Software': d.despesas_software,
      'Despesas Escritório': d.despesas_escritorio,
      'Despesas Parcelas': d.despesas_parcelas,
      'Impostos DAS': d.impostos_das,
      'Impostos Outros': d.impostos_outros,
      'Despesa Total': d.despesa_total,
      'EBITDA': d.ebitda,
      'Lucro Líquido': d.lucro_liquido,
      'Lucro Distribuível': d.lucro_distribuivel,
    }))
    exportExcel(data as Record<string, unknown>[], 'DRE_Comparativo_12_Meses.xlsx')
  }

  // Excel: Fluxo de Caixa
  function exportFluxoExcel() {
    const data = fluxoCaixa.map(f => ({
      'Tipo': f.tipo,
      'Descrição': f.descricao,
      'Valor': f.valor,
      'Data Prevista': f.data_prevista ?? '',
      'Data Realizada': f.data_realizada ?? '',
      'Status': f.status,
      'Origem': f.origem ?? '',
      'Mês Referência': f.mes_referencia ?? '',
    }))
    exportExcel(data as Record<string, unknown>[], 'Fluxo_Caixa.xlsx')
  }

  // Excel: Clientes
  function exportClientesExcel() {
    const data = clientes.map(c => ({
      'Nome': c.nome,
      'Tipo': c.tipo,
      'Mensalidade': c.valor_mensalidade ?? 0,
      'Dia Pagamento': c.dia_pagamento ?? '',
      'Início Contrato': c.data_inicio ?? '',
      'Contrato Vigente': c.contrato_vigente ? 'Sim' : 'Não',
      'Vencimento Contrato': c.vencimento_contrato ?? '',
      'Ativo': c.ativo ? 'Sim' : 'Não',
      'Observação': c.observacao ?? '',
    }))
    exportExcel(data as Record<string, unknown>[], 'Clientes.xlsx')
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#273544]">Relatórios e Exportações</h1>
        <p className="text-sm text-[#626F7F]">Exporte dados e visualize tendências</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="liquid-glass-md rounded-3xl p-5 h-48 animate-pulse bg-[#f1f5f9]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* 1. DRE PDF */}
          <div className="liquid-glass-md rounded-3xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-[#0873F7]" />
              <h3 className="font-semibold text-[#273544]">DRE Completo — PDF</h3>
            </div>
            <p className="text-xs text-[#626F7F] mb-4">
              Demonstrativo de resultado mensal formatado para apresentação.
            </p>
            <div className="mb-4">
              <label className="text-xs text-[#626F7F] mb-1 block">Mês</label>
              <Select value={selectedMesPDF} onValueChange={setSelectedMesPDF}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-auto">
              <Button onClick={exportDREPDF} className="w-full gap-2">
                <Download className="h-4 w-4" /> Exportar PDF
              </Button>
            </div>
          </div>

          {/* 2. Comparativo 12 Meses */}
          <div className="liquid-glass-md rounded-3xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-[#0873F7]" />
              <h3 className="font-semibold text-[#273544]">Comparativo 12 Meses</h3>
            </div>
            <p className="text-xs text-[#626F7F] mb-3">Receita total e lucro líquido.</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dreChartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#626F7F' }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: '#626F7F' }} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="receita_total" stroke="#0873F7" strokeWidth={2} dot={false} name="Receita" />
                <Line type="monotone" dataKey="lucro_liquido" stroke="#22c55e" strokeWidth={2} dot={false} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3">
              <Button onClick={exportDREExcel} variant="outline" className="w-full gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
              </Button>
            </div>
          </div>

          {/* 3. Fluxo de Caixa Excel */}
          <div className="liquid-glass-md rounded-3xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-5 w-5 text-[#22c55e]" />
              <h3 className="font-semibold text-[#273544]">Fluxo de Caixa — Excel</h3>
            </div>
            <p className="text-xs text-[#626F7F] mb-4">
              Exporta todos os registros de entradas e saídas com datas e status.
            </p>
            <div className="bg-white/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-[#626F7F]">
                <span className="font-mono font-bold text-[#273544]">{fluxoCaixa.length}</span> registros
              </p>
              <p className="text-xs text-[#626F7F] mt-0.5">
                {fluxoCaixa.filter(f => f.tipo === 'entrada').length} entradas ·{' '}
                {fluxoCaixa.filter(f => f.tipo === 'saida').length} saídas
              </p>
            </div>
            <div className="mt-auto">
              <Button onClick={exportFluxoExcel} variant="outline" className="w-full gap-2 border-[#22c55e] text-[#22c55e] hover:bg-green-50">
                <Download className="h-4 w-4" /> Exportar Excel
              </Button>
            </div>
          </div>

          {/* 4. Clientes Excel */}
          <div className="liquid-glass-md rounded-3xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-5 w-5 text-[#f59e0b]" />
              <h3 className="font-semibold text-[#273544]">Lista de Clientes — Excel</h3>
            </div>
            <p className="text-xs text-[#626F7F] mb-4">
              Exporta a base de clientes com contratos, valores e status.
            </p>
            <div className="bg-white/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-[#626F7F]">
                <span className="font-mono font-bold text-[#273544]">{clientes.length}</span> clientes
              </p>
              <p className="text-xs text-[#626F7F] mt-0.5">
                {clientes.filter(c => c.ativo).length} ativos ·{' '}
                {clientes.filter(c => !c.ativo).length} inativos
              </p>
            </div>
            <div className="mt-auto">
              <Button onClick={exportClientesExcel} variant="outline" className="w-full gap-2 border-[#f59e0b] text-[#f59e0b] hover:bg-amber-50">
                <Download className="h-4 w-4" /> Exportar Excel
              </Button>
            </div>
          </div>

          {/* 5. Inadimplência */}
          <div className="liquid-glass-md rounded-3xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-[#EF4343]" />
              <h3 className="font-semibold text-[#273544]">Inadimplência</h3>
            </div>
            <p className="text-xs text-[#626F7F] mb-3">
              Clientes com pagamentos pendentes ou atrasados.
            </p>
            <div className="flex-1 overflow-auto">
              <InadimplenciaTable />
            </div>
          </div>

          {/* 6. Evolução MRR */}
          <div className="liquid-glass-md rounded-3xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-[#0873F7]" />
              <h3 className="font-semibold text-[#273544]">Evolução MRR</h3>
            </div>
            <p className="text-xs text-[#626F7F] mb-3">Receita recorrente mensal nos últimos 12 meses.</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={mrrChartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0873F7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0873F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#626F7F' }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: '#626F7F' }} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="receita_recorrente"
                  stroke="#0873F7"
                  strokeWidth={2}
                  fill="url(#mrrGradient)"
                  name="MRR"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  )
}

function InadimplenciaTable() {
  const [inadimplentes, setInadimplentes] = useState<{
    id: string
    cliente_nome: string | null
    mes_referencia: string
    valor: number
    status: string
  }[]>([])

  useEffect(() => {
    supabase
      .from('receitas')
      .select('id, cliente_nome, mes_referencia, valor, status')
      .in('status', ['pendente', 'atrasado'])
      .order('mes_referencia', { ascending: false })
      .limit(10)
      .then(({ data }) => setInadimplentes(data ?? []))
  }, [])

  if (inadimplentes.length === 0) {
    return (
      <p className="text-sm text-[#626F7F] italic py-4">Nenhuma inadimplência encontrada.</p>
    )
  }

  return (
    <div className="space-y-1.5">
      {inadimplentes.map(r => (
        <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[#f1f5f9] last:border-0">
          <div>
            <p className="font-medium text-[#273544] text-xs leading-tight">{r.cliente_nome ?? 'S/ nome'}</p>
            <p className="text-[#94a3b8] text-xs">{r.mes_referencia}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-bold text-[#EF4343]">{formatCurrency(r.valor)}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${r.status === 'atrasado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {r.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
