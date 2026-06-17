-- Upsend Brasil CFO — Correções pós-importação
-- Problema: WHERE NOT EXISTS no mês bloqueou as receitas variáveis após as recorrentes.
-- Este script usa guards individuais por cliente+mês para inserir só o que falta.
-- Idempotente: seguro re-executar.
-- https://supabase.com/dashboard/project/bmnemeupygblffiphhwj/sql

-- ═══════════════════════════════════════════════════════
-- 1. RECEITAS VARIÁVEIS FALTANDO (Jan–Mai)
-- ═══════════════════════════════════════════════════════

-- Jan/2026 variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status)
SELECT v.cliente_nome, v.mes_referencia, v.valor, v.status
FROM (VALUES
  ('Antonio Bucomaxila', 'Jan/2026',  6750.00::numeric, 'pendente'),
  ('Site Master Drive',  'Jan/2026',  1000.00::numeric, 'pendente'),
  ('Site óptica Tamoio', 'Jan/2026',  2000.00::numeric, 'pendente'),
  ('Grupo Mallard',      'Jan/2026',  1000.00::numeric, 'pendente'),
  ('Isaias',             'Jan/2026',  2457.00::numeric, 'pendente'),
  ('Rios Floor',         'Jan/2026',  6000.00::numeric, 'pendente'),
  ('Pro Dentista',       'Jan/2026',  6323.10::numeric, 'pendente'),
  ('Reino Animal',       'Jan/2026',  1498.00::numeric, 'pendente')
) AS v(cliente_nome, mes_referencia, valor, status)
WHERE NOT EXISTS (
  SELECT 1 FROM receitas r
  WHERE r.mes_referencia = v.mes_referencia AND r.cliente_nome = v.cliente_nome
);

-- Fev/2026 variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT v.cliente_nome, v.mes_referencia, v.valor, v.status, v.data_pagamento
FROM (VALUES
  ('Grupo Mallard',      'Fev/2026', 1000.00::numeric, 'pago',    '2026-03-06'::date),
  ('Pro Squad',          'Fev/2026', 2580.00::numeric, 'pago',    '2026-03-05'::date),
  ('Aquae Ipatinga',     'Fev/2026',  700.00::numeric, 'pago',    '2026-03-05'::date),
  ('Casa do Bombeiro',   'Fev/2026', 3000.00::numeric, 'pago',    '2026-03-05'::date),
  ('Ubox',               'Fev/2026',  249.00::numeric, 'pago',    '2026-02-20'::date),
  ('Ricardo Gontijo',    'Fev/2026', 4000.00::numeric, 'pago',    '2026-02-27'::date),
  ('Aquae Bot Conversa', 'Fev/2026',  297.00::numeric, 'pendente', NULL::date),
  ('Bragança Capital',   'Fev/2026', 2498.00::numeric, 'pendente', NULL::date),
  ('Inova franquias',    'Fev/2026', 4497.00::numeric, 'pendente', NULL::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (
  SELECT 1 FROM receitas r
  WHERE r.mes_referencia = v.mes_referencia AND r.cliente_nome = v.cliente_nome
);

-- Mar/2026 variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status)
SELECT v.cliente_nome, v.mes_referencia, v.valor, v.status
FROM (VALUES
  ('Bragança Capital', 'Mar/2026', 2498.00::numeric, 'pendente'),
  ('Valorem',          'Mar/2026', 9200.00::numeric, 'pendente'),
  ('Lucas Galy',       'Mar/2026', 4449.00::numeric, 'pendente'),
  ('Sistempay',        'Mar/2026', 2800.00::numeric, 'pendente')
) AS v(cliente_nome, mes_referencia, valor, status)
WHERE NOT EXISTS (
  SELECT 1 FROM receitas r
  WHERE r.mes_referencia = v.mes_referencia AND r.cliente_nome = v.cliente_nome
);

-- Abr/2026 variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status)
SELECT v.cliente_nome, v.mes_referencia, v.valor, v.status
FROM (VALUES
  ('Kind Roofing',    'Abr/2026',  2460.72::numeric, 'pendente'),
  ('Inova Franquias', 'Abr/2026',  1499.00::numeric, 'pendente'),
  ('Meu Ultrassom',   'Abr/2026',  6346.00::numeric, 'pendente'),
  ('Dr Márcio',       'Abr/2026',  1500.00::numeric, 'pendente'),
  ('Deca Aquae',      'Abr/2026',   297.00::numeric, 'pendente'),
  ('Clínica Mais 60', 'Abr/2026',  9995.00::numeric, 'pendente')
) AS v(cliente_nome, mes_referencia, valor, status)
WHERE NOT EXISTS (
  SELECT 1 FROM receitas r
  WHERE r.mes_referencia = v.mes_referencia AND r.cliente_nome = v.cliente_nome
);

