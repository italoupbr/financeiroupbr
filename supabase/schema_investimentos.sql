-- Investimentos module
CREATE TABLE IF NOT EXISTS investimentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'outro',
  valor_investido numeric(12,2) DEFAULT 0,
  saldo_atual numeric(12,2) DEFAULT 0,
  taxa_juros numeric(8,4) DEFAULT 0,
  instituicao text,
  data_inicio date,
  data_vencimento date,
  observacao text,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rendimentos_investimentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  investimento_id uuid REFERENCES investimentos(id) ON DELETE CASCADE,
  mes_referencia text NOT NULL,
  rendimento numeric(12,2) DEFAULT 0,
  taxa_aplicada numeric(8,4),
  saldo_anterior numeric(12,2),
  saldo_atual numeric(12,2),
  observacao text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE investimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE rendimentos_investimentos DISABLE ROW LEVEL SECURITY;

-- Seed: initial Caixa Reserva entry
INSERT INTO investimentos (nome, tipo, valor_investido, saldo_atual, ativo)
VALUES ('Caixa Reserva Operacional', 'caixa_reserva', 4000, 4000, true)
ON CONFLICT DO NOTHING;
