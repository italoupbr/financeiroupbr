import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { AlertCircle, Edit2, Plus } from 'lucide-react'
import { buildCashFlowProjection } from '@/lib/formulas'
import type { FluxoCaixa as FluxoCaixaType } from '@/types'

type FilterType = 'todos' | 'realizados' | 'previstos' | 'atrasado'

const emptyForm = {
  tipo: 'entrada' as 'entrada' | 'saida',
  descricao: '',
  valor: '',
  data_prevista: '',
  status: 'previsto' as 'previsto' | 'realizado' | 'atrasado',
  origem: '',
  mes_referencia: '',
}

export default function FluxoCaixa() {

  const [entries, setEntries] = useState<FluxoCaixaType[]>([])
  const [saldoAtual, setSaldoAtual] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FluxoCaixaType | null>(null)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [form, setForm] = useState({ ...emptyForm })

  async function fetchData() {
    setLoading(true)
    try {
      const [{ data: entriesData, error: entriesErr }, { data: contasData }] = await Promise.all([
        supabase.from('fluxo_caixa').select('*').order('data_prevista', { ascending: true }),
        supabase.from('contas_bancarias').select('saldo_atual'),
      ])
      if (entriesErr) throw entriesErr
      setEntries(entriesData ?? [])
      const total = (contasData ?? []).reduce((s, c) => s + (c.saldo_atual ?? 0), 0)
      setSaldoAtual(total)
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Projection
  const projection = buildCashFlowProjection(
    saldoAtual,
    entries.filter(e => e.tipo === 'entrada').map(e => ({ valor: e.valor, data: e.data_prevista })),
    entries.filter(e => e.tipo === 'saida').map(e => ({ valor: e.valor, data: e.data_prevista })),
    30,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit30 = new Date(today)
  limit30.setDate(today.getDate() + 30)

  function inNext30(dateStr: string | null): boolean {
    if (!dateStr) return false
    const d = new Date(dateStr + 'T12:00:00')
    return d >= today && d <= limit30
  }

  const entradasPrevistas30d = entries
    .filter(e => e.tipo === 'entrada' && e.status === 'previsto' && inNext30(e.data_prevista))
    .reduce((s, e) => s + e.valor, 0)

  const saidasPrevistas30d = entries
    .filter(e => e.tipo === 'saida' && e.status === 'previsto' && inNext30(e.data_prevista))
    .reduce((s, e) => s + e.valor, 0)

  const saldoProjetado30d = saldoAtual + entradasPrevistas30d - saidasPrevistas30d
  const hasNegative = projection.some(d => d.saldo < 0)
  const negativeDay = projection.find(d => d.saldo < 0)

  function getFilteredEntries(tipo: 'entrada' | 'saida') {
    return entries.filter(e => {
      if (e.tipo !== tipo) return false
      if (filter === 'realizados') return e.status === 'realizado'
      if (filter === 'previstos') return e.status === 'previsto'
      if (filter === 'atrasado') return e.status === 'atrasado'
      return true
    })
  }

  function openDialog(tipo: 'entrada' | 'saida', entry?: FluxoCaixaType) {
    if (entry) {
      setEditingEntry(entry)
      setForm({
        tipo: entry.tipo,
        descricao: entry.descricao,
        valor: String(entry.valor),
        data_prevista: entry.data_prevista ?? '',
        status: entry.status,
        origem: entry.origem ?? '',
        mes_referencia: entry.mes_referencia ?? '',
      })
    } else {
      setEditingEntry(null)
      setForm({ ...emptyForm, tipo })
    }
    setDialog(true)
  }

  function computeMesReferencia(dateStr: string): string {
    if (!dateStr) return ''
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const d = new Date(dateStr + 'T12:00:00')
    return `${meses[d.getMonth()]}/${d.getFullYear()}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      tipo: form.tipo,
      descricao: form.descricao,
      valor: parseFloat(form.valor) || 0,
      data_prevista: form.data_prevista || null,
      status: form.status,
      origem: form.origem || null,
      mes_referencia: form.mes_referencia || computeMesReferencia(form.data_prevista),
    }
    try {
      if (editingEntry) {
        const { error: updateErr } = await supabase.from('fluxo_caixa').update(payload).eq('id', editingEntry.id)
        if (updateErr) throw updateErr
        toast({ title: 'Registro atualizado' })
      } else {
        const { error: insertErr } = await supabase.from('fluxo_caixa').insert(payload)
        if (insertErr) throw insertErr
        toast({ title: `${form.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada` })
      }
      setDialog(false)
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message ?? 'Tente novamente', variant: 'destructive' })
    }
  }

  const filterBtns: { label: string; value: FilterType }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Realizados', value: 'realizados' },
    { label: 'Previstos', value: 'previstos' },
    { label: 'Em Atraso', value: 'atrasado' },
  ]

  function FilterTable({ tipo }: { tipo: 'entrada' | 'saida' }) {
    const filtered = getFilteredEntries(tipo)
    const borderColor = tipo === 'entrada' ? 'border-green-200' : 'border-red-200'
    const headerBg = tipo === 'entrada' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    const headerText = tipo === 'entrada' ? 'text-green-700' : 'text-red-700'
    const label = tipo === 'entrada' ? 'ENTRADAS' : 'SAÍDAS'

    return (
      <div className={`liquid-glass-md border-2 ${borderColor} rounded-3xl overflow-hidden`}>
        <div className={`${headerBg} px-4 py-2 border-b`}>
          <h3 className={`font-semibold ${headerText} text-sm`}>{label}</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-white/20">
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[#626F7F] text-sm py-8">
                  Nenhum registro
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm text-[#626F7F]">
                    {formatDate(entry.data_prevista)}
                  </TableCell>
                  <TableCell className="text-sm text-[#273544]">{entry.descricao}</TableCell>
                  <TableCell className={`font-mono font-medium ${tipo === 'entrada' ? 'text-[#22c55e]' : 'text-[#EF4343]'}`}>
                    {formatCurrency(entry.valor)}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusBadgeClass(entry.status)}`}>
                      {statusLabel(entry.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => openDialog(tipo, entry)}
                      className="p-1.5 rounded hover:bg-white/30 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[#626F7F]" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#273544]">Fluxo de Caixa</h1>
        <p className="text-sm text-[#626F7F]">Projeção e controle de entradas e saídas</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
          <button onClick={() => { setError(null); fetchData() }} className="ml-auto underline">Tentar novamente</button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Bancário — read-only from contas_bancarias */}
        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs text-[#626F7F] uppercase tracking-wide">Saldo Bancário</p>
          <p className={`font-mono text-2xl font-bold mt-2 ${saldoAtual >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'}`}>
            {formatCurrency(saldoAtual)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">Total em contas bancárias</p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs text-[#626F7F] uppercase tracking-wide">Entradas Previstas 30d</p>
          <p className="font-mono text-2xl font-bold text-[#22c55e] mt-2">{formatCurrency(entradasPrevistas30d)}</p>
          <p className="text-xs text-[#626F7F] mt-1">Próximos 30 dias</p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs text-[#626F7F] uppercase tracking-wide">Saídas Previstas 30d</p>
          <p className="font-mono text-2xl font-bold text-[#EF4343] mt-2">{formatCurrency(saidasPrevistas30d)}</p>
          <p className="text-xs text-[#626F7F] mt-1">Próximos 30 dias</p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs text-[#626F7F] uppercase tracking-wide">Saldo Projetado 30d</p>
          <p className={`font-mono text-2xl font-bold mt-2 ${saldoProjetado30d >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'}`}>
            {formatCurrency(saldoProjetado30d)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">Estimativa acumulada</p>
        </div>
      </div>

      {/* Alert banner */}
      {hasNegative && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Saldo projetado negativo a partir de {negativeDay?.label}. Atenção ao fluxo de caixa.
        </div>
      )}

      {/* Line Chart */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <h3 className="font-semibold text-[#273544] mb-4">Projeção de Saldo — 30 Dias</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={projection} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#626F7F' }}
              interval={4}
            />
            <YAxis
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#626F7F' }}
            />
            <Tooltip
              formatter={(v: unknown) => formatCurrency(Number(v))}
              labelStyle={{ color: '#273544' }}
            />
            <ReferenceLine y={0} stroke="#EF4343" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#0873F7"
              strokeWidth={2}
              dot={false}
              name="Saldo"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Filter + Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-white/20 p-1 rounded-lg border border-[rgba(255,255,255,0.45)]">
          {filterBtns.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === btn.value
                  ? 'bg-[#0873F7] text-white'
                  : 'text-[#626F7F] hover:text-[#273544]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openDialog('entrada')}
            className="gap-1.5 bg-[#22c55e] hover:bg-green-600 text-white"
          >
            <Plus className="h-4 w-4" /> Nova Entrada
          </Button>
          <Button
            onClick={() => openDialog('saida')}
            className="gap-1.5 bg-[#EF4343] hover:bg-red-600 text-white"
          >
            <Plus className="h-4 w-4" /> Nova Saída
          </Button>
        </div>
      </div>

      {/* Two-column table */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse bg-[#f1f5f9]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FilterTable tipo="entrada" />
          <FilterTable tipo="saida" />
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEntry
                ? 'Editar Registro'
                : form.tipo === 'entrada'
                  ? 'Nova Entrada'
                  : 'Nova Saída'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={v => setForm(f => ({ ...f, tipo: v as 'entrada' | 'saida' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Data Prevista</Label>
              <Input
                type="date"
                value={form.data_prevista}
                onChange={e => setForm(f => ({ ...f, data_prevista: e.target.value }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={v => setForm(f => ({ ...f, status: v as 'previsto' | 'realizado' | 'atrasado' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="previsto">Previsto</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Input
                value={form.origem}
                onChange={e => setForm(f => ({ ...f, origem: e.target.value }))}
                placeholder="Ex: cliente, fornecedor..."
              />
            </div>
            <div>
              <Label>Mês Referência</Label>
              <Input
                value={form.mes_referencia}
                onChange={e => setForm(f => ({ ...f, mes_referencia: e.target.value }))}
                placeholder="Mai/2026"
              />
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">{editingEntry ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
