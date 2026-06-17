-- Upsend Brasil CFO — Schema SQL
-- Run in Supabase SQL Editor (New Project → SQL Editor)

CREATE TABLE IF NOT EXISTS empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text DEFAULT 'Upsend Brasil',
  cnpj text,
  regime_tributario text DEFAULT 'Simples Nacional',
  aliquota_simples decimal DEFAULT 12.5,
  caixa_reserva decimal DEFAULT 4000,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS socios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  percentual decimal NOT NULL,
  prolabore decimal DEFAULT 0,
  cargo text,
  ativo boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS categorias_despesa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  cor text DEFAULT '#127bf0'
);

CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  valor_mensalidade decimal,
  dia_pagamento int,
  data_inicio date,
  contrato_vigente boolean DEFAULT true,
  vencimento_contrato date,
  observacao text,
  ativo boolean DEFAULT true,
  criado_em timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id),
  cliente_nome text,
  mes_referencia text NOT NULL,
  valor decimal NOT NULL,
  data_pagamento date,
  status text DEFAULT 'pendente',
  observacao text,
  criado_em timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS folha_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario text NOT NULL,
  cargo text,
  salario decimal NOT NULL,
  tipo text DEFAULT 'CLT',
  mes_referencia text NOT NULL,
  data_pagamento date,
  status text DEFAULT 'pendente'
);

CREATE TABLE IF NOT EXISTS despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor decimal NOT NULL,
  categoria_nome text,
  categoria_tipo text,
  recorrente boolean DEFAULT false,
  mes_referencia text,
  data_vencimento date,
  data_pagamento date,
  status text DEFAULT 'pendente',
  forma_pagamento text,
  observacao text,
  criado_em timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS impostos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  descricao text,
  valor decimal NOT NULL,
  mes_referencia text NOT NULL,
  competencia text,
  data_vencimento date,
  data_pagamento date,
  status text DEFAULT 'pendente',
  guia_numero text
);

CREATE TABLE IF NOT EXISTS faturas_cartao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cartao text NOT NULL,
  descricao text NOT NULL,
  valor decimal NOT NULL,
  data_compra date,
  mes_fatura text,
  categoria text,
  observacao text
);

CREATE TABLE IF NOT EXISTS dre_mensal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia text NOT NULL UNIQUE,
  receita_recorrente decimal DEFAULT 0,
  receita_variavel decimal DEFAULT 0,
  receita_total decimal DEFAULT 0,
  folha_total decimal DEFAULT 0,
  despesas_software decimal DEFAULT 0,
  despesas_escritorio decimal DEFAULT 0,
  despesas_parcelas decimal DEFAULT 0,
  impostos_das decimal DEFAULT 0,
  impostos_outros decimal DEFAULT 0,
  despesa_total decimal DEFAULT 0,
  ebitda decimal DEFAULT 0,
  lucro_liquido decimal DEFAULT 0,
  caixa_reserva decimal DEFAULT 4000,
  lucro_distribuivel decimal DEFAULT 0,
  status text DEFAULT 'aberto',
  fechado_em timestamp,
  observacoes text,
  criado_em timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fluxo_caixa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  descricao text NOT NULL,
  valor decimal NOT NULL,
  data_prevista date,
  data_realizada date,
  status text DEFAULT 'previsto',
  origem text,
  mes_referencia text
);

CREATE TABLE IF NOT EXISTS pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa text NOT NULL,
  contato text,
  fase text DEFAULT 'Prospecção',
  servicos text[],
  ticket_unico decimal DEFAULT 0,
  ticket_recorrente decimal DEFAULT 0,
  mes_entrada_estimado text,
  probabilidade int DEFAULT 50,
  observacao text,
  criado_em timestamp DEFAULT now(),
  atualizado_em timestamp DEFAULT now()
);

-- Disable RLS on all tables
ALTER TABLE empresa DISABLE ROW LEVEL SECURITY;
ALTER TABLE socios DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_despesa DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE receitas DISABLE ROW LEVEL SECURITY;
ALTER TABLE folha_pagamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE despesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE impostos DISABLE ROW LEVEL SECURITY;
ALTER TABLE faturas_cartao DISABLE ROW LEVEL SECURITY;
ALTER TABLE dre_mensal DISABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo_caixa DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline DISABLE ROW LEVEL SECURITY;
