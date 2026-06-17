import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  RefreshCw,
  AlertTriangle,
  UserX,
  Zap,
} from 'lucide-react'
import type { Contrato, Cliente } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function todayPlusMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function diffDays(dateStr: string): number {
  const d = new Date(dateStr + 'T23:59:59')
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

type StatusUI = 'sem_prazo' | 'vencido' | 'vence_7' | 'vence_30' | 'ativo'

function computeStatus(vencimento: string | null): StatusUI {
  if (!vencimento) return 'sem_prazo'
  const days = diffDays(vencimento)
  if (days < 0) return 'vencido'
  if (days <= 7) return 'vence_7'
  if (days <= 30) return 'vence_30'
  return 'ativo'
}

interface StatusBadgeProps {
  vencimento: string | null
}

function StatusBadge({ vencimento }: StatusBadgeProps) {
  const status = computeStatus(vencimento)

  if (status === 'sem_prazo') {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
        Sem prazo
      </span>
    )
  }
  if (status === 'vencido') {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 border-red-200">
        Vencido
      </span>
    )
  }
  const days = diffDays(vencimento!)
  if (status === 'vence_7') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-200">
        <AlertTriangle className="h-3 w-3" />
        Vence em {days}d
      </span>
    )
  }
  if (status === 'vence_30') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200">
        <AlertTriangle className="h-3 w-3" />
        Vence em {days}d
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-green-200">
      Ativo
    </span>
  )
}

// ─── form defaults ────────────────────────────────────────────────────────────

const emptyForm = {
  cliente_id: '',
  cliente_nome: '',
  valor: '',
  data_inicio: today(),
  data_vencimento: todayPlusMonths(12),
  renovacao_automatica: false,
  observacao: '',
}

type FormState = typeof emptyForm

// ─── component ────────────────────────────────────────────────────────────────

