import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  getMesAtual,
  getMesesAnteriores,
  statusBadgeClass,
  statusLabel,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingDown,
  Users,
  AlertCircle,
  RefreshCw,
  Plus,
  CalendarPlus,
  CheckCircle2,
  Landmark,
  FileSignature,
} from 'lucide-react'
import type {
  Receita,
  Despesa,
  FolhaPagamento,
  Imposto,
  Cliente,
  DreMensal,
  Empresa,
  ContaBancaria,
  Contrato,
} from '@/types'

// ─── constants ───────────────────────────────────────────────────────────────

const mesAtual = getMesAtual()
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const PIE_COLORS = ['#0873F7', '#8b5cf6', '#f59e0b', '#EF4343', '#22c55e', '#06b6d4']

function getNextMes(current: string): string {
  const [m, y] = current.split('/')
  const idx = MESES.indexOf(m)
  return idx === 11 ? `Jan/${parseInt(y) + 1}` : `${MESES[idx + 1]}/${y}`
}

function getPrevMes(current: string): string {
  const [m, y] = current.split('/')
  const idx = MESES.indexOf(m)
  return idx === 0 ? `Dez/${parseInt(y) - 1}` : `${MESES[idx - 1]}/${y}`
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  // data
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [folha, setFolha] = useState<FolhaPagamento[]>([])
  const [impostos, setImpostos] = useState<Imposto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [dreHistory, setDreHistory] = useState<DreMensal[]>([])
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [dreMesAtual, setDreMesAtual] = useState<DreMensal | null>(null)
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])

  // loading / error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // abrir mês dialog
  const [abrirDialog, setAbrirDialog] = useState(false)
  const [abrirLoading, setAbrirLoading] = useState(false)
  const [dialogCounts, setDialogCounts] = useState<{
    despesas: number
    funcionarios: number
    clientes: number
  } | null>(null)
  const [dialogCountsLoading, setDialogCountsLoading] = useState(false)

  // receita variável quick-entry
  const [rvDialog, setRvDialog] = useState(false)
  const [rvForm, setRvForm] = useState({ cliente_id: '', valor: '', observacao: '' })
  const [rvSaving, setRvSaving] = useState(false)

  // ── data loading ─────────────────────────────────────────────────────────

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [dreAtualRes, empRes, clientesRes, dreHistRes, contasRes, contratosRes] = await Promise.all([
        supabase
          .from('dre_mensal')
          .select('*')
          .eq('mes_referencia', mesAtual)
          .maybeSingle(),
        supabase.from('empresa').select('*').limit(1).maybeSingle(),
        supabase.from('clientes').select('*').eq('ativo', true),
        supabase
          .from('dre_mensal')
          .select('*')
          .in('mes_referencia', getMesesAnteriores(6))
          .order('criado_em', { ascending: true }),
        supabase.from('contas_bancarias').select('*'),
        supabase.from('contratos').select('*').eq('status', 'ativo'),
      ])

      setEmpresa(empRes.data ?? null)
      setClientes(clientesRes.data ?? [])
      setDreHistory(dreHistRes.data ?? [])
      setDreMesAtual(dreAtualRes.data ?? null)
      setContasBancarias(contasRes.data ?? [])
      setContratos(contratosRes.data ?? [])

      // Fetch operational data for current month (even if dre_mensal doesn't exist yet)
      const [r, d, f, i] = await Promise.all([
        supabase.from('receitas').select('*').eq('mes_referencia', mesAtual),
        supabase.from('despesas').select('*').eq('mes_referencia', mesAtual),
        supabase.from('folha_pagamento').select('*').eq('mes_referencia', mesAtual),
        supabase.from('impostos').select('*').eq('mes_referencia', mesAtual),
      ])

      setReceitas(r.data ?? [])
      setDespesas(d.data ?? [])
      setFolha(f.data ?? [])
      setImpostos(i.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── "Abrir Mês" dialog — pre-load counts ─────────────────────────────────

  async function openAbrirDialog() {
    setAbrirDialog(true)
    setDialogCounts(null)
    setDialogCountsLoading(true)
    try {
      const prevMes = getPrevMes(mesAtual)
      const [dRes, fRes, cRes] = await Promise.all([
        supabase
          .from('despesas')
          .select('id', { count: 'exact', head: true })
          .eq('recorrente', true),
        supabase
          .from('folha_pagamento')
          .select('id', { count: 'exact', head: true })
          .eq('mes_referencia', prevMes),
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('ativo', true),
      ])
      setDialogCounts({
        despesas: dRes.count ?? 0,
        funcionarios: fRes.count ?? 0,
        clientes: cRes.count ?? 0,
      })
    } catch {
      setDialogCounts({ despesas: 0, funcionarios: 0, clientes: 0 })
    } finally {
      setDialogCountsLoading(false)
    }
  }

  // ── "Abrir Mês" workflow ──────────────────────────────────────────────────

  async function handleAbrirMes() {
    setAbrirLoading(true)
    try {
      const novoMes = mesAtual
      const prevMes = getPrevMes(novoMes)

      // 1. Create dre_mensal entry
      const { error: dreErr } = await supabase.from('dre_mensal').insert({
        mes_referencia: novoMes,
        caixa_reserva: empresa?.caixa_reserva ?? 4000,
        status: 'aberto',
      })
      // 23505 = unique_violation — month already opened, safe to continue
      if (dreErr && dreErr.code !== '23505') throw dreErr

      // 2. Copy ALL recurring despesas
      const { data: recorrentes, error: despErr } = await supabase
        .from('despesas')
        .select('*')
        .eq('recorrente', true)
      if (despErr) throw despErr

      if (recorrentes && recorrentes.length > 0) {
        const { error: insDesp } = await supabase.from('despesas').insert(
          recorrentes.map((d) => ({
            descricao: d.descricao,
            valor: d.valor,
            categoria_nome: d.categoria_nome,
            categoria_tipo: d.categoria_tipo,
            recorrente: true,
            mes_referencia: novoMes,
            status: 'pendente',
            forma_pagamento: d.forma_pagamento ?? null,
            observacao: null,
          }))
        )
        if (insDesp) throw insDesp  // insDesp is already the error object from destructuring
      }

      // 3. Copy payroll from previous month
      const { data: folhaAnterior, error: folhaErr } = await supabase
        .from('folha_pagamento')
        .select('*')
        .eq('mes_referencia', prevMes)
      if (folhaErr) throw folhaErr

      if (folhaAnterior && folhaAnterior.length > 0) {
        const { error: insFolha } = await supabase.from('folha_pagamento').insert(
          folhaAnterior.map((f) => ({
            funcionario: f.funcionario,
            cargo: f.cargo,
            salario: f.salario,
            tipo: f.tipo,
            mes_referencia: novoMes,
            status: 'pendente',
          }))
        )
        if (insFolha) throw insFolha
      }

      // 4. Create receitas for ALL active clientes
      const { data: clientesAtivos, error: cliErr } = await supabase
        .from('clientes')
        .select('*')
        .eq('ativo', true)
      if (cliErr) throw cliErr

      if (clientesAtivos && clientesAtivos.length > 0) {
        const { error: insRec } = await supabase.from('receitas').insert(
          clientesAtivos
            .filter((c) => c.valor_mensalidade != null && c.valor_mensalidade > 0)
            .map((c) => ({
              cliente_id: c.id,
              cliente_nome: c.nome,
              mes_referencia: novoMes,
              valor: c.valor_mensalidade,
              status: 'pendente',
              data_pagamento: null,
              observacao: null,
            }))
        )
        if (insRec) throw insRec
      }

      // 5. Create DAS estimate entry
      const { error: insImp } = await supabase.from('impostos').insert({
        tipo: 'DAS',
        descricao: 'Simples Nacional (estimado)',
        valor: 0,
        mes_referencia: novoMes,
        competencia: prevMes,
        status: 'pendente',
      })
      if (insImp) throw insImp

      toast({
        title: `${novoMes} aberto com sucesso`,
        description: `${recorrentes?.length ?? 0} despesas, ${folhaAnterior?.length ?? 0} funcionários e ${clientesAtivos?.filter(c => c.valor_mensalidade && c.valor_mensalidade > 0).length ?? 0} receitas geradas.`,
      })

      setAbrirDialog(false)
      await loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao abrir mês',
        description: err?.message ?? 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setAbrirLoading(false)
    }
  }

  // ── Receita Variável quick-entry ──────────────────────────────────────────

  async function handleReceitaVariavel() {
    if (!rvForm.cliente_id || !rvForm.valor) {
      toast({ title: 'Preencha cliente e valor', variant: 'destructive' })
      return
    }
    setRvSaving(true)
    try {
      const cliente = clientes.find((c) => c.id === rvForm.cliente_id)
      const { error } = await supabase.from('receitas').insert({
        cliente_id: rvForm.cliente_id,
        cliente_nome: cliente?.nome ?? '',
        mes_referencia: mesAtual,
        valor: parseFloat(rvForm.valor),
        status: 'pendente',
        observacao: rvForm.observacao || null,
        data_pagamento: null,
      })
      if (error) throw error
      toast({ title: 'Receita variável lançada' })
      setRvDialog(false)
      setRvForm({ cliente_id: '', valor: '', observacao: '' })
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao lançar receita', description: err?.message, variant: 'destructive' })
    } finally {
      setRvSaving(false)
    }
  }

  // ── derived values ────────────────────────────────────────────────────────

  const caixaReserva = empresa?.caixa_reserva ?? 4000
  const receitaTotal = receitas.reduce((s, r) => s + r.valor, 0)
  const totalFolha = folha.reduce((s, f) => s + f.salario, 0)
  const totalImpostos = impostos.reduce((s, i) => s + i.valor, 0)
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0)
  const despesaTotal = totalDespesas + totalFolha + totalImpostos
  const lucroLiquido = receitaTotal - despesaTotal - caixaReserva
  const mrr = clientes
    .filter((c) => c.tipo === 'recorrente')
    .reduce((s, c) => s + (c.valor_mensalidade ?? 0), 0)

  // Line chart — last 6 months chronological
  const ultimos6 = getMesesAnteriores(6)
  const chartData = ultimos6.map((mes) => {
    const dre = dreHistory.find((d) => d.mes_referencia === mes)
    return {
      mes: mes.split('/')[0],
      receita: dre?.receita_total ?? 0,
      despesa: dre?.despesa_total ?? 0,
    }
  })

  // Pie chart — despesas grouped by categoria + folha + impostos
  const catMap = new Map<string, number>()
  despesas.forEach((d) => {
    const key = d.categoria_nome ?? 'Outros'
    catMap.set(key, (catMap.get(key) ?? 0) + d.valor)
  })
  const pieData = [
    ...Array.from(catMap.entries()).map(([name, value]) => ({ name, value })),
    ...(totalFolha > 0 ? [{ name: 'Folha', value: totalFolha }] : []),
    ...(totalImpostos > 0 ? [{ name: 'Impostos', value: totalImpostos }] : []),
  ].filter((d) => d.value > 0)

  // Clientes em atraso — pendente AND past their payment day
  const todayDay = new Date().getDate()
  const clientesAtrasados = receitas.filter((r) => {
    if (r.status !== 'pendente') return false
    const cli = clientes.find((c) => c.id === r.cliente_id || c.nome === r.cliente_nome)
    if (!cli?.dia_pagamento) return false
    return cli.dia_pagamento < todayDay
  })

  // Vencimentos próximos 7 dias
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in7 = new Date(today)
  in7.setDate(today.getDate() + 7)

  function withinRange(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false
    const d = new Date(dateStr + 'T12:00:00')
    return d >= today && d <= in7
  }

  const vencDespesas = despesas.filter(
    (d) => d.status !== 'pago' && withinRange(d.data_vencimento)
  )
  const vencImpostos = impostos.filter(
    (i) => i.status !== 'pago' && withinRange(i.data_vencimento)
  )
  // Folha: treat dia 10 as due date
  const dia10 = new Date(today.getFullYear(), today.getMonth(), 10)
  const folhaPendente7d =
    dia10 >= today && dia10 <= in7 ? folha.filter((f) => f.status === 'pendente') : []

  // Resumo folha
  const folhaPago = folha.filter((f) => f.status === 'pago').length
  const folhaPendente = folha.filter((f) => f.status === 'pendente').length

  const mesFoiAberto = dreMesAtual !== null

  const variavelClientes = clientes.filter((c) => c.tipo === 'variavel')

  // Saldo bancário total
  const saldoBancarioTotal = contasBancarias.reduce((s, c) => s + (c.saldo_atual ?? 0), 0)

  // Contratos vencendo em 30 dias
  const today30 = new Date()
  today30.setHours(0, 0, 0, 0)
  const in30 = new Date(today30)
  in30.setDate(today30.getDate() + 30)
  const contratosVencendo = contratos.filter((c) => {
    if (!c.data_vencimento) return false
    const d = new Date(c.data_vencimento + 'T12:00:00')
    return d >= today30 && d <= in30
  })

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0873F7]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium">{error}</p>
        <Button size="sm" variant="outline" onClick={loadData} className="ml-auto">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#273544]">
            Visão Geral — {mesAtual}
          </h2>
          <p className="text-xs text-[#626F7F] mt-0.5">
            {mesFoiAberto
              ? `Mês em ${dreMesAtual?.status === 'fechado' ? 'encerrado' : 'aberto'}`
              : 'Mês ainda não aberto'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!mesFoiAberto && (
            <Button size="sm" onClick={openAbrirDialog} className="gap-1.5">
              <CalendarPlus className="h-3.5 w-3.5" />
              Abrir {mesAtual}
            </Button>
          )}
          {mesFoiAberto && dreMesAtual?.status !== 'fechado' && (
            <span className="inline-flex items-center gap-1 text-xs text-[#0873F7] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {mesAtual} aberto
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            className="text-[#626F7F] hover:text-[#273544]"
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Prominent CTA when month not opened ── */}
      {!mesFoiAberto && (
        <div className="bg-[#0873F7]/5 border-2 border-dashed border-[#0873F7]/30 rounded-xl p-6 text-center">
          <CalendarPlus className="h-8 w-8 text-[#0873F7] mx-auto mb-2" />
          <p className="font-semibold text-[#273544] mb-1">
            {mesAtual} ainda não foi aberto
          </p>
          <p className="text-sm text-[#626F7F] mb-4">
            Clique abaixo para gerar despesas recorrentes, folha e receitas do mês.
          </p>
          <Button onClick={openAbrirDialog} className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            Abrir {mesAtual}
          </Button>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide">Receita Total</p>
          <p className="font-mono text-2xl font-bold text-[#22c55e] mt-2">
            {formatCurrency(receitaTotal)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">{receitas.length} lançamentos</p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide">Despesa Total</p>
          <p className="font-mono text-2xl font-bold text-[#EF4343] mt-2">
            {formatCurrency(despesaTotal)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">
            {despesas.length + folha.length + impostos.length} lançamentos
          </p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide">Lucro Líquido</p>
          <p
            className={`font-mono text-2xl font-bold mt-2 ${
              lucroLiquido >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'
            }`}
          >
            {formatCurrency(lucroLiquido)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">Após reserva {formatCurrency(caixaReserva)}</p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide">MRR</p>
          <p className="font-mono text-2xl font-bold text-[#0873F7] mt-2">
            {formatCurrency(mrr)}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">
            {clientes.filter((c) => c.tipo === 'recorrente').length} clientes recorrentes
          </p>
        </div>

        <div className="liquid-glass-md rounded-3xl p-5">
          <p className="text-xs font-medium text-[#626F7F] uppercase tracking-wide flex items-center gap-1">
            <Landmark className="h-3 w-3" />
            Saldo Bancário
          </p>
          <p className={`font-mono text-2xl font-bold mt-2 ${saldoBancarioTotal >= 0 ? 'text-[#22c55e]' : 'text-[#EF4343]'}`}>
            {contasBancarias.length > 0 ? formatCurrency(saldoBancarioTotal) : '—'}
          </p>
          <p className="text-xs text-[#626F7F] mt-1">
            {contasBancarias.length > 0
              ? `${contasBancarias.length} conta${contasBancarias.length > 1 ? 's' : ''}`
              : 'Nenhuma conta cadastrada'}
          </p>
        </div>
      </div>

      {/* ── Receita Variável Quick Entry ── */}
      <div className="liquid-glass-md rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Plus className="h-4 w-4 text-[#0873F7] flex-shrink-0" />
          <span className="text-sm font-medium text-[#273544]">Lançar receita variável</span>
          <span className="text-xs text-[#626F7F]">{mesAtual}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRvDialog(true)}
          className="gap-1.5 text-[#0873F7] border-[#0873F7]/30 hover:bg-[#0873F7]/5"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo lançamento
        </Button>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 liquid-glass-md rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-[#273544] mb-4">
            Receita vs Despesa — Últimos 6 Meses
          </h3>
          {chartData.every((d) => d.receita === 0 && d.despesa === 0) ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-[#626F7F]">
              Sem histórico para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#626F7F' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#626F7F' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Receita"
                />
                <Line
                  type="monotone"
                  dataKey="despesa"
                  stroke="#EF4343"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Despesa"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 liquid-glass-md rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-[#273544] mb-4">Despesas por Categoria</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-[#626F7F]">
              Sem dados para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Clientes em Atraso */}
        <div className="liquid-glass-md rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-[#273544] mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Clientes em Atraso
          </h3>
          {clientesAtrasados.length === 0 ? (
            <p className="text-xs text-[#626F7F] py-4 text-center">Nenhum cliente em atraso</p>
          ) : (
            <div className="space-y-2">
              {clientesAtrasados.map((r) => {
                const cli = clientes.find(
                  (c) => c.id === r.cliente_id || c.nome === r.cliente_nome
                )
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-[#f1f5f9] last:border-0"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#273544]">
                        {r.cliente_nome ?? 'Cliente'}
                      </p>
                      <p className="text-[10px] text-[#626F7F]">
                        Vence dia {cli?.dia_pagamento ?? '?'}
                      </p>
                    </div>
                    <p className="font-mono text-xs font-semibold text-[#EF4343]">
                      {formatCurrency(r.valor)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Vencimentos Próximos 7 dias */}
        <div className="liquid-glass-md rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-[#273544] mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Vencimentos — Próximos 7 dias
          </h3>
          {vencDespesas.length === 0 &&
          vencImpostos.length === 0 &&
          folhaPendente7d.length === 0 ? (
            <p className="text-xs text-[#626F7F] py-4 text-center">
              Nenhum vencimento nos próximos 7 dias
            </p>
          ) : (
            <div className="space-y-2">
              {vencDespesas.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 border-b border-[#f1f5f9] last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium text-[#273544] truncate max-w-[140px]">
                      {d.descricao}
                    </p>
                    <p className="text-[10px] text-[#626F7F]">
                      {d.data_vencimento
                        ? new Date(d.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
                        : ''}
                    </p>
                  </div>
                  <p className="font-mono text-xs font-semibold text-[#EF4343]">
                    {formatCurrency(d.valor)}
                  </p>
                </div>
              ))}
              {vencImpostos.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between py-2 border-b border-[#f1f5f9] last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium text-[#273544]">
                      {i.descricao ?? i.tipo}
                    </p>
                    <p className="text-[10px] text-[#626F7F]">
                      {i.data_vencimento
                        ? new Date(i.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
                        : ''}
                    </p>
                  </div>
                  <p className="font-mono text-xs font-semibold text-[#EF4343]">
                    {formatCurrency(i.valor)}
                  </p>
                </div>
              ))}
              {folhaPendente7d.length > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9] last:border-0">
                  <div>
                    <p className="text-xs font-medium text-[#273544]">
                      Folha ({folhaPendente7d.length} pendente{folhaPendente7d.length > 1 ? 's' : ''})
                    </p>
                    <p className="text-[10px] text-[#626F7F]">Vence dia 10</p>
                  </div>
                  <p className="font-mono text-xs font-semibold text-[#EF4343]">
                    {formatCurrency(folhaPendente7d.reduce((s, f) => s + f.salario, 0))}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contratos Vencendo */}
        <div className="liquid-glass-md rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-[#273544] mb-3 flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-amber-500" />
            Contratos Vencendo (30d)
          </h3>
          {contratosVencendo.length === 0 ? (
            <p className="text-xs text-[#626F7F] py-4 text-center">
              {contratos.length === 0
                ? 'Nenhum contrato cadastrado'
                : 'Nenhum vencendo em 30 dias'}
            </p>
          ) : (
            <div className="space-y-2">
              {contratosVencendo.map((c) => {
                const d = new Date(c.data_vencimento! + 'T12:00:00')
                const dias = Math.ceil((d.getTime() - today30.getTime()) / 86400000)
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-[#f1f5f9] last:border-0"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#273544] truncate max-w-[120px]">
                        {c.cliente_nome}
                      </p>
                      <p className={`text-[10px] font-medium ${dias <= 7 ? 'text-[#EF4343]' : 'text-amber-600'}`}>
                        Vence em {dias}d
                      </p>
                    </div>
                    <p className="font-mono text-xs font-semibold text-[#273544]">
                      {formatCurrency(c.valor)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Resumo da Folha */}
        <div className="liquid-glass-md rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-[#273544] mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0873F7]" />
            Resumo da Folha
          </h3>
          <p className="font-mono text-base font-bold text-[#273544] mb-1">
            {formatCurrency(totalFolha)}
          </p>
          {folha.length > 0 && (
            <p className="text-xs text-[#626F7F] mb-3">
              {folhaPago} pago{folhaPago !== 1 ? 's' : ''} · {folhaPendente} pendente{folhaPendente !== 1 ? 's' : ''}
            </p>
          )}
          {folha.length === 0 ? (
            <p className="text-xs text-[#626F7F] py-2 text-center">Nenhum registro de folha</p>
          ) : (
            <div className="space-y-2">
              {folha.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-2 border-b border-[#f1f5f9] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#273544] truncate">{f.funcionario}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          f.tipo === 'PJ'
                            ? 'bg-purple-100 text-purple-700'
                            : f.tipo === 'Pró-labore'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {f.tipo}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusBadgeClass(f.status)}`}
                      >
                        {statusLabel(f.status)}
                      </span>
                    </div>
                  </div>
                  <p className="font-mono text-xs font-semibold text-[#273544] ml-2">
                    {formatCurrency(f.salario)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Abrir Mês Dialog ── */}
      <Dialog open={abrirDialog} onOpenChange={setAbrirDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir {mesAtual}?</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {dialogCountsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0873F7]" />
              </div>
            ) : dialogCounts ? (
              <>
                <p className="text-sm text-[#626F7F]">
                  Serão gerados automaticamente para <strong className="text-[#273544]">{mesAtual}</strong>:
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2 text-[#273544]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0873F7]" />
                    <strong>{dialogCounts.despesas}</strong> despesas recorrentes
                  </li>
                  <li className="flex items-center gap-2 text-[#273544]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0873F7]" />
                    <strong>{dialogCounts.funcionarios}</strong> registros de folha
                  </li>
                  <li className="flex items-center gap-2 text-[#273544]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0873F7]" />
                    <strong>{dialogCounts.clientes}</strong> lançamentos de receita
                  </li>
                  <li className="flex items-center gap-2 text-[#273544]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0873F7]" />
                    1 estimativa DAS (valor R$ 0, ajustar depois)
                  </li>
                </ul>
              </>
            ) : null}
            <p className="text-xs text-[#626F7F]">
              Todos os lançamentos serão criados com status <strong>pendente</strong>.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAbrirDialog(false)}
              disabled={abrirLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleAbrirMes} disabled={abrirLoading || dialogCountsLoading}>
              {abrirLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  Abrindo...
                </span>
              ) : (
                `Confirmar — Abrir ${mesAtual}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Receita Variável Dialog ── */}
      <Dialog open={rvDialog} onOpenChange={setRvDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lançar Receita Variável</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid gap-1.5">
              <Label>Cliente *</Label>
              <Select
                value={rvForm.cliente_id}
                onValueChange={(v) => {
                  const cli = clientes.find((c) => c.id === v)
                  setRvForm((f) => ({
                    ...f,
                    cliente_id: v,
                    valor: cli?.valor_mensalidade ? String(cli.valor_mensalidade) : f.valor,
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                      {c.tipo === 'variavel' ? ' (variável)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={rvForm.valor}
                onChange={(e) => setRvForm((f) => ({ ...f, valor: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Observação</Label>
              <Input
                placeholder="Opcional"
                value={rvForm.observacao}
                onChange={(e) => setRvForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
            <p className="text-xs text-[#626F7F]">
              Mês de referência: <strong>{mesAtual}</strong> · Status: pendente
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRvDialog(false)} disabled={rvSaving}>
              Cancelar
            </Button>
            <Button onClick={handleReceitaVariavel} disabled={rvSaving}>
              {rvSaving ? 'Salvando...' : 'Lançar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
