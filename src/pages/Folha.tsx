import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual, getMesesAnteriores, statusBadgeClass, statusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Users, DollarSign, TrendingUp, Plus, Edit2, Check, UserCircle2, Briefcase, LayoutList } from 'lucide-react'
import type { FolhaPagamento, DreMensal } from '@/types'

const mesesList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const emptyForm = {
  funcionario: '',
  cargo: '',
  salario: '',
  tipo: 'CLT',
  data_pagamento: '',
  mes_referencia: getMesAtual(),
}

type TabView = 'todos' | 'socios' | 'funcionarios'

// Adjust entry shape for the Gerar dialog (includes editable salary field)
interface GerarEntry {
  funcionario: string
  cargo: string | null
  salario: number
  salarioEdit: string
  tipo: string
}

export default function Folha() {

  const [folha, setFolha] = useState<FolhaPagamento[]>([])
  const [dreHistory, setDreHistory] = useState<DreMensal[]>([])
  const [selectedMes, setSelectedMes] = useState(getMesAtual())
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [gerarDialog, setGerarDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FolhaPagamento | null>(null)
  const [form, setForm] = useState({ ...emptyForm, mes_referencia: getMesAtual() })
  const [activeTab, setActiveTab] = useState<TabView>('todos')
  const [gerarEntries, setGerarEntries] = useState<GerarEntry[]>([])

  const meses = getMesesAnteriores(13)

  async function fetchFolha() {
    setLoading(true)
    try {
      const [{ data: folhaData, error: folhaError }, { data: dreData, error: dreError }] = await Promise.all([
        supabase
          .from('folha_pagamento')
          .select('*')
          .eq('mes_referencia', selectedMes)
          .order('funcionario'),
        supabase
          .from('dre_mensal')
          .select('*')
          .in('mes_referencia', getMesesAnteriores(13))
          .order('mes_referencia'),
      ])
      if (folhaError) throw folhaError
      if (dreError) throw dreError
      setFolha(folhaData ?? [])
      setDreHistory(dreData ?? [])
    } catch (err: unknown) {
      toast({ title: 'Erro ao carregar folha', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFolha() }, [selectedMes])

  // ─── Derived values ────────────────────────────────────────────────────────

  const totalFolha = folha.reduce((s, f) => s + f.salario, 0)
  const headcount = folha.length
  const dreMonth = dreHistory.find(d => d.mes_referencia === selectedMes)
  const percentReceita = dreMonth && dreMonth.receita_total > 0
    ? (totalFolha / dreMonth.receita_total) * 100
    : null

  const percentColor = percentReceita === null
    ? 'text-[#626F7F]'
    : percentReceita >= 40
      ? 'text-[#EF4343]'
      : percentReceita >= 30
        ? 'text-[#f59e0b]'
        : 'text-[#22c55e]'

  const percentBadgeClass = percentReceita === null
    ? 'bg-slate-100 text-slate-600'
    : percentReceita >= 40
      ? 'bg-red-100 text-red-700'
      : percentReceita >= 30
        ? 'bg-amber-100 text-amber-700'
        : 'bg-green-100 text-green-700'

  const pendentes = folha.filter(f => f.status === 'pendente')

  const totalSocios = folha
    .filter(f => f.tipo === 'Pró-labore')
    .reduce((s, f) => s + f.salario, 0)

  const totalFuncionarios = folha
    .filter(f => f.tipo === 'CLT' || f.tipo === 'PJ')
    .reduce((s, f) => s + f.salario, 0)

  // ─── Tab-filtered list ─────────────────────────────────────────────────────

  const filteredFolha = folha.filter(f => {
    if (activeTab === 'socios') return f.tipo === 'Pró-labore'
    if (activeTab === 'funcionarios') return f.tipo === 'CLT' || f.tipo === 'PJ'
    return true
  })

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function getNextMes(current: string): string {
    const [m, y] = current.split('/')
    const idx = mesesList.indexOf(m)
    if (idx === 11) return `Jan/${parseInt(y) + 1}`
    return `${mesesList[idx + 1]}/${y}`
  }

  function getPrevMes(current: string): string {
    const [m, y] = current.split('/')
    const idx = mesesList.indexOf(m)
    if (idx === 0) return `Dez/${parseInt(y) - 1}`
    return `${mesesList[idx - 1]}/${y}`
  }

  function tipoBadgeClass(tipo: string) {
    switch (tipo) {
      case 'PJ': return 'bg-purple-100 text-purple-700'
      case 'Pró-labore': return 'bg-amber-100 text-amber-700'
      case 'CLT': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // ─── Dialog handlers ───────────────────────────────────────────────────────

  function openAdd() {
    setEditingEntry(null)
    setForm({ ...emptyForm, mes_referencia: selectedMes })
    setDialog(true)
  }

  function openEdit(entry: FolhaPagamento) {
    setEditingEntry(entry)
    setForm({
      funcionario: entry.funcionario,
      cargo: entry.cargo ?? '',
      salario: String(entry.salario),
      tipo: entry.tipo,
      data_pagamento: entry.data_pagamento ?? '',
      mes_referencia: entry.mes_referencia,
    })
    setDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        funcionario: form.funcionario,
        cargo: form.cargo || null,
        salario: parseFloat(form.salario) || 0,
        tipo: form.tipo,
        data_pagamento: form.data_pagamento || null,
        mes_referencia: form.mes_referencia,
        status: 'pendente' as const,
      }
      if (editingEntry) {
        const { error } = await supabase.from('folha_pagamento').update(payload).eq('id', editingEntry.id)
        if (error) throw error
        toast({ title: 'Entrada atualizada' })
      } else {
        const { error } = await supabase.from('folha_pagamento').insert(payload)
        if (error) throw error
        toast({ title: 'Entrada adicionada' })
      }
      setDialog(false)
      fetchFolha()
    } catch (err: unknown) {
      toast({ title: 'Erro ao salvar', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function marcarPago(id: string) {
    try {
      const { error } = await supabase
        .from('folha_pagamento')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', id)
      if (error) throw error
      fetchFolha()
    } catch (err: unknown) {
      toast({ title: 'Erro ao marcar pago', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function marcarTodosPago() {
    try {
      const ids = pendentes.map(f => f.id)
      for (const id of ids) {
        const { error } = await supabase
          .from('folha_pagamento')
          .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
          .eq('id', id)
        if (error) throw error
      }
      toast({ title: `${ids.length} registros marcados como pago` })
      fetchFolha()
    } catch (err: unknown) {
      toast({ title: 'Erro ao marcar todos pagos', description: (err as Error).message, variant: 'destructive' })
    }
  }

  // ─── Gerar Folha ──────────────────────────────────────────────────────────

  async function openGerarDialog() {
    // Load the current month's entries (they'll be the template for next month)
    // folha is already the selectedMes entries; use them directly
    const entries: GerarEntry[] = folha.map(f => ({
      funcionario: f.funcionario,
      cargo: f.cargo,
      salario: f.salario,
      salarioEdit: String(f.salario),
      tipo: f.tipo,
    }))
    setGerarEntries(entries)
    setGerarDialog(true)
  }

  function updateGerarSalario(idx: number, value: string) {
    setGerarEntries(prev => prev.map((e, i) => i === idx ? { ...e, salarioEdit: value } : e))
  }

  async function handleGerarFolha() {
    try {
      const nextMes = getNextMes(selectedMes)
      const copies = gerarEntries.map(e => ({
        funcionario: e.funcionario,
        cargo: e.cargo,
        salario: parseFloat(e.salarioEdit) || e.salario,
        tipo: e.tipo,
        mes_referencia: nextMes,
        data_pagamento: null,
        status: 'pendente' as const,
      }))
      const { error } = await supabase.from('folha_pagamento').insert(copies)
      if (error) throw error
      toast({ title: `Folha gerada para ${nextMes}`, description: `${copies.length} registros criados` })
      setGerarDialog(false)
      setSelectedMes(nextMes)
    } catch (err: unknown) {
      toast({ title: 'Erro ao gerar folha', description: (err as Error).message, variant: 'destructive' })
    }
  }

  // ─── Chart ────────────────────────────────────────────────────────────────

  const chartData = getMesesAnteriores(12).map(mes => {
    const dre = dreHistory.find(d => d.mes_referencia === mes)
    return { mes, folha_total: dre?.folha_total ?? 0 }
  })

  // ─── Tab config ───────────────────────────────────────────────────────────

  const tabs: { id: TabView; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'todos',
      label: 'Todos',
      icon: <LayoutList className="h-3.5 w-3.5" />,
      count: folha.length,
    },
    {
      id: 'socios',
      label: 'Sócios (Pró-labore)',
      icon: <UserCircle2 className="h-3.5 w-3.5" />,
      count: folha.filter(f => f.tipo === 'Pró-labore').length,
    },
    {
      id: 'funcionarios',
      label: 'Funcionários (CLT/PJ)',
      icon: <Briefcase className="h-3.5 w-3.5" />,
      count: folha.filter(f => f.tipo === 'CLT' || f.tipo === 'PJ').length,
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#273544]">Folha de Pagamento</h1>
          <p className="text-sm text-[#626F7F]">Gestão de salários e remunerações</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMes} onValueChange={setSelectedMes}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-md rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-[#0873F7]" />
            <p className="text-xs text-[#626F7F] uppercase tracking-wide">Total Folha</p>
          </div>
          <p className="font-mono text-2xl font-bold text-[#273544]">{formatCurrency(totalFolha)}</p>
          <p className="text-xs text-[#626F7F] mt-1">{headcount} registros em {selectedMes}</p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-[#0873F7]" />
            <p className="text-xs text-[#626F7F] uppercase tracking-wide">% da Receita</p>
          </div>
          {percentReceita !== null ? (
            <div className="flex items-baseline gap-2">
              <p className={`font-mono text-2xl font-bold ${percentColor}`}>
                {percentReceita.toFixed(1).replace('.', ',')}%
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${percentBadgeClass}`}>
                {percentReceita < 30 ? 'Saudável' : percentReceita < 40 ? 'Atenção' : 'Alto'}
              </span>
            </div>
          ) : (
            <p className="font-mono text-2xl font-bold text-[#626F7F]">—</p>
          )}
          <p className="text-xs text-[#626F7F] mt-1">
            {percentReceita !== null
              ? `Custo pessoal sobre receita de ${formatCurrency(dreMonth?.receita_total ?? 0)}`
              : 'DRE não encontrado para este mês'}
          </p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-[#0873F7]" />
            <p className="text-xs text-[#626F7F] uppercase tracking-wide">Headcount</p>
          </div>
          <p className="font-mono text-2xl font-bold text-[#273544]">{headcount}</p>
          <p className="text-xs text-[#626F7F] mt-1">
            {pendentes.length > 0 ? `${pendentes.length} pendente(s)` : 'Todos pagos'}
          </p>
        </div>
      </div>

      {/* Cost Breakdown Card */}
      <div className="liquid-glass-md rounded-3xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-xs text-[#626F7F] uppercase tracking-wide font-medium shrink-0">Composição da Folha</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-sm font-medium text-amber-800">
              <UserCircle2 className="h-3.5 w-3.5" />
              Pró-labore: <span className="font-mono">{formatCurrency(totalSocios)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-sm font-medium text-blue-800">
              <Briefcase className="h-3.5 w-3.5" />
              Funcionários: <span className="font-mono">{formatCurrency(totalFuncionarios)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-sm font-medium text-[#273544]">
              <DollarSign className="h-3.5 w-3.5" />
              Total: <span className="font-mono">{formatCurrency(totalFolha)}</span>
            </span>
            {percentReceita !== null && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${percentBadgeClass} border-current/20`}>
                <TrendingUp className="h-3.5 w-3.5" />
                {percentReceita.toFixed(1).replace('.', ',')}% da receita
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Entrada
        </Button>
        <Button variant="outline" onClick={openGerarDialog} className="gap-1.5">
          <TrendingUp className="h-4 w-4" /> Gerar Folha Próximo Mês
        </Button>
        {pendentes.length > 0 && (
          <Button
            variant="outline"
            className="gap-1.5 border-[#22c55e] text-[#22c55e] hover:bg-green-50"
            onClick={marcarTodosPago}
          >
            <Check className="h-4 w-4" /> Marcar Todos Pago
          </Button>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/70 text-[#273544] shadow-sm backdrop-blur-sm'
                : 'text-[#626F7F] hover:text-[#273544]'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === tab.id ? 'bg-white/30 text-[#0873F7]' : 'bg-[rgba(255,255,255,0.45)] text-[#626F7F]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="liquid-glass-md rounded-3xl p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse bg-[#f1f5f9]" />
          ))}
        </div>
      ) : (
        <div className="liquid-glass-md rounded-3xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/20">
                <TableHead>Funcionário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Pagto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFolha.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#626F7F] text-sm py-10">
                    {activeTab === 'todos'
                      ? `Nenhum registro em ${selectedMes}`
                      : `Nenhum registro nesta categoria em ${selectedMes}`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFolha.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-[#273544]">{entry.funcionario}</TableCell>
                    <TableCell className="text-[#626F7F] text-sm">{entry.cargo ?? '—'}</TableCell>
                    <TableCell className="font-mono text-[#273544]">{formatCurrency(entry.salario)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadgeClass(entry.tipo)}`}>
                        {entry.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#626F7F]">
                      {entry.data_pagamento
                        ? new Date(entry.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusBadgeClass(entry.status)}`}>
                        {statusLabel(entry.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {entry.status === 'pendente' && (
                          <button
                            onClick={() => marcarPago(entry.id)}
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium"
                          >
                            Marcar Pago
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded hover:bg-white/30 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#626F7F]" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Chart */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <h3 className="font-semibold text-[#273544] mb-4">Evolução da Folha — Últimos 12 Meses</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#626F7F' }} />
            <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#626F7F' }} />
            <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} labelStyle={{ color: '#273544' }} />
            <Bar dataKey="folha_total" fill="#0873F7" radius={[4, 4, 0, 0]} name="Total Folha" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <Label>Funcionário</Label>
              <Input
                value={form.funcionario}
                onChange={e => setForm(f => ({ ...f, funcionario: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input
                value={form.cargo}
                onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
              />
            </div>
            <div>
              <Label>Salário / Remuneração</Label>
              <Input
                type="number"
                step="0.01"
                value={form.salario}
                onChange={e => setForm(f => ({ ...f, salario: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Pró-labore">Pró-labore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Pagamento</Label>
              <Input
                type="date"
                value={form.data_pagamento}
                onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))}
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

      {/* Gerar Folha Dialog */}
      <Dialog open={gerarDialog} onOpenChange={setGerarDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar Folha para {getNextMes(selectedMes)}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-[#626F7F]">
              Os registros abaixo de <strong>{selectedMes}</strong> serão copiados para{' '}
              <strong>{getNextMes(selectedMes)}</strong> com status <em>pendente</em>.
              Ajuste os valores antes de confirmar.
            </p>
            {gerarEntries.length === 0 ? (
              <p className="text-sm text-[#626F7F] italic">Nenhum registro encontrado no mês atual.</p>
            ) : (
              <div className="border border-[rgba(255,255,255,0.45)] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/20">
                    <tr>
                      <th className="text-left px-3 py-2 text-[#626F7F] font-medium">Funcionário</th>
                      <th className="text-left px-3 py-2 text-[#626F7F] font-medium">Tipo</th>
                      <th className="text-right px-3 py-2 text-[#626F7F] font-medium">Salário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gerarEntries.map((entry, idx) => (
                      <tr key={idx} className="border-t border-[#f1f5f9]">
                        <td className="px-3 py-2 text-[#273544]">
                          <div className="font-medium">{entry.funcionario}</div>
                          {entry.cargo && <div className="text-xs text-[#626F7F]">{entry.cargo}</div>}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            entry.tipo === 'Pró-labore'
                              ? 'bg-amber-100 text-amber-700'
                              : entry.tipo === 'PJ'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {entry.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-xs text-[#626F7F] mr-1">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={entry.salarioEdit}
                              onChange={e => updateGerarSalario(idx, e.target.value)}
                              className="w-28 h-7 text-sm text-right font-mono"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/20 border-t border-[rgba(255,255,255,0.45)]">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-sm font-medium text-[#273544]">Total</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-[#273544]">
                        {formatCurrency(gerarEntries.reduce((s, e) => s + (parseFloat(e.salarioEdit) || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleGerarFolha} disabled={gerarEntries.length === 0}>
              Confirmar Geração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
