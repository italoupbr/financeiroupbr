import type { Cliente, Pipeline } from '@/types'

export interface DREInputs {
  receitaRecorrente: number
  receitaVariavel: number
  folha: number
  despesasSoftware: number
  despesasEscritorio: number
  despesasParcelas: number
  impostosDAS: number
  impostosOutros: number
  caixaReserva: number
  socios: { nome: string; percentual: number }[]
}

export interface DREResult {
  receitaTotal: number
  receitaLiquida: number
  despesasOperacionais: number
  ebitda: number
  margemEbitda: number
  despesasFinanceiras: number
  despesaTotal: number
  lucroLiquido: number
  lucroDistribuivel: number
  distribuicao: { nome: string; percentual: number; valor: number }[]
}

export function calculateDRE(inputs: DREInputs): DREResult {
  const receitaTotal = inputs.receitaRecorrente + inputs.receitaVariavel
  const deducoesDAS = inputs.impostosDAS
  const receitaLiquida = receitaTotal - deducoesDAS
  const despesasOperacionais = inputs.folha + inputs.despesasSoftware + inputs.despesasEscritorio
  const ebitda = receitaLiquida - despesasOperacionais
  const margemEbitda = receitaTotal > 0 ? (ebitda / receitaTotal) * 100 : 0
  const despesasFinanceiras = inputs.despesasParcelas + inputs.impostosOutros
  const despesaTotal = despesasOperacionais + despesasFinanceiras + inputs.impostosDAS
  const lucroLiquido = ebitda - despesasFinanceiras
  const lucroDistribuivel = lucroLiquido - inputs.caixaReserva

  const distribuicao = inputs.socios.map(s => ({
    nome: s.nome,
    percentual: s.percentual,
    valor: Math.max(0, lucroDistribuivel) * (s.percentual / 100),
  }))

  return {
    receitaTotal,
    receitaLiquida,
    despesasOperacionais,
    ebitda,
    margemEbitda,
    despesasFinanceiras,
    despesaTotal,
    lucroLiquido,
    lucroDistribuivel,
    distribuicao,
  }
}

export function getMRR(clientes: Cliente[]): number {
  return clientes
    .filter(c => c.tipo === 'recorrente' && c.ativo)
    .reduce((sum, c) => sum + (c.valor_mensalidade ?? 0), 0)
}

export interface CashFlowDay {
  date: Date
  label: string
  entradas: number
  saidas: number
  saldo: number
}

export function buildCashFlowProjection(
  saldoAtual: number,
  entradas: { valor: number; data: string | null }[],
  saidas: { valor: number; data: string | null }[],
  days = 30,
): CashFlowDay[] {
  const result: CashFlowDay[] = []
  let balance = saldoAtual
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const dayEntradas = entradas
      .filter(e => e.data === dateStr)
      .reduce((s, e) => s + e.valor, 0)
    const daySaidas = saidas
      .filter(s => s.data === dateStr)
      .reduce((s, e) => s + e.valor, 0)

    balance += dayEntradas - daySaidas
    result.push({
      date,
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      entradas: dayEntradas,
      saidas: daySaidas,
      saldo: balance,
    })
  }

  return result
}

export const estimateDAS = (receitaBruta: number, aliquota = 12.5): number =>
  receitaBruta * (aliquota / 100)

export interface PipelineSimResult {
  mrrWeighted: number
  lucroAdicional: number
  distribuicao: number[]
}

export function simulatePipeline(
  leads: Pipeline[],
  fase: string | null,
  sociosPct: number[],
): PipelineSimResult {
  const filtered = fase
    ? leads.filter(l => l.fase === fase)
    : leads.filter(l => l.fase !== 'Perdido')

  const mrrWeighted = filtered.reduce(
    (s, l) => s + l.ticket_recorrente * (l.probabilidade / 100),
    0,
  )
  const lucroAdicional = mrrWeighted * 0.3

  return {
    mrrWeighted,
    lucroAdicional,
    distribuicao: sociosPct.map(pct => lucroAdicional * (pct / 100)),
  }
}