export default function Contratos() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoLoading, setAutoLoading] = useState(false)

  const [contratoDialog, setContratoDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)
  const [deletingContrato, setDeletingContrato] = useState<Contrato | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  // ── data loading ─────────────────────────────────────────────────────────

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: cData, error: cErr }, { data: clData, error: clErr }] = await Promise.all([
        supabase.from('contratos').select('*').order('cliente_nome'),
        supabase.from('clientes').select('*').eq('ativo', true).order('nome'),
      ])
      if (cErr) throw cErr
      if (clErr) throw clErr
      setContratos(cData ?? [])
      setClientes(clData ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── derived data ──────────────────────────────────────────────────────────

  const clientesComContrato = new Set(contratos.map((c) => c.cliente_id).filter(Boolean))

  const clientesSemContrato = clientes.filter((cl) => !clientesComContrato.has(cl.id))

  const vencendo30 = contratos.filter((c) => {
    const s = computeStatus(c.data_vencimento)
    return s === 'vence_7' || s === 'vence_30'
  })

  // ── tab filtering ─────────────────────────────────────────────────────────

  function getFilteredContratos(tab: string): Contrato[] {
    if (tab === 'todos') return contratos
    if (tab === 'ativos') {
      return contratos.filter((c) => {
        const s = computeStatus(c.data_vencimento)
        return s === 'ativo' || s === 'sem_prazo'
      })
    }
    if (tab === 'vencendo') {
      return contratos.filter((c) => {
        const s = computeStatus(c.data_vencimento)
        return s === 'vence_7' || s === 'vence_30'
      })
    }
    if (tab === 'vencidos') {
      return contratos.filter((c) => computeStatus(c.data_vencimento) === 'vencido')
    }
    return []
  }

  // ── dialog handlers ───────────────────────────────────────────────────────

  function openNovo(prefill?: { cliente_id: string; cliente_nome: string; valor: number | null }) {
    setEditingContrato(null)
    setForm({
      ...emptyForm,
      data_inicio: today(),
      data_vencimento: todayPlusMonths(12),
      cliente_id: prefill?.cliente_id ?? '',
      cliente_nome: prefill?.cliente_nome ?? '',
      valor: prefill?.valor != null ? String(prefill.valor) : '',
    })
    setContratoDialog(true)
  }

  function openEditar(contrato: Contrato) {
    setEditingContrato(contrato)
    setForm({
      cliente_id: contrato.cliente_id ?? '',
      cliente_nome: contrato.cliente_nome,
      valor: String(contrato.valor),
      data_inicio: contrato.data_inicio,
      data_vencimento: contrato.data_vencimento ?? '',
      renovacao_automatica: contrato.renovacao_automatica,
      observacao: contrato.observacao ?? '',
    })
    setContratoDialog(true)
  }

  function openDelete(contrato: Contrato) {
    setDeletingContrato(contrato)
    setDeleteDialog(true)
  }

  // ── cliente select change ─────────────────────────────────────────────────

  function handleClienteChange(clienteId: string) {
    const cliente = clientes.find((c) => c.id === clienteId)
    setForm((f) => ({
      ...f,
      cliente_id: clienteId,
      cliente_nome: cliente?.nome ?? '',
      valor: cliente?.valor_mensalidade != null ? String(cliente.valor_mensalidade) : f.valor,
    }))
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSalvar() {
    if (!form.cliente_id) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        cliente_id: form.cliente_id || null,
        cliente_nome: form.cliente_nome,
        valor: parseFloat(form.valor) || 0,
        data_inicio: form.data_inicio || today(),
        data_vencimento: form.data_vencimento || null,
        renovacao_automatica: form.renovacao_automatica,
        observacao: form.observacao || null,
        status: 'ativo' as const,
      }

      if (editingContrato) {
        const { error } = await supabase
          .from('contratos')
          .update(payload)
          .eq('id', editingContrato.id)
        if (error) throw error

        // Check if should create alert
        if (form.data_vencimento) {
          const days = diffDays(form.data_vencimento)
          if (days >= 0 && days <= 30) {
            await supabase.from('alertas').insert({
              tipo: 'contrato_vencendo',
              titulo: 'Contrato vencendo: ' + form.cliente_nome,
              prioridade: days <= 7 ? 'alta' : 'media',
              status: 'ativo',
              origem_tabela: 'contratos',
              origem_id: editingContrato.id,
            })
          }
        }
      } else {
        const { data: inserted, error } = await supabase
          .from('contratos')
          .insert(payload)
          .select()
          .single()
        if (error) throw error

        // Create alert if vencimento within 30 days
        if (form.data_vencimento && inserted) {
          const days = diffDays(form.data_vencimento)
          if (days >= 0 && days <= 30) {
            await supabase.from('alertas').insert({
              tipo: 'contrato_vencendo',
              titulo: 'Contrato vencendo: ' + form.cliente_nome,
              prioridade: days <= 7 ? 'alta' : 'media',
              status: 'ativo',
              origem_tabela: 'contratos',
              origem_id: inserted.id,
            })
          }
        }
      }

      toast({ title: 'Salvo!' })
      setContratoDialog(false)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deletingContrato) return
    setSaving(true)
    try {
      const { error } = await supabase.from('contratos').delete().eq('id', deletingContrato.id)
      if (error) throw error
      toast({ title: 'Contrato excluído' })
      setDeleteDialog(false)
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err?.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ── auto-populate ─────────────────────────────────────────────────────────

  async function handleCriarAutomatico() {
    if (clientesSemContrato.length === 0) {
      toast({ title: 'Todos os clientes já possuem contrato' })
      return
    }
    setAutoLoading(true)
    try {
      const dataInicio = today()
      const dataVencimento = todayPlusMonths(12)

      const inserts = clientesSemContrato.map((cl) => ({
        cliente_id: cl.id,
        cliente_nome: cl.nome,
        valor: cl.valor_mensalidade ?? 0,
        data_inicio: dataInicio,
        data_vencimento: dataVencimento,
        status: 'ativo' as const,
        renovacao_automatica: false,
      }))

      const { error } = await supabase.from('contratos').insert(inserts)
      if (error) throw error

      toast({ title: `${inserts.length} contrato(s) criado(s)` })
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao criar contratos', description: err?.message, variant: 'destructive' })
    } finally {
      setAutoLoading(false)
    }
  }

  // ── skeleton ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-9 w-36 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="liquid-glass-md rounded-3xl p-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-[#273544]">Contratos</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {clientesSemContrato.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCriarAutomatico}
              disabled={autoLoading}
              className="text-[#626F7F]"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              {autoLoading ? 'Criando...' : 'Criar Contratos Automaticamente'}
            </Button>
          )}
          <Button onClick={() => openNovo()}>
            <Plus className="h-4 w-4 mr-1" /> Novo Contrato
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] mb-1">Total Contratos</p>
          <p className="text-2xl font-bold text-[#273544] font-mono">{contratos.length}</p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] mb-1">Vencendo em 30d</p>
          <p className="text-2xl font-bold text-[#f59e0b] font-mono">{vencendo30.length}</p>
        </div>
        <div className="liquid-glass-md rounded-3xl p-4">
          <p className="text-xs text-[#626F7F] mb-1">Sem Contrato</p>
          <p className="text-2xl font-bold text-[#EF4343] font-mono">{clientesSemContrato.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <Tabs defaultValue="todos">
          <TabsList>
            <TabsTrigger value="todos">Todos ({contratos.length})</TabsTrigger>
            <TabsTrigger value="ativos">
              Ativos ({getFilteredContratos('ativos').length})
            </TabsTrigger>
            <TabsTrigger value="vencendo">
              Vencendo Este Mês ({vencendo30.length})
            </TabsTrigger>
            <TabsTrigger value="vencidos">
              Vencidos ({getFilteredContratos('vencidos').length})
            </TabsTrigger>
            <TabsTrigger value="sem_contrato">
              Sem Contrato ({clientesSemContrato.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Tabs: Todos / Ativos / Vencendo / Vencidos ── */}
          {(['todos', 'ativos', 'vencendo', 'vencidos'] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <ContratoTable
                contratos={getFilteredContratos(tab)}
                onEdit={openEditar}
                onDelete={openDelete}
              />
            </TabsContent>
          ))}

          {/* ── Tab: Sem Contrato ── */}
          <TabsContent value="sem_contrato" className="mt-4">
            {clientesSemContrato.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#94a3b8]">
                <FileText className="h-8 w-8" />
                <p className="text-sm">Todos os clientes ativos possuem contrato.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor/mês</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesSemContrato.map((cl) => (
                      <TableRow key={cl.id}>
                        <TableCell className="font-medium text-[#273544]">{cl.nome}</TableCell>
                        <TableCell className="text-sm text-[#626F7F] capitalize">{cl.tipo}</TableCell>
                        <TableCell className="font-mono text-sm text-[#626F7F]">
                          {cl.valor_mensalidade != null ? formatCurrency(cl.valor_mensalidade) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[#0873F7] border-[#0873F7]/30 hover:bg-white/30"
                            onClick={() =>
                              openNovo({
                                cliente_id: cl.id,
                                cliente_nome: cl.nome,
                                valor: cl.valor_mensalidade,
                              })
                            }
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Criar Contrato
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialog: Novo / Editar Contrato ── */}
      <Dialog open={contratoDialog} onOpenChange={setContratoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContrato ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Cliente */}
            <div className="grid gap-1.5">
              <Label>Cliente *</Label>
              <Select
                value={form.cliente_id}
                onValueChange={handleClienteChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cl) => (
                    <SelectItem key={cl.id} value={cl.id}>
                      {cl.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="grid gap-1.5">
              <Label htmlFor="ct-valor">Valor/mês (R$)</Label>
              <Input
                id="ct-valor"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ct-inicio">Data de Início</Label>
                <Input
                  id="ct-inicio"
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ct-vencimento">Data de Vencimento</Label>
                <Input
                  id="ct-vencimento"
                  type="date"
                  value={form.data_vencimento}
                  onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))}
                />
              </div>
            </div>

            {/* Renovação automática */}
            <div className="flex items-center gap-2">
              <input
                id="ct-renovacao"
                type="checkbox"
                className="h-4 w-4 rounded border-[rgba(255,255,255,0.45)] accent-[#0873F7]"
                checked={form.renovacao_automatica}
                onChange={(e) => setForm((f) => ({ ...f, renovacao_automatica: e.target.checked }))}
              />
              <Label htmlFor="ct-renovacao" className="cursor-pointer font-normal">
                Renovação automática
              </Label>
            </div>

            {/* Observação */}
            <div className="grid gap-1.5">
              <Label htmlFor="ct-obs">Observação</Label>
              <textarea
                id="ct-obs"
                rows={3}
                placeholder="Opcional"
                className="flex w-full rounded-lg border border-[rgba(255,255,255,0.45)] bg-white/60 px-3 py-2 text-sm text-[#273544] placeholder:text-[#626F7F]/60 focus:outline-none focus:ring-2 focus:ring-[#0873F7]/30 focus:border-[#0873F7] transition-colors resize-none"
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleSalvar} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmação de exclusão ── */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Contrato</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#626F7F]">
            Deseja excluir o contrato de{' '}
            <span className="font-semibold text-[#273544]">{deletingContrato?.cliente_nome}</span>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── sub-component: table ─────────────────────────────────────────────────────

interface ContratoTableProps {
  contratos: Contrato[]
  onEdit: (c: Contrato) => void
  onDelete: (c: Contrato) => void
}

function ContratoTable({ contratos, onEdit, onDelete }: ContratoTableProps) {
  if (contratos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#94a3b8]">
        <FileText className="h-8 w-8" />
        <p className="text-sm">Nenhum contrato encontrado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Valor/mês</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Renovação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contratos.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-[#273544] whitespace-nowrap">
                {c.cliente_nome}
              </TableCell>
              <TableCell className="font-mono text-sm text-[#626F7F] whitespace-nowrap">
                {formatCurrency(c.valor)}
              </TableCell>
              <TableCell className="text-sm text-[#626F7F] whitespace-nowrap">
                {formatDate(c.data_inicio)}
              </TableCell>
              <TableCell className="text-sm text-[#626F7F] whitespace-nowrap">
                {c.data_vencimento ? formatDate(c.data_vencimento) : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <StatusBadge vencimento={c.data_vencimento} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {c.renovacao_automatica ? (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                    <RefreshCw className="h-3 w-3" />
                    Auto
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 border-gray-200">
                    Manual
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    onClick={() => onEdit(c)}
                    title="Editar contrato"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[#EF4343] border-red-200 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDelete(c)}
                    title="Excluir contrato"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
