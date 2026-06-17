-- ============================================================================
-- Upsend Brasil CFO — MASTER SCHEMA
-- Script único, idempotente. Rode inteiro no SQL Editor do Supabase.
-- https://supabase.com/dashboard/project/bmnemeupygblffiphhwj/sql
-- ============================================================================

-- ─── 1. TABELAS ──────────────────────────────────────────────────────────────

-- Empresa (singleton)
CREATE TABLE IF NOT EXISTS empresa (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome               text        NOT NULL DEFAULT 'Upsend Brasil',
  cnpj               text,
  regime_tributario  text        NOT NULL DEFAULT 'Simples Nacional',
  aliquota_simples   numeric     NOT NULL DEFAULT 12.5,
  caixa_reserva      numeric     NOT NULL DEFAULT 4000,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Sócios
CREATE TABLE IF NOT EXISTS socios (
  id                      uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                    text    NOT NULL,
  percentual              numeric NOT NULL DEFAULT 0,
  prolabore               numeric NOT NULL DEFAULT 0,
  cargo                   text,
  ativo                   boolean NOT NULL DEFAULT true,
  participa_distribuicao  boolean NOT NULL DEFAULT true
);

-- Categorias de despesa
CREATE TABLE IF NOT EXISTS categorias_despesa (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome  text NOT NULL,
  tipo  text NOT NULL,
  cor   text NOT NULL DEFAULT '#0873F7'
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                text        NOT NULL,
  tipo                text        NOT NULL CHECK (tipo IN ('recorrente','variavel')),
  valor_mensalidade   numeric,
  dia_pagamento       int,
  data_inicio         date,
  contrato_vigente    boolean     NOT NULL DEFAULT true,
  vencimento_contrato date,
  observacao          text,
  ativo               boolean     NOT NULL DEFAULT true,
  criado_em           timestamptz NOT NULL DEFAULT now()
);

-- Receitas
CREATE TABLE IF NOT EXISTS receitas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid        REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome    text,
  mes_referencia  text        NOT NULL,
  valor           numeric     NOT NULL DEFAULT 0,
  data_vencimento date,
  data_pagamento  date,
  status          text        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','atrasado')),
  observacao      text,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- Folha de pagamento
CREATE TABLE IF NOT EXISTS folha_pagamento (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario     text        NOT NULL,
  cargo           text,
  salario         numeric     NOT NULL DEFAULT 0,
  tipo            text        NOT NULL DEFAULT 'CLT',
  mes_referencia  text        NOT NULL,
  data_pagamento  date,
  status          text        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago'))
);

-- Despesas
CREATE TABLE IF NOT EXISTS despesas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao       text        NOT NULL,
  valor           numeric     NOT NULL DEFAULT 0,
  categoria_nome  text,
  categoria_tipo  text,
  recorrente      boolean     NOT NULL DEFAULT false,
  mes_referencia  text,
  data_vencimento date,
  data_pagamento  date,
  status          text        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','atrasado')),
  forma_pagamento text,
  observacao      text,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- Impostos
CREATE TABLE IF NOT EXISTS impostos (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            text        NOT NULL,
  descricao       text,
  valor           numeric     NOT NULL DEFAULT 0,
  mes_referencia  text        NOT NULL,
  competencia     text,
  data_vencimento date,
  data_pagamento  date,
  status          text        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
  guia_numero     text
);

-- Faturas de cartão
CREATE TABLE IF NOT EXISTS faturas_cartao (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  cartao      text    NOT NULL,
  descricao   text    NOT NULL,
  valor       numeric NOT NULL DEFAULT 0,
  data_compra date,
  mes_fatura  text,
  categoria   text,
  observacao  text
);

-- DRE Mensal (uma linha por mês)
CREATE TABLE IF NOT EXISTS dre_mensal (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia       text        NOT NULL UNIQUE,
  receita_recorrente   numeric     NOT NULL DEFAULT 0,
  receita_variavel     numeric     NOT NULL DEFAULT 0,
  receita_total        numeric     NOT NULL DEFAULT 0,
  folha_total          numeric     NOT NULL DEFAULT 0,
  despesas_software    numeric     NOT NULL DEFAULT 0,
  despesas_escritorio  numeric     NOT NULL DEFAULT 0,
  despesas_parcelas    numeric     NOT NULL DEFAULT 0,
  impostos_das         numeric     NOT NULL DEFAULT 0,
  impostos_outros      numeric     NOT NULL DEFAULT 0,
  despesa_total        numeric     NOT NULL DEFAULT 0,
  ebitda               numeric     NOT NULL DEFAULT 0,
  lucro_liquido        numeric     NOT NULL DEFAULT 0,
  caixa_reserva        numeric     NOT NULL DEFAULT 4000,
  lucro_distribuivel   numeric     NOT NULL DEFAULT 0,
  status               text        NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  fechado_em           timestamptz,
  observacoes          text,
  criado_em            timestamptz NOT NULL DEFAULT now()
);

-- Fluxo de caixa
CREATE TABLE IF NOT EXISTS fluxo_caixa (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            text        NOT NULL CHECK (tipo IN ('entrada','saida')),
  descricao       text        NOT NULL,
  valor           numeric     NOT NULL DEFAULT 0,
  data_prevista   date,
  data_realizada  date,
  status          text        NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto','realizado','atrasado')),
  origem          text,
  mes_referencia  text
);

-- Pipeline de vendas
CREATE TABLE IF NOT EXISTS pipeline (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa               text        NOT NULL,
  contato               text,
  fase                  text        NOT NULL DEFAULT 'Prospecção'
                          CHECK (fase IN ('Prospecção','Proposta','Negociação','Ganho','Perdido')),
  servicos              text[],
  ticket_unico          numeric     NOT NULL DEFAULT 0,
  ticket_recorrente     numeric     NOT NULL DEFAULT 0,
  mes_entrada_estimado  text,
  probabilidade         int         NOT NULL DEFAULT 50,
  observacao            text,
  data_followup         date,
  criado_em             timestamptz NOT NULL DEFAULT now(),
  atualizado_em         timestamptz NOT NULL DEFAULT now()
);

-- Contas bancárias
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  banco       text        NOT NULL,
  agencia     text,
  conta       text,
  tipo        text        NOT NULL DEFAULT 'corrente',
  saldo_atual numeric     NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Contratos
CREATE TABLE IF NOT EXISTS contratos (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id           uuid        REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome         text        NOT NULL,
  valor                numeric     NOT NULL DEFAULT 0,
  data_inicio          date        NOT NULL,
  data_vencimento      date,
  status               text        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','vencido','cancelado')),
  renovacao_automatica boolean     NOT NULL DEFAULT false,
  observacao           text,
  arquivo              text,
  criado_em            timestamptz NOT NULL DEFAULT now()
);

-- Alertas automáticos
CREATE TABLE IF NOT EXISTS alertas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            text        NOT NULL,
  titulo          text        NOT NULL,
  descricao       text,
  prioridade      text        NOT NULL DEFAULT 'media'
                    CHECK (prioridade IN ('critica','alta','media','baixa')),
  status          text        NOT NULL DEFAULT 'ativo'
                    CHECK (status IN ('ativo','resolvido','ignorado')),
  data_alerta     date,
  origem_tabela   text,
  origem_id       uuid,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- Orçamento mensal (budget vs realizado)
CREATE TABLE IF NOT EXISTS orcamento_mensal (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia   text        NOT NULL,
  categoria        text        NOT NULL,
  valor_orcado     numeric     NOT NULL DEFAULT 0,
  valor_realizado  numeric     NOT NULL DEFAULT 0,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mes_referencia, categoria)
);

