import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, getMesAtual, getMesesAnteriores, statusBadgeClass, statusLabel, isWithinDays } from '@/lib/utils'
import { estimateDAS } from '@/lib/formulas'
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { AlertCircle, Calculator, Check, Plus, Edit2, Trash2 } from 'lucide-react'
import type { Imposto, Empresa } from '@/types'

const emptyForm = {
  tipo: 'DAS',
  descricao: '',
  valor: '',
  mes_referencia: getMesAtual(),
  competencia: '',
  data_vencimento: '',
  guia_numero: '',
}

export default function Impostos() {

  const [impostos, setImpostos] = useState<Imposto[]>([])
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [impostoHistory, setImpostoHistory] = useState<Imposto[]>([])
  const [selectedMes, setSelectedMes] = useState(getMesAtual())
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editingImposto, setEditingImposto] = useState<Imposto | null>(null)
  const [dasReceita, setDasReceita] = useState('')
  const [form, setForm] = useState({ ...emptyForm })

  const meses = getMesesAnteriores(12)

  async function fetchData() {
    setLoading(true)
    try {
      const [{ data: impostosData, error: e1 }, { data: empresaData }, { data: histData, error: e3 }] = await Promise.all([
        supabase
          .from('impostos')
          .select('*')
          .eq('mes_referencia', selectedMes)
          .order('data_vencimento'),
        supabase.from('empresa').select('*').limit(1).single(),
        supabase
          .from('impostos')
          .select('*')
          .in('mes_referencia', getMesesAnteriores(12))
          .order('mes_referencia'),
      ])
      if (e1) throw e1
      if (e3) throw e3
      setImpostos(impostosData ?? [])
      setEmpresa(empresaData ?? null)
      setImpostoHistory(histData ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar impostos', description: err?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [selectedMes])

  const urgentes = impostos.filter(
    i => i.status === 'pendente' && isWithinDays(i.data_vencimento, 7)
  )

  function openAdd() {
    setEditingImposto(null)
    setForm({ ...emptyForm, mes_referencia: selectedMes })
    setDialog(true)
  }

  function openEdit(imp: Imposto) {
    setEditingImposto(imp)
    setForm({
      tipo: imp.tipo,
      descricao: imp.descricao ?? '',
      valor: String(imp.valor),
      mes_referencia: imp.mes_referencia,
      competencia: imp.competencia ?? '',
      data_vencimento: imp.data_vencimento ?? '',
      guia_numero: imp.guia_numero ?? '',
    })
    setDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      tipo: form.tipo,
      descricao: form.descricao || null,
      valor: parseFloat(form.valor) || 0,
      mes_referencia: form.mes_referencia,
      competencia: form.competencia || null,
      data_vencimento: form.data_vencimento || null,
      guia_numero: form.guia_numero || null,
      status: 'pendente' as const,
    }
    if (editingImposto) {
      await supabase.from('impostos').update(payload).eq('id', editingImposto.id)
      toast({ title: 'Imposto atualizado' })
    } else {
      await supabase.from('impostos').insert(payload)
      toast({ title: 'Imposto adicionado' })
    }
    setDialog(false)
    fetchData()
  }

  async function marcarPago(imp: Imposto) {
    try {
      const { error } = await supabase
        .from('impostos')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', imp.id)
      if (error) throw error
      toast({ title: `${imp.tipo} marcado como pago` })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro ao marcar pago', description: err?.message, variant: 'destructive' })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro de imposto?')) return
    try {
      const { error } = await supabase.from('impostos').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Registro excluído' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err?.message, variant: 'destructive' })
    }
  }

  // Build chart data: group by mes and tipo
  const chartData = getMesesAnteriores(12).map(mes => {
    const items = impostoHistory.filter(i => i.mes_referencia === mes)
    const das = items.filter(i => i.tipo === 'DAS').reduce((s, i) => s + i.valor, 0)
    const darf = items.filter(i => i.tipo === 'DARF').reduce((s, i) => s + i.valor, 0)
    const outros = items.filter(i => !['DAS', 'DARF'].includes(i.tipo)).reduce((s, i) => s + i.valor, 0)
    return { mes, DAS: das, DARF: darf, Outros: outros }
  })

  const dasEstimado = estimateDAS(parseFloat(dasReceita || '0'), empresa?.aliquota_simples ?? 12.5)

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#273544]">Impostos e Obrigações</h1>
          <p className="text-sm text-[#626F7F]">Controle de tributos e guias fiscais</p>
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
          <Button onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>
      </div>

      {/* Alert banner */}
      {urgentes.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            <strong>{urgentes.length}</strong> obrigação(ões) com vencimento nos próximos 7 dias
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse bg-[#f1f5f9]" />
            ))}
          </div>
          <div className="liquid-glass-md rounded-3xl p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-11 rounded-lg animate-pulse bg-[#f1f5f9]" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Calendar grid */}
          {impostos.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {impostos.map(imp => (
                <div
                  key={imp.id}
                  className={`liquid-glass-md rounded-3xl p-4 ${imp.tipo === 'DAS' ? 'border-l-4 border-l-[#0873F7]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#626F7F] uppercase">{imp.tipo}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${statusBadgeClass(imp.status)}`}>
                      {statusLabel(imp.status)}
                    </span>
                  </div>
                  <p className="font-mono font-bold text-[#273544]">{formatCurrency(imp.valor)}</p>
                  {imp.data_vencimento && (
                    <p className="text-xs text-[#626F7F] mt-1">
                      Vence: {formatDate(imp.data_vencimento)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="liquid-glass-md rounded-3xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/20">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guia</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {impostos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-[#626F7F] text-sm py-10">
                      Nenhum imposto registrado em {selectedMes}
                    </TableCell>
                  </TableRow>
                ) : (
                  impostos.map(imp => (
                    <TableRow key={imp.id}>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${imp.tipo === 'DAS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {imp.tipo}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#626F7F]">{imp.descricao ?? '—'}</TableCell>
                      <TableCell className="text-sm text-[#626F7F]">{imp.competencia ?? '—'}</TableCell>
                      <TableCell className="font-mono text-[#273544]">{formatCurrency(imp.valor)}</TableCell>
                      <TableCell className="text-sm text-[#626F7F]">{formatDate(imp.data_vencimento)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusBadgeClass(imp.status)}`}>
                          {statusLabel(imp.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#626F7F] font-mono">{imp.guia_numero ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {imp.status === 'pendente' && (
                            <button
                              onClick={() => marcarPago(imp)}
                              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium"
                            >
                              Pago
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(imp)}
                            className="p-1.5 rounded hover:bg-white/30 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#626F7F]" />
                          </button>
                          <button
                            onClick={() => handleDelete(imp.id)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Bottom grid: DAS Calculator + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* DAS Calculator */}
        <div className="liquid-glass-md rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-[#0873F7]" />
            <h3 className="font-semibold text-[#273544]">Calculadora DAS</h3>
          </div>
          <p className="text-xs text-[#626F7F] mb-3">
            Simples Nacional — alíquota {empresa?.aliquota_simples ?? 12.5}%
          </p>
          <Label>Receita Bruta do Mês</Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-[#626F7F]">R$</span>
            <Input
              type="number"
              value={dasReceita}
              onChange={e => setDasReceita(e.target.value)}
              placeholder="0,00"
            />
          </div>
          {dasReceita && parseFloat(dasReceita) > 0 && (
            <div className="mt-3 p-3 bg-white/30 rounded-lg">
              <p className="text-sm text-[#626F7F]">DAS Estimado:</p>
              <p className="font-mono font-bold text-[#0873F7] text-xl">
                {formatCurrency(dasEstimado)}
              </p>
            </div>
          )}
          <Button
            className="mt-3 w-full"
            variant="outline"
            onClick={() => {
              setForm({
                tipo: 'DAS',
                descricao: 'Simples Nacional',
                valor: String(dasEstimado),
                mes_referencia: selectedMes,
                competencia: '',
                data_vencimento: '',
                guia_numero: '',
              })
              setEditingImposto(null)
              setDialog(true)
            }}
          >
            Criar Registro DAS
          </Button>
        </div>

        {/* History Chart */}
        <div className="liquid-glass-md rounded-3xl p-5">
          <h3 className="font-semibold text-[#273544] mb-4">Histórico por Tipo — 12 Meses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#626F7F' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#626F7F' }} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="DAS" stackId="a" fill="#0873F7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="DARF" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Outros" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingImposto ? 'Editar Imposto' : 'Novo Imposto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAS">DAS</SelectItem>
                  <SelectItem value="DARF">DARF</SelectItem>
                  <SelectItem value="taxa_conta">Taxa de Conta</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mês Referência</Label>
                <Input
                  value={form.mes_referencia}
                  onChange={e => setForm(f => ({ ...f, mes_referencia: e.target.value }))}
                  placeholder="Mai/2026"
                />
              </div>
              <div>
                <Label>Competência</Label>
                <Input
                  value={form.competencia}
                  onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))}
                  placeholder="Mai/2026"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={form.data_vencimento}
                  onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
                />
              </div>
              <div>
                <Label>Número da Guia</Label>
                <Input
                  value={form.guia_numero}
                  onChange={e => setForm(f => ({ ...f, guia_numero: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">{editingImposto ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
