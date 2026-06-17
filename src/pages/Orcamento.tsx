import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual, getMesesAnteriores } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Download, Settings2, PlusCircle } from 'lucide-react'
import type { OrcamentoMensal, Despesa, FolhaPagamento, Imposto } from '@/types'
import * as XLSX from 'xlsx'

// ─── Category definitions ────────────────────────────────────────────────────

type CategoryKey = 'Folha' | 'Software' | 'Escritório' | 'Parcelas' | 'Impostos' | 'Outros'

const CATEGORIES: CategoryKey[] = ['Folha', 'Software', 'Escritório', 'Parcelas', 'Impostos', 'Outros']

// ─── Computed row ─────────────────────────────────────────────────────────────

interface BudgetRow {
  categoria: CategoryKey
  orcado: number
  realizado: number
  diferenca: number
  percentual: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProxMes(): string {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return `${meses[next.getMonth()]}/${next.getFullYear()}`
}

function computeRows(
  orcamentos: OrcamentoMensal[],
  despesas: Despesa[],
  folha: FolhaPagamento[],
  impostos: Imposto[]
): BudgetRow[] {
  const orcadoMap: Record<string, number> = {}
  orcamentos.forEach((o) => {
    orcadoMap[o.categoria] = o.valor_orcado
  })

  const realizado_folha = folha.reduce((s, f) => s + f.salario, 0)
  const realizado_software = despesas
    .filter((d) => d.categoria_nome?.toLowerCase().includes('software'))
    .reduce((s, d) => s + d.valor, 0)
  const realizado_escritorio = despesas
    .filter((d) => d.categoria_nome?.toLowerCase().includes('escrit'))
    .reduce((s, d) => s + d.valor, 0)
  const realizado_parcelas = despesas
    .filter((d) => d.categoria_tipo === 'financeiro')
    .reduce((s, d) => s + d.valor, 0)
  const realizado_impostos = impostos.reduce((s, i) => s + i.valor, 0)

  const classifiedIds = new Set<string>()
  despesas.forEach((d) => {
    const nome = d.categoria_nome?.toLowerCase() ?? ''
    const tipo = d.categoria_tipo ?? ''
    if (nome.includes('software') || nome.includes('escrit') || tipo === 'financeiro') {
      classifiedIds.add(d.id)
    }
  })
  const realizado_outros = despesas
    .filter((d) => !classifiedIds.has(d.id))
    .reduce((s, d) => s + d.valor, 0)

  const realizadoMap: Record<CategoryKey, number> = {
    Folha: realizado_folha,
    Software: realizado_software,
    Escritório: realizado_escritorio,
    Parcelas: realizado_parcelas,
    Impostos: realizado_impostos,
    Outros: realizado_outros,
  }

  return CATEGORIES.map((cat) => {
    const orcado = orcadoMap[cat] ?? 0
    const realizado = realizadoMap[cat]
    const diferenca = realizado - orcado
    const percentual = orcado > 0 ? (realizado / orcado) * 100 : null
    return { categoria: cat, orcado, realizado, diferenca, percentual }
  })
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center gap-3 justify-between">
        <div className="h-8 w-40 bg-[rgba(255,255,255,0.45)] rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-[rgba(255,255,255,0.45)] rounded" />
          <div className="h-8 w-36 bg-[rgba(255,255,255,0.45)] rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="liquid-glass-md rounded-3xl p-5 space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-9 bg-white/30 rounded" />
          ))}
        </div>
        <div className="liquid-glass-md rounded-3xl p-5 space-y-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-32 bg-white/30 rounded" />
              <div className="h-3 bg-[rgba(255,255,255,0.45)] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Orcamento() {
  const meses = getMesesAnteriores(6)

  const [selectedMes, setSelectedMes] = useState<string>(getMesAtual())
  const [loading, setLoading] = useState(true)

  const [orcamentos, setOrcamentos] = useState<OrcamentoMensal[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [folha, setFolha] = useState<FolhaPagamento[]>([])
  const [impostos, setImpostos] = useState<Imposto[]>([])

  // "Definir Orçamento" dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMes, setDialogMes] = useState<string>(getProxMes())
  const [dialogValues, setDialogValues] = useState<Record<CategoryKey, string>>({
    Folha: '',
    Software: '',
    Escritório: '',
    Parcelas: '',
    Impostos: '',
    Outros: '',
  })
  const [saving, setSaving] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchData(mes: string) {
    setLoading(true)
    try {
      const [oRes, dRes, fRes, iRes] = await Promise.all([
        supabase.from('orcamento_mensal').select('*').eq('mes_referencia', mes),
        supabase.from('despesas').select('*').eq('mes_referencia', mes),
        supabase.from('folha_pagamento').select('*').eq('mes_referencia', mes),
        supabase.from('impostos').select('*').eq('mes_referencia', mes),
      ])
      if (oRes.error) throw oRes.error
      if (dRes.error) throw dRes.error
      if (fRes.error) throw fRes.error
      if (iRes.error) throw iRes.error
      setOrcamentos(oRes.data ?? [])
      setDespesas(dRes.data ?? [])
      setFolha(fRes.data ?? [])
      setImpostos(iRes.data ?? [])
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar orçamento',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedMes)
  }, [selectedMes])

  // ── Computed rows ──────────────────────────────────────────────────────────

  const rows = computeRows(orcamentos, despesas, folha, impostos)

  const totalOrcado = rows.reduce((s, r) => s + r.orcado, 0)
  const totalRealizado = rows.reduce((s, r) => s + r.realizado, 0)
  const totalDiferenca = totalRealizado - totalOrcado
  const totalPct = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : null

  const hasOrcamento = orcamentos.length > 0

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  function openDialog() {
    // Pre-fill with current month's orcado values
    const vals: Record<CategoryKey, string> = {
      Folha: '',
      Software: '',
      Escritório: '',
      Parcelas: '',
      Impostos: '',
      Outros: '',
    }
    orcamentos.forEach((o) => {
      if (CATEGORIES.includes(o.categoria as CategoryKey)) {
        vals[o.categoria as CategoryKey] = String(o.valor_orcado)
      }
    })
    setDialogValues(vals)
    setDialogMes(getProxMes())
    setDialogOpen(true)
  }

  async function handleSaveOrcamento() {
    setSaving(true)
    try {
      const upserts = CATEGORIES.map((cat) => ({
        mes_referencia: dialogMes,
        categoria: cat,
        valor_orcado: parseFloat(dialogValues[cat] || '0') || 0,
        valor_realizado: 0,
      }))

      const { error } = await supabase
        .from('orcamento_mensal')
        .upsert(upserts, { onConflict: 'mes_referencia,categoria' })

      if (error) throw error

      toast({ title: 'Orçamento salvo com sucesso' })
      setDialogOpen(false)

      // Reload if we saved for the selected month
      if (dialogMes === selectedMes) {
        fetchData(selectedMes)
      }
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar orçamento',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  function exportExcel() {
    const data: { Categoria: string; Orçado: number; Realizado: number; Diferença: number; 'Percentual (%)': string }[] = rows.map((r) => ({
      Categoria: r.categoria,
      Orçado: r.orcado,
      Realizado: r.realizado,
      Diferença: r.diferenca,
      'Percentual (%)': r.percentual !== null ? r.percentual.toFixed(1) : 'N/A',
    }))
    data.push({
      Categoria: 'TOTAL',
      Orçado: totalOrcado,
      Realizado: totalRealizado,
      Diferença: totalDiferenca,
      'Percentual (%)': totalPct !== null ? totalPct.toFixed(1) : 'N/A',
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orçamento')
    XLSX.writeFile(wb, `Orcamento_${selectedMes.replace('/', '_')}.xlsx`)
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function difColor(dif: number, orcado: number): string {
    if (orcado === 0) return '#626F7F'
    return dif > 0 ? '#EF4343' : '#22c55e'
  }

  if (loading) return <Skeleton />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#273544]">Orçamento</h2>
          <Select value={selectedMes} onValueChange={setSelectedMes}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar Excel
          </Button>
          <Button size="sm" onClick={openDialog}>
            <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Definir Orçamento
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!hasOrcamento && (
        <div className="liquid-glass-md rounded-3xl p-12 flex flex-col items-center gap-4">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#F2F6FA' }}
          >
            <PlusCircle className="h-7 w-7" style={{ color: '#0873F7' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#273544]">Nenhum orçamento definido para {selectedMes}</p>
            <p className="text-sm text-[#626F7F] mt-1">
              Defina os valores orçados por categoria para acompanhar o realizado.
            </p>
          </div>
          <Button onClick={openDialog}>
            <Settings2 className="h-4 w-4 mr-1.5" /> Definir Orçamento
          </Button>
        </div>
      )}

      {/* Main grid: table + bars */}
      {hasOrcamento && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Budget table */}
          <div className="liquid-glass-md rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.45)]">
              <p className="text-sm font-semibold text-[#273544]">Comparativo Orçado vs Realizado</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#F2F6FA' }}>
                  <TableHead className="font-semibold text-[#273544]">Categoria</TableHead>
                  <TableHead className="text-right font-semibold text-[#273544]">Orçado</TableHead>
                  <TableHead className="text-right font-semibold text-[#273544]">Realizado</TableHead>
                  <TableHead className="text-right font-semibold text-[#273544]">Diferença</TableHead>
                  <TableHead className="text-right font-semibold text-[#273544]">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.categoria}>
                    <TableCell className="font-medium text-[#273544]">{row.categoria}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-[#626F7F]">
                      {row.orcado > 0 ? formatCurrency(row.orcado) : <span className="text-[#94a3b8]">--</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[#273544]">
                      {formatCurrency(row.realizado)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      <span style={{ color: difColor(row.diferenca, row.orcado) }}>
                        {row.orcado === 0
                          ? <span className="text-[#94a3b8] font-normal">--</span>
                          : (row.diferenca >= 0 ? '+' : '') + formatCurrency(row.diferenca)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {row.percentual !== null ? (
                        <span
                          style={{
                            color: row.percentual > 100 ? '#EF4343' : row.percentual >= 90 ? '#f59e0b' : '#22c55e',
                          }}
                        >
                          {row.percentual.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-[#94a3b8]">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total row */}
                <TableRow style={{ backgroundColor: '#F2F6FA' }}>
                  <TableCell className="font-bold text-[#273544]">Total</TableCell>
                  <TableCell className="text-right font-mono font-bold text-[#273544]">
                    {formatCurrency(totalOrcado)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[#273544]">
                    {formatCurrency(totalRealizado)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    <span style={{ color: difColor(totalDiferenca, totalOrcado) }}>
                      {totalOrcado === 0
                        ? '--'
                        : (totalDiferenca >= 0 ? '+' : '') + formatCurrency(totalDiferenca)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {totalPct !== null ? (
                      <span style={{ color: totalPct > 100 ? '#EF4343' : '#22c55e' }}>
                        {totalPct.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-[#94a3b8]">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Right: Progress bars */}
          <div className="liquid-glass-md rounded-3xl p-5 space-y-5">
            <p className="text-sm font-semibold text-[#273544]">Execução por Categoria</p>
            {rows.map((row) => {
              const pct = row.orcado > 0 ? Math.min((row.realizado / row.orcado) * 100, 100) : 0
              const overBudget = row.orcado > 0 && row.realizado > row.orcado
              const fillColor = overBudget ? '#EF4343' : '#0873F7'
              const noOrcado = row.orcado === 0

              return (
                <div key={row.categoria} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#273544]">{row.categoria}</span>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#626F7F]">
                      <span className="text-[#273544] font-semibold">{formatCurrency(row.realizado)}</span>
                      {!noOrcado && (
                        <>
                          <span>/</span>
                          <span>{formatCurrency(row.orcado)}</span>
                        </>
                      )}
                      {!noOrcado && row.percentual !== null && (
                        <span
                          className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: overBudget ? '#fef2f2' : '#f0fdf4',
                            color: overBudget ? '#EF4343' : '#22c55e',
                          }}
                        >
                          {row.percentual.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="relative h-2.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: noOrcado ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.45)' }}
                  >
                    {noOrcado ? (
                      // No budget defined: show realizado as a neutral bar
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ width: '100%', backgroundColor: '#cbd5e1' }}
                      />
                    ) : (
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: fillColor }}
                      />
                    )}
                  </div>

                  {noOrcado && (
                    <p className="text-[10px] text-[#94a3b8]">Sem orçamento definido nesta categoria</p>
                  )}
                </div>
              )
            })}

            {/* Total bar */}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.45)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#273544]">Total</span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#273544] font-bold">{formatCurrency(totalRealizado)}</span>
                  <span className="text-[#626F7F]">/</span>
                  <span className="text-[#626F7F]">{formatCurrency(totalOrcado)}</span>
                  {totalPct !== null && (
                    <span
                      className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: totalPct > 100 ? '#fef2f2' : '#f0fdf4',
                        color: totalPct > 100 ? '#EF4343' : '#22c55e',
                      }}
                    >
                      {totalPct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div
                className="relative h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.45)' }}
              >
                {totalOrcado > 0 && (
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((totalRealizado / totalOrcado) * 100, 100)}%`,
                      backgroundColor: totalRealizado > totalOrcado ? '#EF4343' : '#0873F7',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "Definir Orçamento" Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Definir Orçamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Mês de referência</Label>
              <Select value={dialogMes} onValueChange={setDialogMes}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMesesAnteriores(12).concat([getProxMes()]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-[rgba(255,255,255,0.45)] overflow-hidden">
              <div
                className="px-4 py-2 text-xs font-semibold text-[#626F7F] grid grid-cols-2 gap-4"
                style={{ backgroundColor: '#F2F6FA' }}
              >
                <span>Categoria</span>
                <span>Valor Orçado (R$)</span>
              </div>
              <div className="divide-y divide-[rgba(255,255,255,0.45)]">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="px-4 py-2.5 grid grid-cols-2 gap-4 items-center">
                    <Label className="text-sm font-medium text-[#273544]">{cat}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={dialogValues[cat]}
                      onChange={(e) =>
                        setDialogValues((prev) => ({ ...prev, [cat]: e.target.value }))
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleSaveOrcamento} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Orçamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
