export interface Empresa {
  id: string
  nome: string
  cnpj: string | null
  regime_tributario: string
  aliquota_simples: number
  caixa_reserva: number
  updated_at: string
}

export interface Socio {
  id: string
  nome: string
  percentual: number
  prolabore: number
  cargo: string | null
  ativo: boolean
  participa_distribuicao?: boolean
}

export interface CategoriaDespesa {
  id: string
  nome: string
  tipo: string
  cor: string
}

export interface Cliente {
  id: string
  nome: string
  tipo: 'recorrente' | 'variavel'
  valor_mensalidade: number | null
  dia_pagamento: number | null
  data_inicio: string | null
  contrato_vigente: boolean
  vencimento_contrato: string | null
  observacao: string | null
  ativo: boolean
  criado_em: string
}

export interface Receita {
  id: string
  cliente_id: string | null
  cliente_nome: string | null
  mes_referencia: string
  valor: number
  data_vencimento: string | null
  data_pagamento: string | null
  status: 'pendente' | 'pago' | 'atrasado'
  observacao: string | null
  criado_em: string
}

export interface FolhaPagamento {
  id: string
  funcionario: string
  cargo: string | null
  salario: number
  tipo: string
  mes_referencia: string
  data_pagamento: string | null
  status: 'pendente' | 'pago'
}

export interface Despesa {
  id: string
  descricao: string
  valor: number
  categoria_nome: string | null
  categoria_tipo: string | null
  recorrente: boolean
  mes_referencia: string | null
  data_vencimento: string | null
  data_pagamento: string | null
  status: 'pendente' | 'pago' | 'atrasado'
  forma_pagamento: string | null
  observacao: string | null
  criado_em: string
}

export interface Imposto {
  id: string
  tipo: string
  descricao: string | null
  valor: number
  mes_referencia: string
  competencia: string | null
  data_vencimento: string | null
  data_pagamento: string | null
  status: 'pendente' | 'pago'
  guia_numero: string | null
}

export interface FaturaCartao {
  id: string
  cartao: string
  descricao: string
  valor: number
  data_compra: string | null
  mes_fatura: string | null
  categoria: string | null
  observacao: string | null
}

export interface DreMensal {
  id: string
  mes_referencia: string
  receita_recorrente: number
  receita_variavel: number
  receita_total: number
  folha_total: number
  despesas_software: number
  despesas_escritorio: number
  despesas_parcelas: number
  impostos_das: number
  impostos_outros: number
  despesa_total: number
  ebitda: number
  lucro_liquido: number
  caixa_reserva: number
  lucro_distribuivel: number
  status: 'aberto' | 'fechado'
  fechado_em: string | null
  observacoes: string | null
  criado_em: string
}

export interface FluxoCaixa {
  id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  data_prevista: string | null
  data_realizada: string | null
  status: 'previsto' | 'realizado' | 'atrasado'
  origem: string | null
  mes_referencia: string | null
}

export interface Pipeline {
  id: string
  empresa: string
  contato: string | null
  fase: 'Prospecção' | 'Proposta' | 'Negociação' | 'Ganho' | 'Perdido'
  servicos: string[] | null
  ticket_unico: number
  ticket_recorrente: number
  mes_entrada_estimado: string | null
  probabilidade: number
  observacao: string | null
  data_followup: string | null
  criado_em: string
  atualizado_em: string
}

// ─── New types ────────────────────────────────────────────────────────────────

export interface ContaBancaria {
  id: string
  banco: string
  agencia: string | null
  conta: string | null
  tipo: string
  saldo_atual: number
  updated_at: string
}

export interface Contrato {
  id: string
  cliente_id: string | null
  cliente_nome: string
  valor: number
  data_inicio: string
  data_vencimento: string | null
  status: 'ativo' | 'vencido' | 'cancelado'
  renovacao_automatica: boolean
  observacao: string | null
  arquivo: string | null
  criado_em: string
}

export interface Alerta {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  prioridade: 'critica' | 'alta' | 'media' | 'baixa'
  status: 'ativo' | 'resolvido' | 'ignorado'
  data_alerta: string | null
  origem_tabela: string | null
  origem_id: string | null
  criado_em: string
}

export interface OrcamentoMensal {
  id: string
  mes_referencia: string
  categoria: string
  valor_orcado: number
  valor_realizado: number
  criado_em: string
}

export interface HistoricoMRR {
  id: string
  mes_referencia: string
  mrr: number
  novos_clientes: number
  churn: number
  expansao: number
  criado_em: string
}

export interface Investimento {
  id: string
  nome: string
  tipo: 'caixa_reserva' | 'cdb' | 'poupanca' | 'fundo' | 'outro'
  valor_investido: number
  saldo_atual: number
  taxa_juros: number | null
  instituicao: string | null
  data_inicio: string | null
  data_vencimento: string | null
  observacao: string | null
  ativo: boolean
  criado_em: string
}

export interface RendimentoInvestimento {
  id: string
  investimento_id: string
  mes_referencia: string
  rendimento: number
  taxa_aplicada: number | null
  saldo_anterior: number | null
  saldo_atual: number | null
  observacao: string | null
  criado_em: string
}
