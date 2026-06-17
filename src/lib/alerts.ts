import { supabase } from './supabase'
import { getMesAtual } from './utils'

const mesAtual = getMesAtual()

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function generateAlerts(): Promise<void> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in7 = addDays(today, 7)
    const in30 = addDays(today, 30)

    // Fetch existing active alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('alertas')
      .select('origem_id, tipo')
      .eq('status', 'ativo')

    const existingKeys = new Set(
      (existingAlerts ?? []).map((a) => `${a.tipo}::${a.origem_id}`)
    )

    const alertsToInsert: {
      tipo: string
      titulo: string
      descricao: string
      prioridade: string
      status: string
      data_alerta: string
      origem_tabela: string
      origem_id: string
    }[] = []

    function shouldAdd(tipo: string, origem_id: string): boolean {
      return !existingKeys.has(`${tipo}::${origem_id}`)
    }

    // ── 1. Contratos expirando em 30 dias ──────────────────────────────────
    const { data: contratos } = await supabase
      .from('contratos')
      .select('*')
      .eq('status', 'ativo')
      .lte('data_vencimento', toISO(in30))
      .gte('data_vencimento', toISO(today))

    for (const c of contratos ?? []) {
      const tipo = 'contrato_vencendo'
      if (!shouldAdd(tipo, c.id)) continue
      const venc = new Date(c.data_vencimento + 'T12:00:00')
      const days = Math.ceil((venc.getTime() - today.getTime()) / 86400000)
      const prioridade = days <= 7 ? 'alta' : 'media'
      alertsToInsert.push({
        tipo,
        titulo: `Contrato vencendo: ${c.cliente_nome}`,
        descricao: `Contrato de R$ ${c.valor.toLocaleString('pt-BR')} vence em ${days} dias (${c.data_vencimento}).`,
        prioridade,
        status: 'ativo',
        data_alerta: c.data_vencimento,
        origem_tabela: 'contratos',
        origem_id: c.id,
      })
    }

    // ── 2. Receitas vencidas (pendente + dia_pagamento passado) ────────────
    const { data: receitas } = await supabase
      .from('receitas')
      .select('*, clientes(nome, dia_pagamento)')
      .eq('status', 'pendente')
      .eq('mes_referencia', mesAtual)

    const todayDay = today.getDate()
    for (const r of receitas ?? []) {
      const tipo = 'receita_vencida'
      if (!shouldAdd(tipo, r.id)) continue
      const cli = (r as any).clientes
      const diaPag = cli?.dia_pagamento
      if (!diaPag || diaPag >= todayDay) continue
      const diasAtraso = todayDay - diaPag
      const prioridade = diasAtraso > 15 ? 'critica' : diasAtraso > 7 ? 'alta' : 'media'
      alertsToInsert.push({
        tipo,
        titulo: `Recebimento atrasado: ${r.cliente_nome ?? cli?.nome ?? 'Cliente'}`,
        descricao: `Pagamento de R$ ${r.valor.toLocaleString('pt-BR')} estava previsto para dia ${diaPag} (${diasAtraso} dias em atraso).`,
        prioridade,
        status: 'ativo',
        data_alerta: toISO(today),
        origem_tabela: 'receitas',
        origem_id: r.id,
      })
    }

    // ── 3. DAS vencendo em 7 dias (assume dia 20) ─────────────────────────
    const dasDay = new Date(today.getFullYear(), today.getMonth(), 20)
    if (dasDay >= today && dasDay <= in7) {
      const { data: impostos } = await supabase
        .from('impostos')
        .select('*')
        .eq('tipo', 'DAS')
        .eq('status', 'pendente')
        .eq('mes_referencia', mesAtual)

      for (const imp of impostos ?? []) {
        const tipo = 'das_vencendo'
        if (!shouldAdd(tipo, imp.id)) continue
        alertsToInsert.push({
          tipo,
          titulo: 'DAS vence em breve',
          descricao: `Simples Nacional de R$ ${imp.valor.toLocaleString('pt-BR')} vence dia 20/${today.getMonth() + 1}.`,
          prioridade: 'alta',
          status: 'ativo',
          data_alerta: toISO(dasDay),
          origem_tabela: 'impostos',
          origem_id: imp.id,
        })
      }
    }

    // ── 4. Despesas vencidas (pendente + data_vencimento passada) ──────────
    const { data: despesasVencidas } = await supabase
      .from('despesas')
      .select('*')
      .eq('status', 'pendente')
      .lt('data_vencimento', toISO(today))
      .not('data_vencimento', 'is', null)

    for (const d of despesasVencidas ?? []) {
      const tipo = 'despesa_vencida'
      if (!shouldAdd(tipo, d.id)) continue
      alertsToInsert.push({
        tipo,
        titulo: `Despesa vencida: ${d.descricao}`,
        descricao: `R$ ${d.valor.toLocaleString('pt-BR')} estava previsto para ${d.data_vencimento}.`,
        prioridade: 'alta',
        status: 'ativo',
        data_alerta: d.data_vencimento!,
        origem_tabela: 'despesas',
        origem_id: d.id,
      })
    }

    if (alertsToInsert.length > 0) {
      await supabase.from('alertas').insert(alertsToInsert)
    }
  } catch (err) {
    console.error('[generateAlerts] error:', err)
  }
}

export async function dismissAlert(id: string): Promise<void> {
  await supabase.from('alertas').update({ status: 'ignorado' }).eq('id', id)
}

export async function resolveAlert(id: string): Promise<void> {
  await supabase.from('alertas').update({ status: 'resolvido' }).eq('id', id)
}
