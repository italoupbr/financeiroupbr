-- Upsend Brasil CFO — Schema v2 (additions)
-- Run AFTER schema.sql and seed.sql

-- ─── New tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco text NOT NULL,
  agencia text,
  conta text,
  tipo text DEFAULT 'corrente',
  saldo_atual decimal DEFAULT 0,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id),
  cliente_nome text NOT NULL,
  valor decimal NOT NULL,
  data_inicio date NOT NULL,
  data_vencimento date,
  status text DEFAULT 'ativo',
  renovacao_automatica boolean DEFAULT false,
  observacao text,
  arquivo text,
  criado_em timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prioridade text DEFAULT 'media',
  status text DEFAULT 'ativo',
  data_alerta date,
  origem_tabela text,
  origem_id uuid,
  criado_em timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcamento_mensal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia text NOT NULL,
  categoria text NOT NULL,
  valor_orcado decimal NOT NULL,
  valor_realizado decimal DEFAULT 0,
  criado_em timestamp DEFAULT now(),
  UNIQUE(mes_referencia, categoria)
);

CREATE TABLE IF NOT EXISTS historico_mrr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia text NOT NULL UNIQUE,
  mrr decimal NOT NULL,
  novos_clientes decimal DEFAULT 0,
  churn decimal DEFAULT 0,
  expansao decimal DEFAULT 0,
  criado_em timestamp DEFAULT now()
);

-- ─── Disable RLS ──────────────────────────────────────────────────────────────

ALTER TABLE contas_bancarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE contratos DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_mensal DISABLE ROW LEVEL SECURITY;
ALTER TABLE historico_mrr DISABLE ROW LEVEL SECURITY;

-- ─── Socios: add distribution flag ───────────────────────────────────────────

ALTER TABLE socios ADD COLUMN IF NOT EXISTS participa_distribuicao boolean DEFAULT true;

-- Only the 3 founding socios receive profit distribution
UPDATE socios SET participa_distribuicao = false, percentual = 0
  WHERE nome IN ('Davi Rodrigues', 'Miguel Dev');

-- Correct distribution percentuals for the 3 socios
UPDATE socios SET percentual = 33.33, participa_distribuicao = true WHERE nome = 'Ítalo Ribeiro';
UPDATE socios SET percentual = 33.33, participa_distribuicao = true WHERE nome = 'Gabriel Diniz';
UPDATE socios SET percentual = 33.34, participa_distribuicao = true WHERE nome = 'Antônio Alves';

-- ─── Seed ─────────────────────────────────────────────────────────────────────

INSERT INTO contas_bancarias (banco, agencia, conta, tipo, saldo_atual) VALUES
('Sicoob', '3049', '917990', 'corrente', 0),
('Inter', '0001', 'UPBR', 'corrente', 0)
ON CONFLICT DO NOTHING;

INSERT INTO historico_mrr (mes_referencia, mrr) VALUES
('Mai/2026', 27798)
ON CONFLICT (mes_referencia) DO NOTHING;

INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado) VALUES
('Mai/2026', 'Folha',       9863.00, 9863.00),
('Mai/2026', 'Software',    2716.98, 2716.98),
('Mai/2026', 'Escritório',  4509.67, 4509.67),
('Mai/2026', 'Impostos',    4932.46, 4932.46),
('Mai/2026', 'Parcelas',    1511.38, 1511.38)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;