-- Mai/2026 variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT v.cliente_nome, v.mes_referencia, v.valor, v.status, v.data_pagamento
FROM (VALUES
  ('Inova Select',   'Mai/2026', 1500.00::numeric, 'pago', '2026-06-05'::date),
  ('Lilian Giannasi','Mai/2026', 2498.00::numeric, 'pago', '2026-05-19'::date),
  ('Pizza Point',    'Mai/2026',  147.00::numeric, 'pago', '2026-06-09'::date),
  ('Lucas Galy',     'Mai/2026', 2499.00::numeric, 'pago', '2026-06-09'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (
  SELECT 1 FROM receitas r
  WHERE r.mes_referencia = v.mes_referencia AND r.cliente_nome = v.cliente_nome
);

-- ═══════════════════════════════════════════════════════
-- 2. FOLHA JUNHO — adicionar Fernando Safar + corrigir Davi
-- ═══════════════════════════════════════════════════════

-- Adiciona Fernando Safar se não existe
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT 'Fernando Safar', 'Analista', 500.00, 'PJ', 'Jun/2026', 'pendente'
WHERE NOT EXISTS (
  SELECT 1 FROM folha_pagamento
  WHERE mes_referencia = 'Jun/2026' AND funcionario = 'Fernando Safar'
);

-- Corrige salário do Davi em Jun (estava 2000, planilha diz 1906)
UPDATE folha_pagamento
SET salario = 1906.00
WHERE mes_referencia = 'Jun/2026' AND funcionario = 'Davi Rodrigues';

-- ═══════════════════════════════════════════════════════
-- 3. DRE JUNHO — atualiza folha_total com os valores reais
--    Folha real: Miguel 3000 + Fernando 500 + Davi 1906 + 3× 1621 = 10269
-- ═══════════════════════════════════════════════════════

UPDATE dre_mensal SET
  folha_total        = 10269.00,
  despesa_total      = 10269.00 + despesas_software + despesas_escritorio + despesas_parcelas + impostos_das + impostos_outros,
  ebitda             = receita_total - (10269.00 + despesas_software + despesas_escritorio + despesas_parcelas + impostos_das + impostos_outros),
  lucro_liquido      = receita_total - (10269.00 + despesas_software + despesas_escritorio + despesas_parcelas + impostos_das + impostos_outros) - caixa_reserva,
  lucro_distribuivel = receita_total - (10269.00 + despesas_software + despesas_escritorio + despesas_parcelas + impostos_das + impostos_outros) - caixa_reserva
WHERE mes_referencia = 'Jun/2026';

-- ═══════════════════════════════════════════════════════
-- 4. CLIENTES — adicionar os novos que apareceram no histórico
--    e não estavam no seed original
-- ═══════════════════════════════════════════════════════

INSERT INTO clientes (nome, tipo, ativo)
SELECT v.nome, v.tipo, false
FROM (VALUES
  ('Antonio Bucomaxila', 'variavel'),
  ('Site Master Drive',  'variavel'),
  ('Site óptica Tamoio', 'variavel'),
  ('Grupo Mallard',      'variavel'),
  ('Isaias',             'variavel'),
  ('Pro Dentista',       'variavel'),
  ('Reino Animal',       'variavel'),
  ('Pro Squad',          'variavel'),
  ('Aquae Ipatinga',     'variavel'),
  ('Ubox',               'variavel'),
  ('Aquae Bot Conversa', 'variavel'),
  ('Inova franquias',    'variavel'),
  ('Valorem',            'variavel'),
  ('Lucas Galy',         'variavel'),
  ('Sistempay',          'variavel'),
  ('Meu Ultrassom',      'variavel'),
  ('Dr Márcio',          'variavel'),
  ('Deca Aquae',         'variavel'),
  ('Clínica Mais 60',    'variavel'),
  ('Leo Web Designer',   'variavel'),
  ('Rios Floor',         'variavel'),
  ('Clínica Blanvur',    'variavel'),
  ('Aquae Deca SEO',     'variavel')
) AS v(nome, tipo)
WHERE NOT EXISTS (
  SELECT 1 FROM clientes c WHERE lower(c.nome) = lower(v.nome)
);

-- ─── FIM ─────────────────────────────────────────────────────────────────────
