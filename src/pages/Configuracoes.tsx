import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMesAtual } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Save, Edit2, Trash2, Plus, Wifi, WifiOff, RefreshCw, Eye, EyeOff, Zap } from 'lucide-react'
import { asaas, ASAAS_KEY_MASKED, ASAAS_ENV } from '@/lib/asaas'
import type { Empresa, Socio, CategoriaDespesa } from '@/types'

const regimes = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']

export default function Configuracoes() {

  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [socios, setSocios] = useState<Socio[]>([])
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([])
  const [loading, setLoading] = useState(true)

  // Empresa form
  const [empresaForm, setEmpresaForm] = useState({
    nome: '',
    cnpj: '',
    regime_tributario: 'Simples Nacional',
    aliquota_simples: '',
    caixa_reserva: '',
  })

  // Socio dialog
  const [socioDialog, setSocioDialog] = useState(false)
  const [editingSocioId, setEditingSocioId] = useState<string | null>(null)
  const [socioForm, setSocioForm] = useState({
    nome: '',
    cargo: '',
    percentual: '',
    prolabore: '',
    ativo: true,
    participa_distribuicao: true,
  })

  // Asaas
  const [asaasTesting, setAsaasTesting] = useState(false)
  const [asaasResult, setAsaasResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [asaasSyncing, setAsaasSyncing] = useState(false)
  const [keyVisible, setKeyVisible] = useState(false)

  // Categoria dialog
  const [catDialog, setCatDialog] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [catForm, setCatForm] = useState({
    nome: '',
    tipo: 'operacional',
    cor: '#0873F7',
  })

  async function fetchAll() {
    setLoading(true)
    try {
      const [{ data: emp }, { data: soc }, { data: cat }] = await Promise.all([
        supabase.from('empresa').select('*').limit(1).single(),
        supabase.from('socios').select('*').order('nome'),
        supabase.from('categorias_despesa').select('*').order('nome'),
      ])
      if (emp) {
        setEmpresa(emp)
        setEmpresaForm({
          nome: emp.nome ?? '',
          cnpj: emp.cnpj ?? '',
          regime_tributario: emp.regime_tributario ?? 'Simples Nacional',
          aliquota_simples: String(emp.aliquota_simples ?? ''),
          caixa_reserva: String(emp.caixa_reserva ?? ''),
        })
      }
      setSocios(soc ?? [])
      setCategorias(cat ?? [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err?.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Save empresa
  async function saveEmpresa(e: React.FormEvent) {
    e.preventDefault()
    if (!empresa) return
    const payload = {
      nome: empresaForm.nome,
      cnpj: empresaForm.cnpj || null,
      regime_tributario: empresaForm.regime_tributario,
      aliquota_simples: parseFloat(empresaForm.aliquota_simples) || 0,
      caixa_reserva: parseFloat(empresaForm.caixa_reserva) || 0,
    }
    try {
      const { error } = await supabase.from('empresa').update(payload).eq('id', empresa.id)
      if (error) throw error
      toast({ title: 'Dados da empresa salvos' })
      fetchAll()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' })
    }
  }

  // Socio handlers
  function openAddSocio() {
    setEditingSocioId(null)
    setSocioForm({ nome: '', cargo: '', percentual: '', prolabore: '', ativo: true, participa_distribuicao: true })
    setSocioDialog(true)
  }

  function openEditSocio(s: Socio) {
    setEditingSocioId(s.id)
    setSocioForm({
      nome: s.nome,
      cargo: s.cargo ?? '',
      percentual: String(s.percentual),
      prolabore: String(s.prolabore),
      ativo: s.ativo,
      participa_distribuicao: s.participa_distribuicao ?? true,
    })
    setSocioDialog(true)
  }

  async function saveSocio(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      nome: socioForm.nome,
      cargo: socioForm.cargo || null,
      percentual: parseFloat(socioForm.percentual) || 0,
      prolabore: parseFloat(socioForm.prolabore) || 0,
      ativo: socioForm.ativo,
      participa_distribuicao: socioForm.participa_distribuicao,
    }
    try {
      if (editingSocioId) {
        const { error } = await supabase.from('socios').update(payload).eq('id', editingSocioId)
        if (error) throw error
        toast({ title: 'Sócio atualizado' })
      } else {
        const { error } = await supabase.from('socios').insert(payload)
        if (error) throw error
        toast({ title: 'Sócio adicionado' })
      }
      setSocioDialog(false)
      fetchAll()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' })
    }
  }

  async function toggleSocioAtivo(s: Socio) {
    try {
      const { error } = await supabase.from('socios').update({ ativo: !s.ativo }).eq('id', s.id)
      if (error) throw error
      fetchAll()
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar sócio', description: err?.message, variant: 'destructive' })
    }
  }

  // Categoria handlers
  function openAddCat() {
    setEditingCatId(null)
    setCatForm({ nome: '', tipo: 'operacional', cor: '#0873F7' })
    setCatDialog(true)
  }

  function openEditCat(c: CategoriaDespesa) {
    setEditingCatId(c.id)
    setCatForm({ nome: c.nome, tipo: c.tipo, cor: c.cor })
    setCatDialog(true)
  }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingCatId) {
        const { error } = await supabase.from('categorias_despesa').update(catForm).eq('id', editingCatId)
        if (error) throw error
        toast({ title: 'Categoria atualizada' })
      } else {
        const { error } = await supabase.from('categorias_despesa').insert(catForm)
        if (error) throw error
        toast({ title: 'Categoria adicionada' })
      }
      setCatDialog(false)
      fetchAll()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' })
    }
  }

  async function deleteCat(id: string) {
    if (!confirm('Excluir esta categoria? Esta ação não pode ser desfeita.')) return
    try {
      const { error } = await supabase.from('categorias_despesa').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Categoria excluída' })
      fetchAll()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err?.message, variant: 'destructive' })
    }
  }

  async function testAsaasConnection() {
    setAsaasTesting(true)
    setAsaasResult(null)
    try {
      const account = await asaas.getMyAccount()
      const name = account?.name ?? account?.tradingName ?? 'Conta verificada'
      setAsaasResult({ ok: true, msg: name })
    } catch (e: any) {
      setAsaasResult({ ok: false, msg: e.message ?? 'Erro de conexão' })
    } finally {
      setAsaasTesting(false)
    }
  }

  async function syncAsaasPayments() {
    setAsaasSyncing(true)
    try {
      const res = await asaas.getReceivedThisMonth()
      const payments = (res as any)?.data ?? []
      let updated = 0

      for (const p of payments) {
        const { data: matches } = await supabase
          .from('receitas')
          .select('id, valor')
          .eq('status', 'pendente')
          .eq('mes_referencia', getMesAtual())

        const match = (matches ?? []).find(
          (r: any) => Math.abs(r.valor - p.value) / Math.max(r.valor, 0.01) < 0.05
        )
        if (match) {
          await supabase.from('receitas').update({
            status: 'pago',
            data_pagamento: p.paymentDate ?? new Date().toISOString().split('T')[0],
          }).eq('id', match.id)
          updated++
        }
      }

      toast({
        title: `${updated} receita${updated !== 1 ? 's' : ''} conciliada${updated !== 1 ? 's' : ''}`,
        description: `${payments.length} pagamentos verificados`,
      })
    } catch (e: any) {
      toast({ title: 'Erro na sincronização', description: e.message, variant: 'destructive' })
    } finally {
      setAsaasSyncing(false)
    }
  }

  const sociosSum = socios.reduce((s, x) => s + x.percentual, 0)

  function tipoBadge(tipo: string) {
    const map: Record<string, string> = {
      operacional: 'bg-blue-100 text-blue-700',
      financeiro: 'bg-purple-100 text-purple-700',
      imposto: 'bg-red-100 text-red-700',
      folha: 'bg-green-100 text-green-700',
    }
    return map[tipo] ?? 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-[900px] mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="liquid-glass-md rounded-3xl p-5">
            <div className="h-5 w-48 rounded animate-pulse bg-[#f1f5f9] mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-10 rounded animate-pulse bg-[#f1f5f9]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[900px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#273544]">Configurações</h1>
        <p className="text-sm text-[#626F7F]">Empresa, sócios e categorias de despesa</p>
      </div>

      {/* EMPRESA */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <h3 className="font-semibold text-[#273544] mb-4 flex items-center gap-2">
          <Save className="h-4 w-4 text-[#0873F7]" /> Empresa
        </h3>
        <form onSubmit={saveEmpresa} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={empresaForm.nome}
              onChange={e => setEmpresaForm(f => ({ ...f, nome: e.target.value }))}
            />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input
              value={empresaForm.cnpj}
              onChange={e => setEmpresaForm(f => ({ ...f, cnpj: e.target.value }))}
              placeholder="XX.XXX.XXX/XXXX-XX"
            />
          </div>
          <div>
            <Label>Regime Tributário</Label>
            <Select
              value={empresaForm.regime_tributario}
              onValueChange={v => setEmpresaForm(f => ({ ...f, regime_tributario: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {regimes.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Alíquota Simples (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={empresaForm.aliquota_simples}
                onChange={e => setEmpresaForm(f => ({ ...f, aliquota_simples: e.target.value }))}
              />
              <span className="text-[#626F7F] text-sm">%</span>
            </div>
          </div>
          <div>
            <Label>Reserva de Caixa</Label>
            <div className="flex items-center gap-2">
              <span className="text-[#626F7F] text-sm">R$</span>
              <Input
                type="number"
                value={empresaForm.caixa_reserva}
                onChange={e => setEmpresaForm(f => ({ ...f, caixa_reserva: e.target.value }))}
              />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar Empresa
            </Button>
          </div>
        </form>
      </div>

      {/* SOCIOS */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#273544]">Sócios</h3>
          <Button onClick={openAddSocio} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar Sócio
          </Button>
        </div>

        {Math.abs(sociosSum - 100) > 0.01 && socios.length > 0 && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            Percentuais somam {sociosSum.toFixed(1)}% — deve ser 100%
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/20">
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Pró-labore</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Distribuição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#626F7F] text-sm py-8">
                    Nenhum sócio cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                socios.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-[#273544]">{s.nome}</TableCell>
                    <TableCell className="text-sm text-[#626F7F]">{s.cargo ?? '—'}</TableCell>
                    <TableCell className="font-mono text-[#273544]">{formatCurrency(s.prolabore)}</TableCell>
                    <TableCell className="font-mono text-[#273544]">{s.percentual}%</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.participa_distribuicao !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.participa_distribuicao !== false ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditSocio(s)}
                          className="p-1.5 rounded hover:bg-white/30 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#626F7F]" />
                        </button>
                        <button
                          onClick={() => toggleSocioAtivo(s)}
                          className={`text-xs px-2 py-1 rounded transition-colors font-medium ${
                            s.ativo
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {s.ativo ? 'Inativar' : 'Ativar'}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CATEGORIAS */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#273544]">Categorias de Despesa</h3>
          <Button onClick={openAddCat} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar Categoria
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/20">
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[#626F7F] text-sm py-8">
                    Nenhuma categoria cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                categorias.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium text-[#273544]">{cat.nome}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadge(cat.tipo)}`}>
                        {cat.tipo}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-full border border-[rgba(255,255,255,0.45)]"
                        style={{ backgroundColor: cat.cor }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCat(cat)}
                          className="p-1.5 rounded hover:bg-white/30 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#626F7F]" />
                        </button>
                        <button
                          onClick={() => deleteCat(cat.id)}
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
      </div>

      {/* SISTEMA */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <h3 className="font-semibold text-[#273544] mb-3">Sistema</h3>
        <div className="space-y-1 text-sm text-[#626F7F]">
          <p>Versão: 1.0.0</p>
          <p>Mês atual: {getMesAtual()}</p>
          <p>Banco de dados: Supabase</p>
          <p>
            Suporte:{' '}
            <a href="mailto:italo@upbr.digital" className="text-[#0873F7] hover:underline">
              italo@upbr.digital
            </a>
          </p>
        </div>
      </div>

      {/* ASAAS */}
      <div className="liquid-glass-md rounded-3xl p-5">
        <h3 className="font-semibold text-[#273544] mb-1 flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#0873F7]" /> Integração Asaas
        </h3>
        <p className="text-xs text-[#626F7F] mb-4">Cobrança e conciliação automática de pagamentos</p>

        <div className="space-y-4">
          {/* Env badge */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${
              ASAAS_ENV === 'production'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {ASAAS_ENV === 'production' ? 'Produção' : 'Sandbox'}
            </span>
            <span className="text-xs text-[#626F7F]">
              {ASAAS_ENV === 'production' ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3'}
            </span>
          </div>

          {/* API Key display */}
          <div>
            <Label className="mb-1.5 block">API Key</Label>
            <div className="flex items-center gap-2">
              <input
                type={keyVisible ? 'text' : 'password'}
                readOnly
                value={ASAAS_KEY_MASKED || 'Não configurada — adicione VITE_ASAAS_API_KEY no .env.local'}
                className="flex-1 h-10 rounded-xl px-3 py-2 bg-white/55 border border-white/50 text-sm text-[#273544] font-mono backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setKeyVisible(v => !v)}
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/40 transition-colors text-[#626F7F]"
              >
                {keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Result */}
          {asaasResult && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
              asaasResult.ok
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-[#EF4343] border border-red-200'
            }`}>
              {asaasResult.ok ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
              <span>{asaasResult.ok ? `Conectado — ${asaasResult.msg}` : asaasResult.msg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={testAsaasConnection}
              disabled={asaasTesting}
              className="gap-1.5"
            >
              {asaasTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
              {asaasTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={syncAsaasPayments}
              disabled={asaasSyncing}
              className="gap-1.5"
            >
              {asaasSyncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {asaasSyncing ? 'Sincronizando...' : 'Sincronizar Pagamentos'}
            </Button>
          </div>
        </div>
      </div>

      {/* Socio Dialog */}
      <Dialog open={socioDialog} onOpenChange={setSocioDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSocioId ? 'Editar Sócio' : 'Adicionar Sócio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveSocio} className="space-y-4 pt-1">
            <div>
              <Label>Nome</Label>
              <Input
                value={socioForm.nome}
                onChange={e => setSocioForm(f => ({ ...f, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input
                value={socioForm.cargo}
                onChange={e => setSocioForm(f => ({ ...f, cargo: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Percentual (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={socioForm.percentual}
                  onChange={e => setSocioForm(f => ({ ...f, percentual: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Pró-labore (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={socioForm.prolabore}
                  onChange={e => setSocioForm(f => ({ ...f, prolabore: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="socio-ativo"
                checked={socioForm.ativo}
                onChange={e => setSocioForm(f => ({ ...f, ativo: e.target.checked }))}
                className="rounded border-[rgba(255,255,255,0.45)] accent-[#0873F7]"
              />
              <Label htmlFor="socio-ativo" className="cursor-pointer">Sócio ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="socio-distribuicao"
                checked={socioForm.participa_distribuicao}
                onChange={e => setSocioForm(f => ({ ...f, participa_distribuicao: e.target.checked }))}
                className="rounded border-[rgba(255,255,255,0.45)] accent-[#0873F7]"
              />
              <Label htmlFor="socio-distribuicao" className="cursor-pointer">
                Participa da distribuição de lucro
              </Label>
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">{editingSocioId ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categoria Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCatId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCat} className="space-y-4 pt-1">
            <div>
              <Label>Nome</Label>
              <Input
                value={catForm.nome}
                onChange={e => setCatForm(f => ({ ...f, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={catForm.tipo} onValueChange={v => setCatForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="imposto">Imposto</SelectItem>
                  <SelectItem value="folha">Folha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={catForm.cor}
                  onChange={e => setCatForm(f => ({ ...f, cor: e.target.value }))}
                  className="h-9 w-16 rounded border border-[rgba(255,255,255,0.45)] cursor-pointer"
                />
                <span className="text-sm font-mono text-[#626F7F]">{catForm.cor}</span>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">{editingCatId ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