-- Histórico MRR
CREATE TABLE IF NOT EXISTS historico_mrr (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia  text        NOT NULL UNIQUE,
  mrr             numeric     NOT NULL DEFAULT 0,
  novos_clientes  int         NOT NULL DEFAULT 0,
  churn           numeric     NOT NULL DEFAULT 0,
  expansao        numeric     NOT NULL DEFAULT 0,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- Investimentos
CREATE TABLE IF NOT EXISTS investimentos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             text        NOT NULL,
  tipo             text        NOT NULL DEFAULT 'outro'
                     CHECK (tipo IN ('caixa_reserva','cdb','poupanca','fundo','outro')),
  valor_investido  numeric     NOT NULL DEFAULT 0,
  saldo_atual      numeric     NOT NULL DEFAULT 0,
  taxa_juros       numeric,
  instituicao      text,
  data_inicio      date,
  data_vencimento  date,
  observacao       text,
  ativo            boolean     NOT NULL DEFAULT true,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

-- Rendimentos de investimentos
CREATE TABLE IF NOT EXISTS rendimentos_investimentos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  investimento_id  uuid        NOT NULL REFERENCES investimentos(id) ON DELETE CASCADE,
  mes_referencia   text        NOT NULL,
  rendimento       numeric     NOT NULL DEFAULT 0,
  taxa_aplicada    numeric,
  saldo_anterior   numeric,
  saldo_atual      numeric,
  observacao       text,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. COLUNAS QUE PODEM FALTAR (idempotentes) ──────────────────────────────

ALTER TABLE receitas  ADD COLUMN IF NOT EXISTS data_vencimento date;
ALTER TABLE socios    ADD COLUMN IF NOT EXISTS participa_distribuicao boolean NOT NULL DEFAULT true;
ALTER TABLE pipeline  ADD COLUMN IF NOT EXISTS data_followup date;

-- Garante unique constraint no orcamento_mensal (necessário para o upsert do app)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'orcamento_mensal'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE orcamento_mensal
      ADD CONSTRAINT orcamento_mensal_mes_cat_uq UNIQUE (mes_referencia, categoria);
  END IF;
END $$;

-- ─── 3. DESABILITAR RLS (acesso direto via anon key) ────────────────────────

ALTER TABLE empresa                DISABLE ROW LEVEL SECURITY;
ALTER TABLE socios                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_despesa     DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes               DISABLE ROW LEVEL SECURITY;
ALTER TABLE receitas               DISABLE ROW LEVEL SECURITY;
ALTER TABLE folha_pagamento        DISABLE ROW LEVEL SECURITY;
ALTER TABLE despesas               DISABLE ROW LEVEL SECURITY;
ALTER TABLE impostos               DISABLE ROW LEVEL SECURITY;
ALTER TABLE faturas_cartao         DISABLE ROW LEVEL SECURITY;
ALTER TABLE dre_mensal             DISABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo_caixa            DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline               DISABLE ROW LEVEL SECURITY;
ALTER TABLE contas_bancarias       DISABLE ROW LEVEL SECURITY;
ALTER TABLE contratos              DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertas                DISABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_mensal       DISABLE ROW LEVEL SECURITY;
ALTER TABLE historico_mrr          DISABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos          DISABLE ROW LEVEL SECURITY;
ALTER TABLE rendimentos_investimentos DISABLE ROW LEVEL SECURITY;

-- ─── 4. ÍNDICES ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_receitas_mes      ON receitas(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_receitas_status   ON receitas(status);
CREATE INDEX IF NOT EXISTS idx_receitas_cliente  ON receitas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_despesas_mes      ON despesas(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_despesas_status   ON despesas(status);
CREATE INDEX IF NOT EXISTS idx_folha_mes         ON folha_pagamento(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_folha_status      ON folha_pagamento(status);
CREATE INDEX IF NOT EXISTS idx_impostos_mes      ON impostos(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_impostos_status   ON impostos(status);
CREATE INDEX IF NOT EXISTS idx_alertas_status    ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_fase     ON pipeline(fase);
CREATE INDEX IF NOT EXISTS idx_contratos_status  ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_rendimentos_inv   ON rendimentos_investimentos(investimento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_mes     ON orcamento_mensal(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_dre_mes           ON dre_mensal(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_mrr_mes           ON historico_mrr(mes_referencia);

-- ─── 5. SEED — dados base (só insere se vazio) ───────────────────────────────

-- Empresa
INSERT INTO empresa (nome, cnpj, regime_tributario, aliquota_simples, caixa_reserva)
SELECT 'Upsend Brasil', NULL, 'Simples Nacional', 12.5, 4000
WHERE NOT EXISTS (SELECT 1 FROM empresa);

-- Sócios
INSERT INTO socios (nome, percentual, prolabore, cargo, ativo, participa_distribuicao)
SELECT * FROM (VALUES
  ('Ítalo Ribeiro',  33.33, 1621, 'Diretor Comercial',  true, true),
  ('Gabriel Diniz',  33.33, 1621, 'Especialista SEO',   true, true),
  ('Antônio Alves',  33.34, 1621, 'Especialista',       true, true),
  ('Davi Rodrigues', 0.00,  2000, 'Analista',           true, false),
  ('Miguel Dev',     0.00,  3000, 'Desenvolvedor',      true, false)
) AS v(nome, percentual, prolabore, cargo, ativo, participa_distribuicao)
WHERE NOT EXISTS (SELECT 1 FROM socios);

-- Categorias de despesa
INSERT INTO categorias_despesa (nome, tipo, cor)
SELECT * FROM (VALUES
  ('Software e Plataformas',    'operacional', '#8b5cf6'),
  ('Escritório',                'operacional', '#f59e0b'),
  ('Parcelas / Financiamentos', 'financeiro',  '#EF4343'),
  ('Impostos',                  'imposto',     '#dc2626'),
  ('Folha de Pagamento',        'folha',       '#0873F7')
) AS v(nome, tipo, cor)
WHERE NOT EXISTS (SELECT 1 FROM categorias_despesa);

-- Contas bancárias
INSERT INTO contas_bancarias (banco, agencia, conta, tipo, saldo_atual)
SELECT * FROM (VALUES
  ('Sicoob', '3049', '917990', 'corrente', 0::numeric),
  ('Inter',  '0001', 'UPBR',   'corrente', 0::numeric)
) AS v(banco, agencia, conta, tipo, saldo_atual)
WHERE NOT EXISTS (SELECT 1 FROM contas_bancarias);

-- Investimento: Caixa Reserva
INSERT INTO investimentos (nome, tipo, valor_investido, saldo_atual, ativo)
SELECT 'Caixa Reserva Operacional', 'caixa_reserva', 4000, 4000, true
WHERE NOT EXISTS (SELECT 1 FROM investimentos);

-- ─── 6. SEED CLIENTES ────────────────────────────────────────────────────────

INSERT INTO clientes (nome, tipo, valor_mensalidade, dia_pagamento, contrato_vigente, ativo)
SELECT * FROM (VALUES
  ('Villa Grand Pets',         'recorrente',  500::numeric,   3,    true,  true),
  ('Aquae Deca Tráfego',       'recorrente', 1700::numeric,  14,    true,  true),
  ('Ramá Ipatinga',            'recorrente',  491::numeric,  14,    true,  true),
  ('Casa do Bombeiro',         'recorrente',  500::numeric,  14,    true,  true),
  ('Bragança Capital',         'recorrente', 1998::numeric,  27,    true,  true),
  ('Inova Franquia + Tráfego', 'recorrente', 5500::numeric,  27,    true,  true),
  ('Kind Roofing',             'recorrente', 2460::numeric,  27,    true,  true),
  ('Mais 60 Saúde',            'recorrente', 3000::numeric,  27,    true,  true),
  ('Pratique Segurança',       'recorrente',  399::numeric,  29,    true,  true),
  ('Valore',                   'recorrente', 5000::numeric,   1,    true,  true),
  ('Ricardo Gontijo',          'recorrente', 2000::numeric,   1,    true,  true),
  ('Valorem',                  'recorrente', 4000::numeric, NULL,   true,  true),
  ('Manutenção Favela.org',    'recorrente',  250::numeric,  16,    true,  true),
  ('Inova Select',             'variavel',   1500::numeric, NULL,   true,  true),
  ('Lilian Giannasi',          'variavel',   3498::numeric, NULL,   true,  true),
  ('Embala e Limp',            'variavel',   3300::numeric, NULL,  false, false),
  ('Task',                     'variavel',   9000::numeric, NULL,  false, false),
  ('Pizza Point',              'variavel',    147::numeric, NULL,  false, false)
) AS v(nome, tipo, valor_mensalidade, dia_pagamento, contrato_vigente, ativo)
WHERE NOT EXISTS (SELECT 1 FROM clientes);

-- ─── 7. SEED MAIO 2026 ───────────────────────────────────────────────────────

-- Folha Mai/2026
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Miguel Dev',     'Desenvolvedor',    3000::numeric, 'PJ',         'Mai/2026', 'pago'),
  ('Davi Rodrigues', 'Analista',         2000::numeric, 'PJ',         'Mai/2026', 'pago'),
  ('Antônio Alves',  'Especialista',     1621::numeric, 'Pró-labore', 'Mai/2026', 'pago'),
  ('Ítalo Augusto',  'Dir. Comercial',   1621::numeric, 'Pró-labore', 'Mai/2026', 'pago'),
  ('Gabriel Diniz',  'Especialista SEO', 1621::numeric, 'Pró-labore', 'Mai/2026', 'pago')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Mai/2026');

-- Impostos Mai/2026
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, status)
SELECT * FROM (VALUES
  ('DAS',        'Simples Nacional',    3266.79::numeric, 'Mai/2026', 'Abr/2026', 'pago'),
  ('taxa_conta', 'Taxa Conta Corrente',   69.90::numeric, 'Mai/2026', 'Mai/2026', 'pago'),
  ('DARF',       'DARF Maio',           1595.77::numeric, 'Mai/2026', 'Mai/2026', 'pago')
) AS v(tipo, descricao, valor, mes_referencia, competencia, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Mai/2026');

-- Despesas Software Mai/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Claude AI pessoal',      110.00::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Claude AI agência',      441.30::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('DataForSEO',             268.07::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('TurboCloud',             215.40::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Magnific Premium',        80.00::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Registro.br',             40.00::numeric,  'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
  ('MeisterLabs',            210.59::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Lovable',                125.35::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Figma',                  188.81::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Domínio upbr.digital',   318.17::numeric,  'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
  ('Envato',                 166.88::numeric,  'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
  ('Google Workspace',       490.00::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Hetzner Online',          62.41::numeric,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mai/2026');

-- Despesas Escritório Mai/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia Cemig',            689.60::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Aluguel Salas',           1665.70::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Condomínio Med Center',    966.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Estacionamento Rodo Park', 343.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Internet',                 140.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Faxineira',                200.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Taxa TFLF UPBR',           336.89::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Taxa TFLF Consultoria',    168.48::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mai/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Mai/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob Gabriel', 1125.27::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago'),
  ('Cartão Santander',            35.73::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago'),
  ('Simples Parcelado',          350.38::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mai/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- DRE Mai/2026
INSERT INTO dre_mensal (
  mes_referencia,
  receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
)
SELECT
  'Mai/2026',
  27798, 16445, 44243,
  9863, 2716.98, 4509.67, 1511.38,
  3266.79, 1665.67, 28273.15,
  15969.85, 11969.85, 4000, 11969.85, 'fechado'
WHERE NOT EXISTS (SELECT 1 FROM dre_mensal WHERE mes_referencia = 'Mai/2026');

-- Orçamento Mai/2026
INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado)
VALUES
  ('Mai/2026', 'Folha',      9863.00, 9863.00),
  ('Mai/2026', 'Software',   2716.98, 2716.98),
  ('Mai/2026', 'Escritório', 4509.67, 4509.67),
  ('Mai/2026', 'Impostos',   4932.46, 4932.46),
  ('Mai/2026', 'Parcelas',   1511.38, 1511.38)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;

-- Histórico MRR Mai/2026
INSERT INTO historico_mrr (mes_referencia, mrr, novos_clientes, churn, expansao)
VALUES ('Mai/2026', 27798, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;

-- ─── 8. SEED JUNHO 2026 ──────────────────────────────────────────────────────

-- Folha Jun/2026 (mesmos valores recorrentes)
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Miguel Dev',     'Desenvolvedor',    3000::numeric, 'PJ',         'Jun/2026', 'pendente'),
  ('Davi Rodrigues', 'Analista',         2000::numeric, 'PJ',         'Jun/2026', 'pendente'),
  ('Antônio Alves',  'Especialista',     1621::numeric, 'Pró-labore', 'Jun/2026', 'pendente'),
  ('Ítalo Augusto',  'Dir. Comercial',   1621::numeric, 'Pró-labore', 'Jun/2026', 'pendente'),
  ('Gabriel Diniz',  'Especialista SEO', 1621::numeric, 'Pró-labore', 'Jun/2026', 'pendente')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Jun/2026');

-- Impostos Jun/2026 (DAS referente a Mai/2026, vence 20/06)
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, data_vencimento, status)
SELECT * FROM (VALUES
  ('DAS',  'Simples Nacional',    3266.79::numeric, 'Jun/2026', 'Mai/2026', '2026-06-20'::date, 'pendente'),
  ('DARF', 'DARF Junho',         1500.00::numeric, 'Jun/2026', 'Jun/2026', '2026-06-30'::date, 'pendente')
) AS v(tipo, descricao, valor, mes_referencia, competencia, data_vencimento, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Jun/2026');

-- Despesas Software Jun/2026 (recorrentes do mês anterior)
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Claude AI pessoal',  110.00::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Claude AI agência',  441.30::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('DataForSEO',         268.07::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('TurboCloud',         215.40::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Magnific Premium',    80.00::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('MeisterLabs',        210.59::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Lovable',            125.35::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Figma',              188.81::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Google Workspace',   490.00::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Hetzner Online',      62.41::numeric, 'Software e Plataformas', 'operacional', true, 'Jun/2026', 'pendente')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jun/2026');

-- Despesas Escritório Jun/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia Cemig',            689.60::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Aluguel Salas',           1665.70::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Condomínio Med Center',    966.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Estacionamento Rodo Park', 343.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Internet',                 140.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Faxineira',                200.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Taxa TFLF UPBR',           336.89::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Taxa TFLF Consultoria',    168.48::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jun/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Jun/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob Gabriel', 1125.27::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jun/2026', 'pendente'),
  ('Cartão Santander',            35.73::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jun/2026', 'pendente'),
  ('Simples Parcelado',          350.38::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jun/2026', 'pendente')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jun/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- Receitas Jun/2026 (clientes recorrentes — pendentes aguardando cobrança)
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_vencimento)
SELECT * FROM (VALUES
  ('Villa Grand Pets',          'Jun/2026',  500.00::numeric, 'pendente', '2026-06-03'::date),
  ('Aquae Deca Tráfego',        'Jun/2026', 1700.00::numeric, 'pendente', '2026-06-14'::date),
  ('Ramá Ipatinga',             'Jun/2026',  491.00::numeric, 'pendente', '2026-06-14'::date),
  ('Casa do Bombeiro',          'Jun/2026',  500.00::numeric, 'pendente', '2026-06-14'::date),
  ('Bragança Capital',          'Jun/2026', 1998.00::numeric, 'pendente', '2026-06-27'::date),
  ('Inova Franquia + Tráfego',  'Jun/2026', 5500.00::numeric, 'pendente', '2026-06-27'::date),
  ('Kind Roofing',              'Jun/2026', 2460.00::numeric, 'pendente', '2026-06-27'::date),
  ('Mais 60 Saúde',             'Jun/2026', 3000.00::numeric, 'pendente', '2026-06-27'::date),
  ('Pratique Segurança',        'Jun/2026',  399.00::numeric, 'pendente', '2026-06-29'::date),
  ('Valore',                    'Jun/2026', 5000.00::numeric, 'pendente', '2026-06-01'::date),
  ('Ricardo Gontijo',           'Jun/2026', 2000.00::numeric, 'pendente', '2026-06-01'::date),
  ('Valorem',                   'Jun/2026', 4000.00::numeric, 'pendente', '2026-06-30'::date),
  ('Manutenção Favela.org',     'Jun/2026',  250.00::numeric, 'pendente', '2026-06-16'::date),
  ('Inova Select',              'Jun/2026', 1500.00::numeric, 'pendente', '2026-06-30'::date),
  ('Lilian Giannasi',           'Jun/2026', 3498.00::numeric, 'pendente', '2026-06-30'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_vencimento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Jun/2026');

-- DRE Jun/2026 (aberto — mês em andamento)
INSERT INTO dre_mensal (
  mes_referencia,
  receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
)
SELECT
  'Jun/2026',
  27798, 0, 27798,
  9863, 2191.93, 4309.67, 1511.38,
  3266.79, 1500, 22642.77,
  5155.23, 5155.23, 4000, 5155.23, 'aberto'
WHERE NOT EXISTS (SELECT 1 FROM dre_mensal WHERE mes_referencia = 'Jun/2026');

-- Orçamento Jun/2026
INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado)
VALUES
  ('Jun/2026', 'Folha',      9863.00, 0),
  ('Jun/2026', 'Software',   2716.98, 0),
  ('Jun/2026', 'Escritório', 4509.67, 0),
  ('Jun/2026', 'Impostos',   4766.79, 0),
  ('Jun/2026', 'Parcelas',   1511.38, 0)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;

-- Histórico MRR Jun/2026
INSERT INTO historico_mrr (mes_referencia, mrr, novos_clientes, churn, expansao)
VALUES ('Jun/2026', 27798, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;

-- Fluxo de caixa Jun/2026 (entradas previstas dos recorrentes)
INSERT INTO fluxo_caixa (tipo, descricao, valor, data_prevista, status, origem, mes_referencia)
SELECT * FROM (VALUES
  ('entrada', 'Valore',                   5000::numeric, '2026-06-01'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Ricardo Gontijo',          2000::numeric, '2026-06-01'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Villa Grand Pets',          500::numeric, '2026-06-03'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Aquae Deca Tráfego',       1700::numeric, '2026-06-14'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Ramá Ipatinga',             491::numeric, '2026-06-14'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Casa do Bombeiro',          500::numeric, '2026-06-14'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Manutenção Favela.org',     250::numeric, '2026-06-16'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Bragança Capital',         1998::numeric, '2026-06-27'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Inova Franquia + Tráfego', 5500::numeric, '2026-06-27'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Kind Roofing',             2460::numeric, '2026-06-27'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Mais 60 Saúde',            3000::numeric, '2026-06-27'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Pratique Segurança',        399::numeric, '2026-06-29'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('entrada', 'Valorem',                  4000::numeric, '2026-06-30'::date, 'previsto', 'receitas', 'Jun/2026'),
  ('saida',   'Folha de Pagamento',        9863::numeric, '2026-06-05'::date, 'previsto', 'folha',    'Jun/2026'),
  ('saida',   'DAS Mai/2026',             3266.79::numeric, '2026-06-20'::date, 'previsto', 'impostos', 'Jun/2026'),
  ('saida',   'Software e Plataformas',   2191.93::numeric, '2026-06-10'::date, 'previsto', 'despesas', 'Jun/2026'),
  ('saida',   'Escritório',               4309.67::numeric, '2026-06-10'::date, 'previsto', 'despesas', 'Jun/2026'),
  ('saida',   'Parcelas',                 1511.38::numeric, '2026-06-10'::date, 'previsto', 'despesas', 'Jun/2026')
) AS v(tipo, descricao, valor, data_prevista, status, origem, mes_referencia)
WHERE NOT EXISTS (SELECT 1 FROM fluxo_caixa WHERE mes_referencia = 'Jun/2026');

-- ─── FIM ─────────────────────────────────────────────────────────────────────
-- Resultado esperado: 19 tabelas criadas, dados Maio fechados, Junho aberto.
