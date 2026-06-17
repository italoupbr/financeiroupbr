import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  formatDate,
  getMesAtual,
  getMesesAnteriores,
  statusBadgeClass,
  statusLabel,
  isOverdue,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { Plus, Edit2, Trash2, Check, Download } from 'lucide-react'
import type { Despesa, FaturaCartao, CategoriaDespesa } from '@/types'
import * as XLSX from 'xlsx'

interface FormState {
  descricao: string
  valor: string
  categoria_nome: string
  categoria_tipo: string
  recorrente: string
  mes_referencia: string
  data_vencimento: string
  forma_pagamento: string
  observacao: string
}

const emptyForm: FormState = {
  descricao: '',
  valor: '',
  categoria_nome: '',
  categoria_tipo: '',
  recorrente: 'false',
  mes_referencia: getMesAtual(),
  data_vencimento: '',
  forma_pagamento: '',
  observacao: '',
}

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [faturas, setFaturas] = useState<FaturaCartao[]>([])
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([])
  const [selectedMes, setSelectedMes] = useState<string>(getMesAtual())
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [d, f, c] = await Promise.all([
        supabase.from('despesas').select('*').order('criado_em', { ascending: false }),
        supabase
          .from('faturas_cartao')
          .select('*')
          .order('data_compra', { ascending: false }),
        supabase.from('categorias_despesa').select('*'),
      ])
      if (d.error) throw d.error
      if (f.error) throw f.error
      if (c.error) throw c.error
      setDespesas(d.data ?? [])
      setFaturas(f.data ?? [])
      setCategorias(c.data ?? [])
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar despesas',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ ...emptyForm, mes_referencia: selectedMes })
  }

  function openEdit(d: Despesa) {
    setEditingDespesa(d)
    setForm({
      descricao: d.descricao,
      valor: String(d.valor),
      categoria_nome: d.categoria_nome ?? '',
      categoria_tipo: d.categoria_tipo ?? '',
      recorrente: d.recorrente ? 'true' : 'false',
      mes_referencia: d.mes_referencia ?? selectedMes,
      data_vencimento: d.data_vencimento ?? '',
      forma_pagamento: d.forma_pagamento ?? '',
      observacao: d.observacao ?? '',
    })
    setDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      categoria_nome: form.categoria_nome || null,
      categoria_tipo: form.categoria_tipo || null,
      recorrente: form.recorrente === 'true',
      mes_referencia: form.mes_referencia || null,
      data_vencimento: form.data_vencimento || null,
      forma_pagamento: form.forma_pagamento || null,
      observacao: form.observacao || null,
    }

    try {
      if (editingDespesa) {
        const { error } = await supabase
          .from('despesas')
          .update(payload)
          .eq('id', editingDespesa.id)
        if (error) throw error
        toast({ title: 'Despesa atualizada com sucesso' })
      } else {
        const { error } = await supabase.from('despesas').insert([payload])
        if (error) throw error
        toast({ title: 'Despesa criada com sucesso' })
      }
      setDialog(false)
      fetchData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar despesa',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  async function marcarPago(id: string) {
    try {
      const { error } = await supabase
        .from('despesas')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
      if (error) throw error
      toast({ title: 'Despesa marcada como paga' })
      fetchData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao atualizar status',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('despesas').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Despesa excluída' })
      setDeleteConfirm(null)
      fetchData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir despesa',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  // Computed values
  const despesasMes = despesas.filter((d) => d.mes_referencia === selectedMes)
  const totalPago = despesasMes
    .filter((d) => d.status === 'pago')
    .reduce((s, d) => s + d.valor, 0)
  const totalPendente = despesasMes
    .filter((d) => d.status === 'pendente')
    .reduce((s, d) => s + d.valor, 0)
  const totalAtrasado = despesasMes
    .filter(
      (d) =>
        d.status === 'atrasado' ||
        (d.status === 'pendente' && isOverdue(d.data_vencimento))
    )
    .reduce((s, d) => s + d.valor, 0)
  const totalGeral = despesasMes.reduce((s, d) => s + d.valor, 0)

  // Recorrentes: deduplicated by descricao, show latest
  const recorrentesMap = new Map<string, Despesa>()
  despesas
    .filter((d) => d.recorrente)
    .forEach((d) => {
      const existing = recorrentesMap.get(d.descricao)
      if (!existing || d.criado_em > existing.criado_em) {
        recorrentesMap.set(d.descricao, d)
      }
    })
  const recorrentes = Array.from(recorrentesMap.values())

  // Em atraso
  const emAtraso = despesas.filter(
    (d) => d.status === 'pendente' && isOverdue(d.data_vencimento)
  )

  function getCategoriaColor(nome: string | null): string {
    if (!nome) return '#94a3b8'
    return categorias.find((c) => c.nome === nome)?.cor ?? '#94a3b8'
  }

  function diasAtrasado(dateStr: string | null | undefined): number {
    if (!dateStr) return 0
    return Math.floor(
      (Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000
    )
  }

  function exportExcel() {
    const rows = despesasMes.map((d) => ({
      Descrição: d.descricao,
      Categoria: d.categoria_nome ?? '',
      Tipo: d.categoria_tipo ?? '',
      Valor: d.valor,
      'Mês Referência': d.mes_referencia ?? '',
      Vencimento: d.data_vencimento ?? '',
      Pagamento: d.data_pagamento ?? '',
      Status: d.status,
      Recorrente: d.recorrente ? 'Sim' : 'Não',
      'Forma Pagamento': d.forma_pagamento ?? '',
      Observação: d.observacao ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Despesas')
    XLSX.writeFile(wb, `Despesas_${selectedMes.replace('/', '_')}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#626F7F]">Carregando despesas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#273544]">Despesas</h2>
          <Select value={selectedMes} onValueChange={setSelectedMes}>
            <SelectTrigger className="w-36">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-3.5 w-3.5 mr-1" /> Excel
          </Button>
          <Button
            onClick={() => {
              setEditingDespesa(null)
              resetForm()
              setDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Nova Despesa
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F]">Total</p>
          <p className="font-mono font-bold text-[#273544]">
            {formatCurrency(totalGeral)}
          </p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F]">Pago</p>
          <p className="font-mono font-bold text-[#22c55e]">
            {formatCurrency(totalPago)}
          </p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F]">Pendente</p>
          <p className="font-mono font-bold text-[#f59e0b]">
            {formatCurrency(totalPendente)}
          </p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F]">Atrasado</p>
          <p className="font-mono font-bold text-[#EF4343]">
            {formatCurrency(totalAtrasado)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <Tabs defaultValue="todas">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="recorrentes">Recorrentes</TabsTrigger>
            <TabsTrigger value="cartoes">Cartões</TabsTrigger>
            <TabsTrigger value="atraso">Em Atraso</TabsTrigger>
          </TabsList>

          {/* Tab: Todas */}
          <TabsContent value="todas">
            {despesasMes.length === 0 ? (
              <p className="text-sm text-[#626F7F] py-8 text-center">
                Nenhuma despesa em {selectedMes}.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Forma Pag.</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesasMes.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell>
                        {d.categoria_nome ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getCategoriaColor(d.categoria_nome),
                              }}
                            />
                            {d.categoria_nome}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(d.valor)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            d.status !== 'pago' && isOverdue(d.data_vencimento)
                              ? 'text-red-600 font-medium'
                              : ''
                          }
                        >
                          {formatDate(d.data_vencimento)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${statusBadgeClass(d.status)}`}
                        >
                          {statusLabel(d.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#626F7F] text-sm">
                        {d.forma_pagamento ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {d.status !== 'pago' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => marcarPago(d.id)}
                              title="Marcar como pago"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => openEdit(d)}
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(d.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Tab: Recorrentes */}
          <TabsContent value="recorrentes">
            {recorrentes.length === 0 ? (
              <p className="text-sm text-[#626F7F] py-8 text-center">
                Nenhuma despesa recorrente cadastrada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Recorrente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recorrentes.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell>
                        {d.categoria_nome ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getCategoriaColor(d.categoria_nome),
                              }}
                            />
                            {d.categoria_nome}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(d.valor)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border bg-blue-50 text-blue-700 border-blue-200">
                          Mensal
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Tab: Cartões */}
          <TabsContent value="cartoes">
            <Tabs defaultValue="inter">
              <TabsList className="mt-1 mb-3">
                <TabsTrigger value="inter">Cartão Inter</TabsTrigger>
                <TabsTrigger value="sicoob">Cartão Sicoob</TabsTrigger>
              </TabsList>

              <TabsContent value="inter">
                {(() => {
                  const interFaturas = faturas.filter((f) =>
                    f.cartao.toLowerCase().includes('inter')
                  )
                  const interTotal = interFaturas.reduce((s, f) => s + f.valor, 0)
                  return (
                    <>
                      {interFaturas.length === 0 ? (
                        <p className="text-sm text-[#626F7F] py-8 text-center">
                          Nenhuma fatura do Cartão Inter.
                        </p>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {interFaturas.map((f) => (
                                <TableRow key={f.id}>
                                  <TableCell>{formatDate(f.data_compra)}</TableCell>
                                  <TableCell className="font-medium">
                                    {f.descricao}
                                  </TableCell>
                                  <TableCell className="text-[#626F7F] text-sm">
                                    {f.categoria ?? '—'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatCurrency(f.valor)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <div className="text-right font-mono font-bold p-4 border-t text-[#273544]">
                            Total: {formatCurrency(interTotal)}
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}
              </TabsContent>

              <TabsContent value="sicoob">
                {(() => {
                  const sicoobFaturas = faturas.filter((f) =>
                    f.cartao.toLowerCase().includes('sicoob')
                  )
                  const sicoobTotal = sicoobFaturas.reduce((s, f) => s + f.valor, 0)
                  return (
                    <>
                      {sicoobFaturas.length === 0 ? (
                        <p className="text-sm text-[#626F7F] py-8 text-center">
                          Nenhuma fatura do Cartão Sicoob.
                        </p>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sicoobFaturas.map((f) => (
                                <TableRow key={f.id}>
                                  <TableCell>{formatDate(f.data_compra)}</TableCell>
                                  <TableCell className="font-medium">
                                    {f.descricao}
                                  </TableCell>
                                  <TableCell className="text-[#626F7F] text-sm">
                                    {f.categoria ?? '—'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatCurrency(f.valor)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <div className="text-right font-mono font-bold p-4 border-t text-[#273544]">
                            Total: {formatCurrency(sicoobTotal)}
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tab: Em Atraso */}
          <TabsContent value="atraso">
            {emAtraso.length === 0 ? (
              <p className="text-sm text-[#626F7F] py-8 text-center">
                Nenhuma despesa em atraso.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias Atrasado</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emAtraso.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(d.valor)}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatDate(d.data_vencimento)}
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-semibold">
                          {diasAtrasado(d.data_vencimento)} dias
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => marcarPago(d.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Pagar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Aluguel do escritório"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoria_nome}
                  onValueChange={(v) => {
                    const cat = categorias.find((c) => c.nome === v)
                    setForm({
                      ...form,
                      categoria_nome: v,
                      categoria_tipo: cat?.tipo ?? '',
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mes_referencia">Mês Referência</Label>
                <Input
                  id="mes_referencia"
                  value={form.mes_referencia}
                  onChange={(e) =>
                    setForm({ ...form, mes_referencia: e.target.value })
                  }
                  placeholder="Ex: Jun/2026"
                />
              </div>
              <div>
                <Label htmlFor="data_vencimento">Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={form.data_vencimento}
                  onChange={(e) =>
                    setForm({ ...form, data_vencimento: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <Select
                value={form.forma_pagamento}
                onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Pix',
                    'Cartão Inter',
                    'Cartão Sicoob',
                    'Débito',
                    'Boleto',
                    'Transferência',
                  ].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recorrente"
                checked={form.recorrente === 'true'}
                onChange={(e) =>
                  setForm({ ...form, recorrente: e.target.checked ? 'true' : 'false' })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="recorrente" className="cursor-pointer">
                Despesa recorrente
              </Label>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#626F7F]">
            Tem certeza que deseja excluir esta despesa? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
