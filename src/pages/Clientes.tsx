import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Plus, Edit2, UserX, CheckCircle, DollarSign, Download, UserCheck, RefreshCw } from 'lucide-react'
import type { Cliente, Receita } from '@/types'
import * as XLSX from 'xlsx'

const mesAtual = getMesAtual()

const emptyForm = {
  nome: '',
  tipo: 'recorrente' as 'recorrente' | 'variavel',
  valor_mensalidade: '',
  dia_pagamento: '',
  data_inicio: '',
  contrato_vigente: true,
  vencimento_contrato: '',
  observacao: '',
}

const emptyPagamentoForm = {
  valor: '',
  data_pagamento: '',
  observacao: '',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function statusMesBadge(clienteId: string | null, nome: string, receitas: Receita[]) {
  const r = receitas.find((x) => x.cliente_id === clienteId || x.cliente_nome === nome)
  if (!r) return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-white/40 text-[#626F7F] border-white/50">Sem lançamento</span>
  if (r.status === 'pago') return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-green-200">Pago</span>
  return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 border-amber-200">Pendente</span>
}

function tipoBadge(tipo: string) {
  return tipo === 'recorrente'
    ? <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-[#0873F7]/10 text-[#0873F7] border-[#0873F7]/20">Recorrente</span>
    : <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 border-purple-200">Variável</span>
}

function calcDiasAtraso(dia: number | null) {
  if (!dia) return 0
  const hoje = new Date()
  const venc = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
  if (venc > hoje) return 0
  return Math.floor((hoje.getTime() - venc.getTime()) / 86400000)
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)

  const [clienteDialog, setClienteDialog] = useState(false)
  const [pagamentoDialog, setPagamentoDialog] = useState(false)
  const [inativarDialog, setInativarDialog] = useState(false)
  const [reativarDialog, setReativarDialog] = useState(false)

  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  const [form, setForm] = useState(emptyForm)
  const [pagamentoForm, setPagamentoForm] = useState(emptyPagamentoForm)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')

  // ── data ──────────────────────────────────────────────────────────────────

  async function loadData() {
    setLoading(true)
    try {
      const [c, r] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('receitas').select('*').eq('mes_referencia', mesAtual),
      ])
      if (c.error) throw c.error
      if (r.error) throw r.error
      setClientes(c.data ?? [])
      setReceitas(r.data ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── dialog openers ────────────────────────────────────────────────────────

  function openNovo() {
    setEditingCliente(null)
    setForm(emptyForm)
    setClienteDialog(true)
  }

  function openEditar(c: Cliente) {
    setEditingCliente(c)
    setForm({
      nome: c.nome,
      tipo: c.tipo,
      valor_mensalidade: c.valor_mensalidade != null ? String(c.valor_mensalidade) : '',
      dia_pagamento: c.dia_pagamento != null ? String(c.dia_pagamento) : '',
      data_inicio: c.data_inicio ?? '',
      contrato_vigente: c.contrato_vigente,
      vencimento_contrato: c.vencimento_contrato ?? '',
      observacao: c.observacao ?? '',
    })
    setClienteDialog(true)
  }

  function openPagamento(c: Cliente) {
    setSelectedCliente(c)
    setPagamentoForm({
      valor: c.valor_mensalidade != null ? String(c.valor_mensalidade) : '',
      data_pagamento: new Date().toISOString().slice(0, 10),
      observacao: '',
    })
    setPagamentoDialog(true)
  }

  // ── mutations ─────────────────────────────────────────────────────────────

  async function handleSalvar() {
    if (!form.nome.trim()) { toast({ title: 'Nome é obrigatório', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        valor_mensalidade: form.valor_mensalidade ? parseFloat(form.valor_mensalidade) : null,
        dia_pagamento: form.dia_pagamento ? parseInt(form.dia_pagamento) : null,
        data_inicio: form.data_inicio || null,
        contrato_vigente: form.contrato_vigente,
        vencimento_contrato: form.vencimento_contrato || null,
        observacao: form.observacao || null,
      }
      if (editingCliente) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', editingCliente.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clientes').insert({ ...payload, ativo: true })
        if (error) throw error
      }
      toast({ title: 'Salvo!' })
      setClienteDialog(false)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handlePagamento() {
    if (!selectedCliente || !pagamentoForm.data_pagamento) {
      toast({ title: 'Informe a data do pagamento', variant: 'destructive' }); return
    }
    setSaving(true)
    try {
      const existing = receitas.find(
        (r) => r.cliente_id === selectedCliente.id || r.cliente_nome === selectedCliente.nome,
      )
      if (existing) {
        const { error } = await supabase.from('receitas').update({
          status: 'pago',
          data_pagamento: pagamentoForm.data_pagamento,
          valor: parseFloat(pagamentoForm.valor) || existing.valor,
          observacao: pagamentoForm.observacao || existing.observacao,
        }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('receitas').insert({
          cliente_id: selectedCliente.id,
          cliente_nome: selectedCliente.nome,
          mes_referencia: mesAtual,
          valor: parseFloat(pagamentoForm.valor) || 0,
          data_pagamento: pagamentoForm.data_pagamento,
          status: 'pago',
          observacao: pagamentoForm.observacao || null,
        })
        if (error) throw error
      }
      toast({ title: 'Pagamento registrado!' })
      setPagamentoDialog(false)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao registrar', description: err?.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handleInativar() {
    if (!selectedCliente) return
    setSaving(true)
    try {
      const { error } = await supabase.from('clientes').update({ ativo: false }).eq('id', selectedCliente.id)
      if (error) throw error
      toast({ title: 'Cliente inativado' })
      setInativarDialog(false)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao inativar', description: err?.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handleReativar() {
    if (!selectedCliente) return
    setSaving(true)
    try {
      const { error } = await supabase.from('clientes').update({ ativo: true }).eq('id', selectedCliente.id)
      if (error) throw error
      toast({ title: `${selectedCliente.nome} reativado!` })
      setReativarDialog(false)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao reativar', description: err?.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  // ── export ────────────────────────────────────────────────────────────────

  function exportExcel() {
    const rows = clientes.map((c) => ({
      Nome: c.nome,
      Tipo: c.tipo === 'recorrente' ? 'Recorrente' : 'Variável',
      'Valor/mês': c.valor_mensalidade ?? 0,
      'Dia Pagamento': c.dia_pagamento ?? '',
      'Contrato Vigente': c.contrato_vigente ? 'Sim' : 'Não',
      Status: c.ativo ? 'Ativo' : 'Inativo',
      Observação: c.observacao ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, `Clientes_${mesAtual.replace('/', '_')}.xlsx`)
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const filtrar = (list: Cliente[]) =>
    busca.trim()
      ? list.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
      : list

  const ativos      = clientes.filter((c) => c.ativo)
  const inativos    = clientes.filter((c) => !c.ativo)
  const recorrentes = ativos.filter((c) => c.tipo === 'recorrente')
  const variaveis   = ativos.filter((c) => c.tipo === 'variavel')
  const mrr         = recorrentes.reduce((s, c) => s + (c.valor_mensalidade ?? 0), 0)

  const inadimplentes = receitas
    .filter((r) => r.status === 'pendente' || r.status === 'atrasado')
    .map((r) => ({
      receita: r,
      cliente: clientes.find((c) => c.id === r.cliente_id || c.nome === r.cliente_nome),
    }))

  // ── row renderers ─────────────────────────────────────────────────────────

  function AcoesAtivo({ c }: { c: Cliente }) {
    return (
      <div className="flex items-center justify-end gap-1">
        {c.tipo === 'recorrente' && (
          <Button size="sm" variant="outline"
            className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => openPagamento(c)} title="Registrar recebimento">
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Receber
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 px-2"
          onClick={() => openEditar(c)} title="Editar">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline"
          className="h-7 px-2 text-[#EF4343] border-red-200 hover:bg-red-50"
          onClick={() => { setSelectedCliente(c); setInativarDialog(true) }} title="Inativar">
          <UserX className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#273544]">Clientes</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-3.5 w-3.5 mr-1" /> Excel
          </Button>
          <Button onClick={openNovo}>
            <Plus className="h-4 w-4 mr-1" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-[#626F7F] mb-1">MRR</p>
            <p className="font-mono text-xl font-bold text-[#0873F7]">{formatCurrency(mrr)}</p>
            <p className="text-xs text-[#626F7F] mt-0.5">{recorrentes.length} recorrentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-[#626F7F] mb-1">Variáveis Ativos</p>
            <p className="font-mono text-xl font-bold text-[#273544]">{variaveis.length}</p>
            <p className="text-xs text-[#626F7F] mt-0.5">clientes ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-[#626F7F] mb-1">Inadimplentes</p>
            <p className="font-mono text-xl font-bold text-[#EF4343]">{inadimplentes.length}</p>
            <p className="text-xs text-[#626F7F] mt-0.5">em {mesAtual}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-[#626F7F] mb-1">Churn (inativos)</p>
            <p className="font-mono text-xl font-bold text-[#273544]">{inativos.length}</p>
            <p className="text-xs text-[#626F7F] mt-0.5">clientes perdidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Input
          placeholder="Buscar cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-3"
        />
      </div>

      {/* Tabs */}
      <div className="liquid-glass-md rounded-3xl p-5">
        {loading ? (
          <div className="space-y-2 py-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse bg-white/40" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="recorrentes">
            <TabsList>
              <TabsTrigger value="recorrentes">
                Recorrentes ({filtrar(recorrentes).length})
              </TabsTrigger>
              <TabsTrigger value="variaveis">
                Variáveis ({filtrar(variaveis).length})
              </TabsTrigger>
              <TabsTrigger value="inadimplentes">
                Inadimplentes ({inadimplentes.length})
              </TabsTrigger>
              <TabsTrigger value="inativos">
                Inativos ({filtrar(inativos).length})
              </TabsTrigger>
              <TabsTrigger value="todos">
                Todos ({filtrar(clientes).length})
              </TabsTrigger>
            </TabsList>

            {/* ── Recorrentes ── */}
            <TabsContent value="recorrentes" className="mt-4">
              {filtrar(recorrentes).length === 0
                ? <p className="text-sm text-[#626F7F] py-8 text-center">Nenhum cliente recorrente ativo.</p>
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Valor/mês</TableHead>
                        <TableHead>Dia Pag.</TableHead>
                        <TableHead>Status {mesAtual}</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrar(recorrentes).map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-[#273544]">{c.nome}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {c.valor_mensalidade != null ? formatCurrency(c.valor_mensalidade) : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-[#626F7F]">
                            {c.dia_pagamento != null ? `Dia ${c.dia_pagamento}` : '—'}
                          </TableCell>
                          <TableCell>{statusMesBadge(c.id, c.nome, receitas)}</TableCell>
                          <TableCell className="text-right"><AcoesAtivo c={c} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </TabsContent>

            {/* ── Variáveis ── */}
            <TabsContent value="variaveis" className="mt-4">
              {filtrar(variaveis).length === 0
                ? <p className="text-sm text-[#626F7F] py-8 text-center">Nenhum cliente variável ativo.</p>
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrar(variaveis).map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-[#273544]">{c.nome}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {c.valor_mensalidade != null ? formatCurrency(c.valor_mensalidade) : '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              c.contrato_vigente
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-white/40 text-[#626F7F] border-white/50'
                            }`}>
                              {c.contrato_vigente ? 'Vigente' : 'Encerrado'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right"><AcoesAtivo c={c} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </TabsContent>

            {/* ── Inadimplentes ── */}
            <TabsContent value="inadimplentes" className="mt-4">
              {inadimplentes.length === 0
                ? <p className="text-sm text-[#626F7F] py-8 text-center">Nenhum inadimplente em {mesAtual}. Ótimo!</p>
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Atraso</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inadimplentes.map(({ receita, cliente }) => {
                        const nome = cliente?.nome ?? receita.cliente_nome ?? '—'
                        const dias = calcDiasAtraso(cliente?.dia_pagamento ?? null)
                        return (
                          <TableRow key={receita.id}>
                            <TableCell className="font-medium text-[#273544]">{nome}</TableCell>
                            <TableCell>{cliente ? tipoBadge(cliente.tipo) : '—'}</TableCell>
                            <TableCell className="font-mono text-sm">{formatCurrency(receita.valor)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                dias > 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                                {dias > 0 ? `${dias} dias` : 'Pendente'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {cliente && (
                                <Button size="sm" variant="outline"
                                  className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => openPagamento(cliente)}>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Receber
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
            </TabsContent>

            {/* ── Inativos (Churn) ── */}
            <TabsContent value="inativos" className="mt-4">
              {filtrar(inativos).length === 0
                ? <p className="text-sm text-[#626F7F] py-8 text-center">Nenhum cliente inativo.</p>
                : (
                  <>
                    <p className="text-xs text-[#626F7F] mb-3">
                      Clientes que encerraram o relacionamento. Você pode reativá-los a qualquer momento.
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Último valor</TableHead>
                          <TableHead>Observação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtrar(inativos).map((c) => (
                          <TableRow key={c.id} className="opacity-70">
                            <TableCell className="font-medium text-[#273544]">{c.nome}</TableCell>
                            <TableCell>{tipoBadge(c.tipo)}</TableCell>
                            <TableCell className="font-mono text-sm text-[#626F7F]">
                              {c.valor_mensalidade != null ? formatCurrency(c.valor_mensalidade) : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-[#626F7F]">
                              {c.observacao ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="outline"
                                  className="h-7 px-2 text-[#0873F7] border-[#0873F7]/30 hover:bg-[#0873F7]/10"
                                  onClick={() => { setSelectedCliente(c); setReativarDialog(true) }}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reativar
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2"
                                  onClick={() => openEditar(c)}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
            </TabsContent>

            {/* ── Todos ── */}
            <TabsContent value="todos" className="mt-4">
              {filtrar(clientes).length === 0
                ? <p className="text-sm text-[#626F7F] py-8 text-center">Nenhum cliente encontrado.</p>
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrar(clientes).map((c) => (
                        <TableRow key={c.id} className={!c.ativo ? 'opacity-60' : ''}>
                          <TableCell className="font-medium text-[#273544]">{c.nome}</TableCell>
                          <TableCell>{tipoBadge(c.tipo)}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {c.valor_mensalidade != null ? formatCurrency(c.valor_mensalidade) : '—'}
                          </TableCell>
                          <TableCell>
                            {c.ativo
                              ? <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-green-200">Ativo</span>
                              : <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-white/40 text-[#626F7F] border-white/50">Inativo</span>
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {c.ativo
                              ? <AcoesAtivo c={c} />
                              : (
                                <Button size="sm" variant="outline"
                                  className="h-7 px-2 text-[#0873F7] border-[#0873F7]/30 hover:bg-[#0873F7]/10"
                                  onClick={() => { setSelectedCliente(c); setReativarDialog(true) }}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reativar
                                </Button>
                              )
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── Dialog: Add / Edit ── */}
      <Dialog open={clienteDialog} onOpenChange={setClienteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cl-nome">Nome *</Label>
              <Input id="cl-nome" placeholder="Nome do cliente" value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo *</Label>
              <Select value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as 'recorrente' | 'variavel' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recorrente">Recorrente (mensalidade fixa)</SelectItem>
                  <SelectItem value="variavel">Variável (projeto / avulso)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="cl-valor">
                  {form.tipo === 'recorrente' ? 'Mensalidade (R$)' : 'Valor estimado (R$)'}
                </Label>
                <Input id="cl-valor" type="number" min="0" step="0.01" placeholder="0,00"
                  value={form.valor_mensalidade}
                  onChange={(e) => setForm((f) => ({ ...f, valor_mensalidade: e.target.value }))} />
              </div>
              {form.tipo === 'recorrente' && (
                <div className="grid gap-1.5">
                  <Label htmlFor="cl-dia">Dia de Pagamento</Label>
                  <Input id="cl-dia" type="number" min="1" max="31" placeholder="Ex: 5"
                    value={form.dia_pagamento}
                    onChange={(e) => setForm((f) => ({ ...f, dia_pagamento: e.target.value }))} />
                </div>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cl-inicio">Data de Início</Label>
              <Input id="cl-inicio" type="date" value={form.data_inicio}
                onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Contrato</Label>
                <Select value={form.contrato_vigente ? 'vigente' : 'encerrado'}
                  onValueChange={(v) => setForm((f) => ({ ...f, contrato_vigente: v === 'vigente' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cl-vencimento">Vencimento do Contrato</Label>
                <Input id="cl-vencimento" type="date" value={form.vencimento_contrato}
                  onChange={(e) => setForm((f) => ({ ...f, vencimento_contrato: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cl-obs">Observação</Label>
              <Input id="cl-obs" placeholder="Motivo de saída, notas, etc." value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Registrar Pagamento ── */}
      <Dialog open={pagamentoDialog} onOpenChange={setPagamentoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          {selectedCliente && (
            <div className="bg-[#0873F7]/5 border border-[#0873F7]/15 rounded-xl px-4 py-3 mb-2">
              <p className="text-sm font-medium text-[#273544]">{selectedCliente.nome}</p>
              <p className="text-xs text-[#626F7F] mt-0.5">Referência: {mesAtual}</p>
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pag-valor">Valor (R$) *</Label>
              <Input id="pag-valor" type="number" min="0" step="0.01" placeholder="0,00"
                value={pagamentoForm.valor}
                onChange={(e) => setPagamentoForm((f) => ({ ...f, valor: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pag-data">Data do Recebimento *</Label>
              <Input id="pag-data" type="date" value={pagamentoForm.data_pagamento}
                onChange={(e) => setPagamentoForm((f) => ({ ...f, data_pagamento: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pag-obs">Observação</Label>
              <Input id="pag-obs" placeholder="Opcional" value={pagamentoForm.observacao}
                onChange={(e) => setPagamentoForm((f) => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handlePagamento} disabled={saving}>
              {saving ? 'Registrando...' : 'Confirmar Recebimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Inativar ── */}
      <Dialog open={inativarDialog} onOpenChange={setInativarDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inativar Cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#626F7F]">
            Tem certeza que deseja inativar{' '}
            <span className="font-semibold text-[#273544]">{selectedCliente?.nome}</span>?
            O cliente ficará visível na aba <strong>Inativos</strong> e pode ser reativado depois.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleInativar} disabled={saving}>
              {saving ? 'Inativando...' : 'Inativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Reativar ── */}
      <Dialog open={reativarDialog} onOpenChange={setReativarDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reativar Cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#626F7F]">
            Deseja reativar{' '}
            <span className="font-semibold text-[#273544]">{selectedCliente?.nome}</span>?
            O cliente voltará a aparecer nas listas ativas.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleReativar} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {saving ? 'Reativando...' : 'Reativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
