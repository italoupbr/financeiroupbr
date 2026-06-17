-- Upsend Brasil CFO — Histórico 2026 (Jan–Jun)
-- Gerado automaticamente a partir das planilhas originais.
-- Idempotente: seguro para re-executar.
-- Execute no SQL Editor: https://supabase.com/dashboard/project/bmnemeupygblffiphhwj/sql

-- ═══════════════════════════════════════════════════════
-- JANEIRO 2026
-- Receita recorrente: R$ 11.140,00
-- Receita variável:   R$ 27.028,10
-- Receita total:      R$ 38.168,10
-- Folha total:        R$ 9.666,00
-- Despesa total:      R$ 22.477,71
-- EBITDA:             R$ 15.690,39
-- Lucro líquido:      R$ 11.690,39
-- ═══════════════════════════════════════════════════════

-- Receitas Jan/2026 — Recorrentes
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Pratique Segurança',   'Jan/2026',  350.00::numeric, 'pago', '2026-02-07'::date),
  ('Villa Grand Pets',     'Jan/2026',  496.00::numeric, 'pago', '2026-01-12'::date),
  ('Clínica Blanvur',      'Jan/2026', 2299.00::numeric, 'pago', '2026-02-05'::date),
  ('Aquae Deca trafego',   'Jan/2026', 1500.00::numeric, 'pago', '2026-01-23'::date),
  ('Valore',               'Jan/2026', 5000.00::numeric, 'pago', '2026-02-05'::date),
  ('Aquae Deca SEO',       'Jan/2026', 1495.00::numeric, 'pago', '2026-02-06'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Jan/2026');

-- Receitas Jan/2026 — Variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Antonio Bucomaxila', 'Jan/2026',  6750.00::numeric, 'pendente', NULL::date),
  ('Site Master Drive',  'Jan/2026',  1000.00::numeric, 'pendente', NULL::date),
  ('Site óptica Tamoio', 'Jan/2026',  2000.00::numeric, 'pendente', NULL::date),
  ('Grupo Mallard',      'Jan/2026',  1000.00::numeric, 'pendente', NULL::date),
  ('Isaias',             'Jan/2026',  2457.00::numeric, 'pendente', NULL::date),
  ('Rios Floor',         'Jan/2026',  6000.00::numeric, 'pendente', NULL::date),
  ('Pro Dentista',       'Jan/2026',  6323.10::numeric, 'pendente', NULL::date),
  ('Reino Animal',       'Jan/2026',  1498.00::numeric, 'pendente', NULL::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Jan/2026');

-- Folha Jan/2026
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Leo Web Designer', 'Web Designer',    850.00::numeric, 'PJ',         'Jan/2026', 'pago'),
  ('Fernando Safar',   'Analista',       2406.00::numeric, 'PJ',         'Jan/2026', 'pago'),
  ('Davi Rodrigues',   'Analista',       1906.00::numeric, 'PJ',         'Jan/2026', 'pago'),
  ('Antônio Alves',    'Especialista',   1518.00::numeric, 'Pró-labore', 'Jan/2026', 'pago'),
  ('Ítalo Augusto',    'Dir. Comercial', 1468.00::numeric, 'Pró-labore', 'Jan/2026', 'pago'),
  ('Gabriel Diniz',    'Especialista SEO', 1518.00::numeric, 'Pró-labore', 'Jan/2026', 'pago')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Jan/2026');

-- Despesas Software Jan/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Turbocloud',        215.40::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('Contabilizei',      569.59::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('Enhancer',           25.91::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('Reportei',          109.90::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('Lovable',           134.13::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('Lovable',           132.20::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('WIX Domínio',       111.00::numeric, 'Software e Plataformas', 'operacional', false, 'Jan/2026', 'pago'),
  ('Envato Elements',   172.59::numeric, 'Software e Plataformas', 'operacional', false, 'Jan/2026', 'pago'),
  ('Workspace',         490.00::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('Hetzner Online',     45.97::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago'),
  ('Cap Cut',            65.90::numeric, 'Software e Plataformas', 'operacional', true,  'Jan/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jan/2026');

-- Despesas Escritório Jan/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia',           946.39::numeric, 'Escritório', 'operacional', true, 'Jan/2026', 'pago'),
  ('Aluguel',          1631.33::numeric, 'Escritório', 'operacional', true, 'Jan/2026', 'pago'),
  ('Condomínio',        966.00::numeric, 'Escritório', 'operacional', true, 'Jan/2026', 'pago'),
  ('Estacionamento',    343.00::numeric, 'Escritório', 'operacional', true, 'Jan/2026', 'pago'),
  ('Internet',          140.00::numeric, 'Escritório', 'operacional', true, 'Jan/2026', 'pago'),
  ('Nalva Faxineira',   145.00::numeric, 'Escritório', 'operacional', true, 'Jan/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jan/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Jan/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob', 632.14::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jan/2026', 'pago'),
  ('Cartão Santander',   35.90::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jan/2026', 'pago'),
  ('Simples Parcelado', 343.78::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jan/2026', 'pago'),
  ('Cartão Santander',  440.00::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jan/2026', 'pago'),
  ('Darf Parcelado',    570.55::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jan/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jan/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- Impostos Jan/2026
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, status)
SELECT * FROM (VALUES
  ('DAS',        'Simples Nacional',      3435.13::numeric, 'Jan/2026', 'Dez/2025', 'pago'),
  ('taxa_conta', 'Taxa Conta Corrente',     69.90::numeric, 'Jan/2026', 'Jan/2026', 'pago'),
  ('DARF',       'DARF Janeiro',          1000.00::numeric, 'Jan/2026', 'Jan/2026', 'pago'),
  ('taxa_conta', 'Tarifa Conta Sicoob',     40.00::numeric, 'Jan/2026', 'Jan/2026', 'pago')
) AS v(tipo, descricao, valor, mes_referencia, competencia, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Jan/2026');

-- Faturas Cartão Jan/2026
INSERT INTO faturas_cartao (cartao, descricao, valor, data_compra, mes_fatura)
SELECT * FROM (VALUES
  ('Inter',     'Sem Rush (Conta Inter)',       4613.50::numeric, '2025-11-17'::date, 'Jan/2026'),
  ('Santander', '2 Parcela lente camêra',        119.33::numeric, '2026-12-18'::date, 'Jan/2026'),
  ('Santander', '99*',                             8.80::numeric, '2026-01-08'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.70::numeric, '2026-01-09'::date, 'Jan/2026'),
  ('Santander', '99* visita cliente',             42.80::numeric, '2026-01-09'::date, 'Jan/2026'),
  ('Santander', '99* visita cliente',             40.00::numeric, '2026-01-09'::date, 'Jan/2026'),
  ('Santander', '99*',                             4.50::numeric, '2026-01-09'::date, 'Jan/2026'),
  ('Santander', '99*',                             4.72::numeric, '2026-01-12'::date, 'Jan/2026'),
  ('Santander', '99*',                             5.18::numeric, '2026-01-13'::date, 'Jan/2026'),
  ('Santander', '99*',                            14.40::numeric, '2026-01-13'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.30::numeric, '2026-01-13'::date, 'Jan/2026'),
  ('Santander', '99*',                             8.40::numeric, '2026-01-14'::date, 'Jan/2026'),
  ('Santander', 'Turbocloud',                     35.90::numeric, '2026-01-15'::date, 'Jan/2026'),
  ('Santander', 'Contabilizei',                  376.62::numeric, '2026-01-15'::date, 'Jan/2026'),
  ('Santander', 'Contabilizei',                  192.97::numeric, '2026-01-15'::date, 'Jan/2026'),
  ('Santander', 'Reportei',                      109.90::numeric, '2026-01-15'::date, 'Jan/2026'),
  ('Santander', '99*',                            10.55::numeric, '2026-01-15'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.00::numeric, '2026-01-16'::date, 'Jan/2026'),
  ('Santander', '99*',                             7.39::numeric, '2026-01-19'::date, 'Jan/2026'),
  ('Santander', 'Supermercado Mania Gostosa',     69.98::numeric, '2026-01-19'::date, 'Jan/2026'),
  ('Santander', 'Lovable',                       134.13::numeric, '2026-01-19'::date, 'Jan/2026'),
  ('Santander', '99*',                             7.74::numeric, '2026-01-19'::date, 'Jan/2026'),
  ('Santander', 'Eletrica Apolo',                 65.00::numeric, '2026-01-19'::date, 'Jan/2026'),
  ('Santander', '99*',                            10.20::numeric, '2026-01-20'::date, 'Jan/2026'),
  ('Santander', 'Turbocloud',                     35.90::numeric, '2026-01-21'::date, 'Jan/2026'),
  ('Santander', 'Turbocloud',                     35.90::numeric, '2026-01-21'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.20::numeric, '2026-01-21'::date, 'Jan/2026'),
  ('Santander', 'Bot Conversa Aquae',            297.00::numeric, '2026-01-22'::date, 'Jan/2026'),
  ('Santander', '99*',                            10.20::numeric, '2026-01-22'::date, 'Jan/2026'),
  ('Santander', '99*',                            14.10::numeric, '2026-01-23'::date, 'Jan/2026'),
  ('Santander', 'Uber',                           13.91::numeric, '2026-01-24'::date, 'Jan/2026'),
  ('Santander', '99*',                            22.94::numeric, '2026-01-24'::date, 'Jan/2026'),
  ('Santander', '99*',                            21.00::numeric, '2026-01-24'::date, 'Jan/2026'),
  ('Santander', '99*',                            15.20::numeric, '2026-01-24'::date, 'Jan/2026'),
  ('Santander', 'Uber',                           12.95::numeric, '2026-01-24'::date, 'Jan/2026'),
  ('Santander', 'Lovable',                       132.20::numeric, '2026-01-24'::date, 'Jan/2026'),
  ('Santander', 'Enhancer',                       25.91::numeric, '2026-01-25'::date, 'Jan/2026'),
  ('Santander', 'Turbocloud',                     71.80::numeric, '2026-01-26'::date, 'Jan/2026'),
  ('Santander', '99*',                             9.40::numeric, '2026-01-26'::date, 'Jan/2026'),
  ('Santander', 'Turbocloud',                     35.90::numeric, '2026-01-27'::date, 'Jan/2026'),
  ('Santander', '99*',                             8.50::numeric, '2026-01-27'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.10::numeric, '2026-01-28'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.20::numeric, '2026-01-29'::date, 'Jan/2026'),
  ('Santander', 'WIX upsendbrasil.com',          111.00::numeric, '2026-01-29'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.20::numeric, '2026-01-30'::date, 'Jan/2026'),
  ('Santander', 'Envato Elements',               172.59::numeric, '2026-02-01'::date, 'Jan/2026'),
  ('Santander', 'Google Workspace',              490.00::numeric, '2026-02-01'::date, 'Jan/2026'),
  ('Santander', '99*',                             5.76::numeric, '2026-02-03'::date, 'Jan/2026'),
  ('Santander', 'Meu Tim UPBR',                   15.00::numeric, '2026-02-03'::date, 'Jan/2026'),
  ('Santander', '99*',                            13.20::numeric, '2026-02-03'::date, 'Jan/2026'),
  ('Santander', '99*',                            16.10::numeric, '2026-02-04'::date, 'Jan/2026'),
  ('Santander', 'Hetzner Online',                 45.97::numeric, '2026-02-05'::date, 'Jan/2026'),
  ('Santander', '99*',                             6.20::numeric, '2026-02-06'::date, 'Jan/2026'),
  ('Santander', 'Cap Cut',                        65.90::numeric, '2026-02-06'::date, 'Jan/2026'),
  ('Santander', '99*',                            10.20::numeric, '2026-02-06'::date, 'Jan/2026'),
  ('Santander', 'Claude.AI',                     110.00::numeric, '2026-02-09'::date, 'Jan/2026')
) AS v(cartao, descricao, valor, data_compra, mes_fatura)
WHERE NOT EXISTS (SELECT 1 FROM faturas_cartao WHERE mes_fatura = 'Jan/2026');

-- DRE Jan/2026
INSERT INTO dre_mensal (
  mes_referencia,
  receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
)
SELECT
  'Jan/2026',
  11140.00, 27028.10, 38168.10,
  9666.00, 2072.59, 4171.72, 2022.37,
  3435.13, 1109.90, 22477.71,
  15690.39, 11690.39, 4000.00, 11690.39, 'fechado'
WHERE NOT EXISTS (SELECT 1 FROM dre_mensal WHERE mes_referencia = 'Jan/2026');

-- Orçamento Jan/2026
INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado)
VALUES
  ('Jan/2026', 'Folha',      9666.00,  9666.00),
  ('Jan/2026', 'Software',   2072.59,  2072.59),
  ('Jan/2026', 'Escritório', 4171.72,  4171.72),
  ('Jan/2026', 'Impostos',   4545.03,  4545.03),
  ('Jan/2026', 'Parcelas',   2022.37,  2022.37)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;

-- Histórico MRR Jan/2026
INSERT INTO historico_mrr (mes_referencia, mrr, novos_clientes, churn, expansao)
VALUES ('Jan/2026', 11140.00, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;


-- ═══════════════════════════════════════════════════════
-- FEVEREIRO 2026
-- Receita recorrente: R$ 16.748,00
-- Receita variável:   R$ 18.821,00
-- Receita total:      R$ 35.569,00
-- Folha total:        R$ 10.566,00
-- Despesa total:      R$ 23.578,99
-- EBITDA:             R$ 11.990,01
-- Lucro líquido:      R$ 7.990,01
-- ═══════════════════════════════════════════════════════

-- Receitas Fev/2026 — Recorrentes
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Villa Grand Pets',   'Fev/2026',  500.00::numeric, 'pago', '2026-02-12'::date),
  ('Aquae Deca trafego', 'Fev/2026', 1200.00::numeric, 'pago', '2026-02-23'::date),
  ('Valore',             'Fev/2026', 5000.00::numeric, 'pago', '2026-03-05'::date),
  ('Pro Squad',          'Fev/2026', 3400.00::numeric, 'pago', '2026-03-05'::date),
  ('Rios Floor',         'Fev/2026', 4000.00::numeric, 'pago', '2026-03-05'::date),
  ('Clínica Blanvur',    'Fev/2026', 2298.00::numeric, 'pago', '2026-03-05'::date),
  ('Pratique Segurança', 'Fev/2026',  350.00::numeric, 'pago', '2026-02-07'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Fev/2026');

-- Receitas Fev/2026 — Variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Grupo Mallard',    'Fev/2026', 1000.00::numeric, 'pago',    '2026-03-06'::date),
  ('Pro Squad',        'Fev/2026', 2580.00::numeric, 'pago',    '2026-03-05'::date),
  ('Aquae Ipatinga',   'Fev/2026',  700.00::numeric, 'pago',    '2026-03-05'::date),
  ('Casa do Bombeiro', 'Fev/2026', 3000.00::numeric, 'pago',    '2026-03-05'::date),
  ('Ubox',             'Fev/2026',  249.00::numeric, 'pago',    '2026-02-20'::date),
  ('Ricardo Gontijo',  'Fev/2026', 4000.00::numeric, 'pago',    '2026-02-27'::date),
  ('Aquae Bot Conversa','Fev/2026', 297.00::numeric, 'pendente', NULL::date),
  ('Bragança Capital', 'Fev/2026', 2498.00::numeric, 'pendente', NULL::date),
  ('Inova franquias',  'Fev/2026', 4497.00::numeric, 'pendente', NULL::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Fev/2026');

-- Folha Fev/2026
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Leo Web Designer', 'Web Designer',    1700.00::numeric, 'PJ',         'Fev/2026', 'pago'),
  ('Fernando Safar',   'Analista',        2406.00::numeric, 'PJ',         'Fev/2026', 'pago'),
  ('Davi Rodrigues',   'Analista',        1906.00::numeric, 'PJ',         'Fev/2026', 'pago'),
  ('Antônio Alves',    'Especialista',    1518.00::numeric, 'Pró-labore', 'Fev/2026', 'pago'),
  ('Ítalo Augusto',    'Dir. Comercial',  1518.00::numeric, 'Pró-labore', 'Fev/2026', 'pago'),
  ('Gabriel Diniz',    'Especialista SEO', 1518.00::numeric, 'Pró-labore', 'Fev/2026', 'pago')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Fev/2026');

-- Despesas Software Fev/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Free Pik',           80.00::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Claude AI',         110.00::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Vidiq Youtube',     324.00::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Turbocloud',        214.60::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Lovable',           129.21::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Enhancer',           25.32::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Envato Elements',   169.95::numeric,  'Software e Plataformas', 'operacional', false, 'Fev/2026', 'pago'),
  ('Google Workspace',  490.00::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Registro.br',        40.00::numeric,  'Software e Plataformas', 'operacional', false, 'Fev/2026', 'pago'),
  ('Capcut',             65.90::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Hetzner Online',     45.74::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago'),
  ('Claude AI',         110.00::numeric,  'Software e Plataformas', 'operacional', true,  'Fev/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Fev/2026');

-- Despesas Escritório Fev/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia',      728.86::numeric, 'Escritório', 'operacional', true, 'Fev/2026', 'pago'),
  ('Aluguel',     1455.96::numeric, 'Escritório', 'operacional', true, 'Fev/2026', 'pago'),
  ('Condomínio',   966.00::numeric, 'Escritório', 'operacional', true, 'Fev/2026', 'pago'),
  ('Estacionamento', 343.00::numeric, 'Escritório', 'operacional', true, 'Fev/2026', 'pago'),
  ('Internet',     140.00::numeric, 'Escritório', 'operacional', true, 'Fev/2026', 'pago'),
  ('Faxineira',    100.00::numeric, 'Escritório', 'operacional', true, 'Fev/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Fev/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Fev/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob',  632.14::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Fev/2026', 'pago'),
  ('Cartão Santander',    35.73::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Fev/2026', 'pago'),
  ('Simples Parcelado',  347.33::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Fev/2026', 'pago'),
  ('Cartão Santander',   440.00::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Fev/2026', 'pago'),
  ('Darf Parcelado',     582.87::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Fev/2026', 'pago'),
  ('Empréstimo Sicoob', 1125.27::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Fev/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Fev/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- Impostos Fev/2026
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, status)
SELECT * FROM (VALUES
  ('DAS',        'Simples Nacional',      3201.21::numeric, 'Fev/2026', 'Jan/2026', 'pago'),
  ('taxa_conta', 'Taxa Conta Corrente',     69.90::numeric, 'Fev/2026', 'Fev/2026', 'pago'),
  ('DARF',       'DARF Fevereiro',         1000.00::numeric, 'Fev/2026', 'Fev/2026', 'pago'),
  ('taxa_conta', 'Tarifa Conta Sicoob',     40.00::numeric, 'Fev/2026', 'Fev/2026', 'pago')
) AS v(tipo, descricao, valor, mes_referencia, competencia, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Fev/2026');

-- Faturas Cartão Fev/2026
INSERT INTO faturas_cartao (cartao, descricao, valor, data_compra, mes_fatura)
SELECT * FROM (VALUES
  ('Inter',     'Sem Rush (Conta Inter)',           4095.00::numeric, '2025-11-17'::date, 'Fev/2026'),
  ('Santander', '3 Parcela lente camêra',            119.33::numeric, '2026-12-18'::date, 'Fev/2026'),
  ('Santander', 'Claude AI',                         110.00::numeric, '2026-02-09'::date, 'Fev/2026'),
  ('Santander', 'Vidiq Youtube',                     324.00::numeric, '2026-02-10'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.50::numeric, '2026-02-10'::date, 'Fev/2026'),
  ('Santander', '99*',                                12.30::numeric, '2026-02-10'::date, 'Fev/2026'),
  ('Santander', 'Uber',                               10.93::numeric, '2026-02-11'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.50::numeric, '2026-02-11'::date, 'Fev/2026'),
  ('Santander', 'Free Pik',                           80.00::numeric, '2026-02-12'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.40::numeric, '2026-02-12'::date, 'Fev/2026'),
  ('Santander', '99*',                                 9.28::numeric, '2026-02-12'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.30::numeric, '2026-02-13'::date, 'Fev/2026'),
  ('Santander', 'Araujo Cheiro para sala',            24.99::numeric, '2026-02-13'::date, 'Fev/2026'),
  ('Santander', '99*',                                 5.90::numeric, '2026-02-13'::date, 'Fev/2026'),
  ('Santander', 'Uber',                                7.13::numeric, '2026-02-15'::date, 'Fev/2026'),
  ('Santander', 'Contabilizei UPBR',                 369.00::numeric, '2026-02-15'::date, 'Fev/2026'),
  ('Santander', 'Contabilizei Consultoria',          189.00::numeric, '2026-02-15'::date, 'Fev/2026'),
  ('Santander', 'Reportei',                          109.90::numeric, '2026-02-15'::date, 'Fev/2026'),
  ('Santander', 'Lovable',                            81.57::numeric, '2026-02-16'::date, 'Fev/2026'),
  ('Santander', '99*',                                 5.86::numeric, '2026-02-17'::date, 'Fev/2026'),
  ('Santander', 'Turbocloud',                         35.90::numeric, '2026-02-18'::date, 'Fev/2026'),
  ('Santander', '99*',                                 8.00::numeric, '2026-02-19'::date, 'Fev/2026'),
  ('Santander', '99* reunião Antonio Buco BH',        12.20::numeric, '2026-02-19'::date, 'Fev/2026'),
  ('Santander', '99* reunião Antonio Buco BH',        11.70::numeric, '2026-02-19'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.50::numeric, '2026-02-20'::date, 'Fev/2026'),
  ('Santander', '99* Gcrie Oitava',                   22.95::numeric, '2026-02-21'::date, 'Fev/2026'),
  ('Santander', '99* Gcrie Oitava',                   16.30::numeric, '2026-02-21'::date, 'Fev/2026'),
  ('Santander', '99*',                                 4.50::numeric, '2026-02-22'::date, 'Fev/2026'),
  ('Santander', '99*',                                 4.50::numeric, '2026-02-22'::date, 'Fev/2026'),
  ('Santander', 'Turbocloud',                         35.90::numeric, '2026-02-23'::date, 'Fev/2026'),
  ('Santander', 'Turbocloud',                         35.90::numeric, '2026-02-23'::date, 'Fev/2026'),
  ('Santander', '99*',                                10.10::numeric, '2026-02-23'::date, 'Fev/2026'),
  ('Santander', 'Turbocloud',                         71.80::numeric, '2026-02-24'::date, 'Fev/2026'),
  ('Santander', 'Lovable',                           129.21::numeric, '2026-02-24'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.50::numeric, '2026-02-25'::date, 'Fev/2026'),
  ('Santander', 'Enhancer',                           25.32::numeric, '2026-02-25'::date, 'Fev/2026'),
  ('Santander', 'Bot Conversa',                      297.00::numeric, '2026-02-25'::date, 'Fev/2026'),
  ('Santander', 'Turbocloud',                         35.90::numeric, '2026-02-27'::date, 'Fev/2026'),
  ('Santander', '99* ProDentista',                    14.40::numeric, '2026-02-27'::date, 'Fev/2026'),
  ('Santander', '99* ProDentista',                    15.10::numeric, '2026-02-27'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.60::numeric, '2026-02-28'::date, 'Fev/2026'),
  ('Santander', 'Apollo Elétrica',                    48.30::numeric, '2026-02-28'::date, 'Fev/2026'),
  ('Santander', 'Assaí saco de lixo',                 13.70::numeric, '2026-02-28'::date, 'Fev/2026'),
  ('Santander', 'Envato Elements',                   169.56::numeric, '2026-03-01'::date, 'Fev/2026'),
  ('Santander', 'Google Workspace',                  490.00::numeric, '2026-03-01'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.10::numeric, '2026-03-01'::date, 'Fev/2026'),
  ('Santander', '99*',                                 5.35::numeric, '2026-03-02'::date, 'Fev/2026'),
  ('Santander', 'Registro.br',                        40.00::numeric, '2026-03-02'::date, 'Fev/2026'),
  ('Santander', '99*',                                 4.32::numeric, '2026-03-03'::date, 'Fev/2026'),
  ('Santander', '99*',                                 9.70::numeric, '2026-03-04'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.30::numeric, '2026-03-04'::date, 'Fev/2026'),
  ('Santander', 'Assaí garrafa térmica',              33.37::numeric, '2026-03-05'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.10::numeric, '2026-03-05'::date, 'Fev/2026'),
  ('Santander', 'Hetzner Online',                     45.74::numeric, '2026-03-05'::date, 'Fev/2026'),
  ('Santander', '99*',                                 4.60::numeric, '2026-03-06'::date, 'Fev/2026'),
  ('Santander', 'Cap Cut',                            65.90::numeric, '2026-03-06'::date, 'Fev/2026'),
  ('Santander', '99*',                                 6.10::numeric, '2026-03-06'::date, 'Fev/2026'),
  ('Santander', '99*',                                 9.27::numeric, '2026-03-09'::date, 'Fev/2026'),
  ('Santander', 'claude.ai',                         110.00::numeric, '2026-03-09'::date, 'Fev/2026')
) AS v(cartao, descricao, valor, data_compra, mes_fatura)
WHERE NOT EXISTS (SELECT 1 FROM faturas_cartao WHERE mes_fatura = 'Fev/2026');

-- DRE Fev/2026
INSERT INTO dre_mensal (
  mes_referencia,
  receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
)
SELECT
  'Fev/2026',
  16748.00, 18821.00, 35569.00,
  10566.00, 1804.72, 3733.82, 3163.34,
  3201.21, 1109.90, 23579.00,
  11990.00, 7990.00, 4000.00, 7990.00, 'fechado'
WHERE NOT EXISTS (SELECT 1 FROM dre_mensal WHERE mes_referencia = 'Fev/2026');

-- Orçamento Fev/2026
INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado)
VALUES
  ('Fev/2026', 'Folha',      10566.00, 10566.00),
  ('Fev/2026', 'Software',    1804.72,  1804.72),
  ('Fev/2026', 'Escritório',  3733.82,  3733.82),
  ('Fev/2026', 'Impostos',    4311.11,  4311.11),
  ('Fev/2026', 'Parcelas',    3163.34,  3163.34)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;

-- Histórico MRR Fev/2026
INSERT INTO historico_mrr (mes_referencia, mrr, novos_clientes, churn, expansao)
VALUES ('Fev/2026', 16748.00, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;


-- ═══════════════════════════════════════════════════════
-- MARÇO 2026
-- Receita recorrente: R$ 22.834,77
-- Receita variável:   R$ 18.947,00
-- Receita total:      R$ 41.781,77
-- Folha total:        R$ 9.969,00
-- Despesa total:      R$ 23.850,63
-- EBITDA:             R$ 17.931,14
-- Lucro líquido:      R$ 13.931,14
-- ═══════════════════════════════════════════════════════

-- Receitas Mar/2026 — Recorrentes
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Villa Grand Pets',   'Mar/2026',  495.00::numeric, 'pago', '2026-02-12'::date),
  ('Aquae Deca trafego', 'Mar/2026', 1700.00::numeric, 'pago', '2026-02-23'::date),
  ('Ramá Ipatinga',      'Mar/2026',  500.00::numeric, 'pago', '2026-02-23'::date),
  ('Casa do bombeiro',   'Mar/2026',  491.28::numeric, 'pago', '2026-02-23'::date),
  ('Rios Floor',         'Mar/2026', 4000.00::numeric, 'pago', '2026-04-05'::date),
  ('Clínica Blanvur',    'Mar/2026', 2298.49::numeric, 'pago', '2026-04-05'::date),
  ('Bragança Capital',   'Mar/2026', 2000.00::numeric, 'pago', '2026-04-05'::date),
  ('Pratique Segurança', 'Mar/2026',  350.00::numeric, 'pago', '2026-04-07'::date),
  ('Valore',             'Mar/2026', 5000.00::numeric, 'pago', '2026-04-10'::date),
  ('Ricardo Gontijo',    'Mar/2026', 2000.00::numeric, 'pago', '2026-04-10'::date),
  ('Inova franquia',     'Mar/2026', 4000.00::numeric, 'pago', '2026-04-05'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Mar/2026');

-- Receitas Mar/2026 — Variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Bragança Capital', 'Mar/2026',  2498.00::numeric, 'pendente', NULL::date),
  ('Valorem',          'Mar/2026',  9200.00::numeric, 'pendente', NULL::date),
  ('Lucas Galy',       'Mar/2026',  4449.00::numeric, 'pendente', NULL::date),
  ('Sistempay',        'Mar/2026',  2800.00::numeric, 'pendente', NULL::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Mar/2026');

-- Folha Mar/2026
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Leo Web Designer', 'Web Designer',    1700.00::numeric, 'PJ',         'Mar/2026', 'pago'),
  ('Fernando Safar',   'Analista',        1500.00::numeric, 'PJ',         'Mar/2026', 'pago'),
  ('Davi Rodrigues',   'Analista',        1906.00::numeric, 'PJ',         'Mar/2026', 'pago'),
  ('Antônio Alves',    'Especialista',    1621.00::numeric, 'Pró-labore', 'Mar/2026', 'pago'),
  ('Ítalo Augusto',    'Dir. Comercial',  1621.00::numeric, 'Pró-labore', 'Mar/2026', 'pago'),
  ('Gabriel Diniz',    'Especialista SEO', 1621.00::numeric, 'Pró-labore', 'Mar/2026', 'pago')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Mar/2026');

-- Despesas Software Mar/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Claude AI',                110.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Lovable',                   80.46::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('FreePik',                   80.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Contabilizei UPBR',        369.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Contabilizei Consultoria', 189.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Reportei',                 109.90::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Turbocloud',               215.40::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Lovable',                  131.50::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Enhancer',                  25.77::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Figma',                    104.75::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Envato',                   172.24::numeric, 'Software e Plataformas', 'operacional', false, 'Mar/2026', 'pago'),
  ('Google Workspace',         490.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago'),
  ('Cap Cut',                   65.90::numeric, 'Software e Plataformas', 'operacional', true,  'Mar/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mar/2026');

-- Despesas Escritório Mar/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia',       799.13::numeric, 'Escritório', 'operacional', true, 'Mar/2026', 'pago'),
  ('Aluguel',      1665.70::numeric, 'Escritório', 'operacional', true, 'Mar/2026', 'pago'),
  ('Condomínio',    966.00::numeric, 'Escritório', 'operacional', true, 'Mar/2026', 'pago'),
  ('Estacionamento', 343.00::numeric, 'Escritório', 'operacional', true, 'Mar/2026', 'pago'),
  ('Internet',      140.00::numeric, 'Escritório', 'operacional', true, 'Mar/2026', 'pago'),
  ('Faxineira',     200.00::numeric, 'Escritório', 'operacional', true, 'Mar/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mar/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Mar/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob', 1125.27::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mar/2026', 'pago'),
  ('Cartão Santander',    35.73::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mar/2026', 'pago'),
  ('Simples Parcelado',  350.38::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mar/2026', 'pago'),
  ('Cartão Santander',   440.00::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mar/2026', 'pago'),
  ('Darf Parcelado',     588.87::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mar/2026', 'pago'),
  ('Braspress',          243.37::numeric, 'Parcelas / Financiamentos', 'financeiro', false, 'Mar/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mar/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- Impostos Mar/2026
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, status)
SELECT * FROM (VALUES
  ('DAS',        'Simples Nacional',      3760.36::numeric, 'Mar/2026', 'Fev/2026', 'pago'),
  ('taxa_conta', 'Taxa Conta Corrente',     79.90::numeric, 'Mar/2026', 'Mar/2026', 'pago'),
  ('DARF',       'DARF Março',            1000.00::numeric, 'Mar/2026', 'Mar/2026', 'pago')
) AS v(tipo, descricao, valor, mes_referencia, competencia, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Mar/2026');

-- Faturas Cartão Mar/2026
INSERT INTO faturas_cartao (cartao, descricao, valor, data_compra, mes_fatura)
SELECT * FROM (VALUES
  ('Inter',     'Sem Rush (Conta Inter)',      4100.00::numeric, '2025-11-17'::date, 'Mar/2026'),
  ('Santander', 'Claude IA',                    110.00::numeric, '2026-03-09'::date, 'Mar/2026'),
  ('Santander', '99*',                            9.27::numeric, '2026-03-09'::date, 'Mar/2026'),
  ('Santander', '99*',                            8.60::numeric, '2026-03-10'::date, 'Mar/2026'),
  ('Santander', '99*',                            6.40::numeric, '2026-03-10'::date, 'Mar/2026'),
  ('Santander', '99*',                           10.70::numeric, '2026-03-11'::date, 'Mar/2026'),
  ('Santander', 'Lovable',                       80.46::numeric, '2026-03-11'::date, 'Mar/2026'),
  ('Santander', 'Freepik',                       80.00::numeric, '2026-03-11'::date, 'Mar/2026'),
  ('Santander', '99*',                            4.60::numeric, '2026-03-13'::date, 'Mar/2026'),
  ('Santander', 'Assai atacadista',              49.47::numeric, '2026-03-14'::date, 'Mar/2026'),
  ('Santander', '99*',                           15.70::numeric, '2026-03-15'::date, 'Mar/2026'),
  ('Santander', 'Contabilizei upbr',            369.00::numeric, '2026-03-15'::date, 'Mar/2026'),
  ('Santander', 'Contabilizei consultoria',     189.00::numeric, '2026-03-15'::date, 'Mar/2026'),
  ('Santander', '99*',                            5.90::numeric, '2026-03-15'::date, 'Mar/2026'),
  ('Santander', 'Assai atacadista',              56.88::numeric, '2026-03-15'::date, 'Mar/2026'),
  ('Santander', 'Reportei',                     109.90::numeric, '2026-03-15'::date, 'Mar/2026'),
  ('Santander', 'Assai atacadista',              56.88::numeric, '2026-03-15'::date, 'Mar/2026'),
  ('Santander', 'Turbocloud',                    35.90::numeric, '2026-03-16'::date, 'Mar/2026'),
  ('Santander', '99*',                            7.29::numeric, '2026-03-16'::date, 'Mar/2026'),
  ('Santander', '99*',                            9.20::numeric, '2026-03-16'::date, 'Mar/2026'),
  ('Santander', '99*',                            8.50::numeric, '2026-03-17'::date, 'Mar/2026'),
  ('Santander', '99*',                            6.10::numeric, '2026-03-18'::date, 'Mar/2026'),
  ('Santander', 'Petz Digital',                  50.16::numeric, '2026-03-18'::date, 'Mar/2026'),
  ('Santander', 'Uber Aquae',                    13.95::numeric, '2026-03-19'::date, 'Mar/2026'),
  ('Santander', 'Uber Aquae',                    14.53::numeric, '2026-03-19'::date, 'Mar/2026'),
  ('Santander', '99* Pro Dentista',              11.70::numeric, '2026-03-20'::date, 'Mar/2026'),
  ('Santander', '99* Pro Dentista',              14.70::numeric, '2026-03-20'::date, 'Mar/2026'),
  ('Santander', '99*',                            6.56::numeric, '2026-03-21'::date, 'Mar/2026'),
  ('Santander', '99*',                            5.90::numeric, '2026-03-22'::date, 'Mar/2026'),
  ('Santander', 'Turbocloud',                    35.90::numeric, '2026-03-23'::date, 'Mar/2026'),
  ('Santander', 'Turbocloud',                    35.90::numeric, '2026-03-23'::date, 'Mar/2026'),
  ('Santander', '99*',                            8.10::numeric, '2026-03-23'::date, 'Mar/2026'),
  ('Santander', 'Mercado Livre Ar',             395.00::numeric, '2026-03-23'::date, 'Mar/2026'),
  ('Santander', 'Turbocloud',                    71.80::numeric, '2026-03-23'::date, 'Mar/2026'),
  ('Santander', 'Lovable',                      131.50::numeric, '2026-03-24'::date, 'Mar/2026'),
  ('Santander', 'Enhancer',                      25.77::numeric, '2026-03-24'::date, 'Mar/2026'),
  ('Santander', 'Turbocloud',                    35.90::numeric, '2026-03-27'::date, 'Mar/2026'),
  ('Santander', 'Bot Conversa',                 297.00::numeric, '2026-03-27'::date, 'Mar/2026'),
  ('Santander', 'Godaddy',                       66.06::numeric, '2026-03-27'::date, 'Mar/2026'),
  ('Santander', 'Figma',                        104.75::numeric, '2026-03-28'::date, 'Mar/2026'),
  ('Santander', '99*',                            5.90::numeric, '2026-03-29'::date, 'Mar/2026'),
  ('Santander', 'N F Campos LTDA',               74.90::numeric, '2026-03-30'::date, 'Mar/2026'),
  ('Santander', '99*',                            5.58::numeric, '2026-03-31'::date, 'Mar/2026'),
  ('Santander', 'Envato',                       172.24::numeric, '2026-04-01'::date, 'Mar/2026'),
  ('Santander', 'Google Workspace',             490.00::numeric, '2026-04-01'::date, 'Mar/2026'),
  ('Santander', '99*',                            6.20::numeric, '2026-04-01'::date, 'Mar/2026'),
  ('Santander', '99*',                            6.00::numeric, '2026-04-02'::date, 'Mar/2026'),
  ('Santander', '99*',                            5.40::numeric, '2026-04-03'::date, 'Mar/2026'),
  ('Santander', 'UI Chemyfi',                    46.49::numeric, '2026-04-04'::date, 'Mar/2026'),
  ('Santander', 'Super Mais Diabo Verde',        22.99::numeric, '2026-04-04'::date, 'Mar/2026'),
  ('Santander', '99*',                            8.60::numeric, '2026-04-04'::date, 'Mar/2026'),
  ('Santander', 'CapCut',                        65.90::numeric, '2026-04-06'::date, 'Mar/2026'),
  ('Santander', '99*',                            7.90::numeric, '2026-04-07'::date, 'Mar/2026'),
  ('Santander', '99*',                            6.30::numeric, '2026-04-08'::date, 'Mar/2026'),
  ('Santander', '99*',                            6.20::numeric, '2026-04-09'::date, 'Mar/2026'),
  ('Santander', 'Claude AI',                    110.00::numeric, '2026-04-09'::date, 'Mar/2026')
) AS v(cartao, descricao, valor, data_compra, mes_fatura)
WHERE NOT EXISTS (SELECT 1 FROM faturas_cartao WHERE mes_fatura = 'Mar/2026');

-- DRE Mar/2026
INSERT INTO dre_mensal (
  mes_referencia,
  receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
)
SELECT
  'Mar/2026',
  22834.77, 18947.00, 41781.77,
  9969.00, 2143.92, 4113.83, 2783.62,
  3760.36, 1079.90, 23850.63,
  17931.14, 13931.14, 4000.00, 13931.14, 'fechado'
WHERE NOT EXISTS (SELECT 1 FROM dre_mensal WHERE mes_referencia = 'Mar/2026');

-- Orçamento Mar/2026
INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado)
VALUES
  ('Mar/2026', 'Folha',      9969.00,  9969.00),
  ('Mar/2026', 'Software',   2143.92,  2143.92),
  ('Mar/2026', 'Escritório', 4113.83,  4113.83),
  ('Mar/2026', 'Impostos',   4840.26,  4840.26),
  ('Mar/2026', 'Parcelas',   2783.62,  2783.62)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;

-- Histórico MRR Mar/2026
INSERT INTO historico_mrr (mes_referencia, mrr, novos_clientes, churn, expansao)
VALUES ('Mar/2026', 22834.77, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;


-- ═══════════════════════════════════════════════════════
-- ABRIL 2026
-- Receita recorrente: R$ 20.596,00
-- Receita variável:   R$ 22.097,72
-- Receita total:      R$ 42.693,72
-- Folha total:        R$ 8.763,00
-- Despesa total:      R$ 23.270,38
-- EBITDA:             R$ 19.423,34
-- Lucro líquido:      R$ 15.423,34
-- ═══════════════════════════════════════════════════════

-- Receitas Abr/2026 — Recorrentes
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Villa Grand Pets',   'Abr/2026',  500.00::numeric, 'pago', '2026-04-12'::date),
  ('Aquae Deca trafego', 'Abr/2026', 1700.00::numeric, 'pago', '2026-04-23'::date),
  ('Ramá Ipatinga',      'Abr/2026',  500.00::numeric, 'pago', '2026-04-23'::date),
  ('Casa do bombeiro',   'Abr/2026',  500.00::numeric, 'pago', '2026-04-23'::date),
  ('Rios Floor',         'Abr/2026', 4000.00::numeric, 'pago', '2026-05-05'::date),
  ('Bragança Capital',   'Abr/2026', 1999.00::numeric, 'pago', '2026-05-05'::date),
  ('Inova franquia',     'Abr/2026', 4000.00::numeric, 'pago', '2026-05-05'::date),
  ('Pratique Segurança', 'Abr/2026',  397.00::numeric, 'pago', '2026-05-07'::date),
  ('Valore',             'Abr/2026', 5000.00::numeric, 'pago', '2026-05-10'::date),
  ('Ricardo Gontijo',    'Abr/2026', 2000.00::numeric, 'pago', '2026-05-10'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Abr/2026');

-- Receitas Abr/2026 — Variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Kind Roofing',    'Abr/2026', 2460.72::numeric, 'pendente', NULL::date),
  ('Inova Franquias', 'Abr/2026', 1499.00::numeric, 'pendente', NULL::date),
  ('Meu Ultrassom',   'Abr/2026', 6346.00::numeric, 'pendente', NULL::date),
  ('Dr Márcio',       'Abr/2026', 1500.00::numeric, 'pendente', NULL::date),
  ('Deca Aquae',      'Abr/2026',  297.00::numeric, 'pendente', NULL::date),
  ('Clínica Mais 60', 'Abr/2026', 9995.00::numeric, 'pendente', NULL::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Abr/2026');

-- Folha Abr/2026
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Miguel',         'Desenvolvedor',    1500.00::numeric, 'PJ',         'Abr/2026', 'pago'),
  ('Fernando Safar', 'Analista',          300.00::numeric, 'PJ',         'Abr/2026', 'pago'),
  ('Davi Rodrigues', 'Analista',         2100.00::numeric, 'PJ',         'Abr/2026', 'pago'),
  ('Antônio Alves',  'Especialista',     1621.00::numeric, 'Pró-labore', 'Abr/2026', 'pago'),
  ('Ítalo Augusto',  'Dir. Comercial',   1621.00::numeric, 'Pró-labore', 'Abr/2026', 'pago'),
  ('Gabriel Diniz',  'Especialista SEO', 1621.00::numeric, 'Pró-labore', 'Abr/2026', 'pago')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Abr/2026');

-- Despesas Software Abr/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Claude AI',                 110.00::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Freepik',                    80.00::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Turbocloud',                251.30::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Anthropic',                  50.00::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Contabilizei UPBR',         369.00::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Contabilizei Consultoria',  189.00::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Clone WebX',                 52.27::numeric, 'Software e Plataformas', 'operacional', false, 'Abr/2026', 'pago'),
  ('Enhancer',                   24.54::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Lovable',                   125.21::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Figma',                      99.40::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Workspace',                 490.00::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Envato',                    164.62::numeric, 'Software e Plataformas', 'operacional', false, 'Abr/2026', 'pago'),
  ('UIchemy',                    44.90::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Hetzner Online',            104.88::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago'),
  ('Cap Cut',                    65.90::numeric, 'Software e Plataformas', 'operacional', true,  'Abr/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Abr/2026');

-- Despesas Escritório Abr/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia',            728.86::numeric, 'Escritório', 'operacional', true, 'Abr/2026', 'pago'),
  ('Aluguel',           2073.00::numeric, 'Escritório', 'operacional', true, 'Abr/2026', 'pago'),
  ('Condomínio',         966.00::numeric, 'Escritório', 'operacional', true, 'Abr/2026', 'pago'),
  ('Estacionamento',     343.00::numeric, 'Escritório', 'operacional', true, 'Abr/2026', 'pago'),
  ('Internet',           140.00::numeric, 'Escritório', 'operacional', true, 'Abr/2026', 'pago'),
  ('Faxineira',          200.00::numeric, 'Escritório', 'operacional', true, 'Abr/2026', 'pago'),
  ('Custo operacional',  753.00::numeric, 'Escritório', 'operacional', false,'Abr/2026', 'pago'),
  ('Evento Franshising', 200.00::numeric, 'Escritório', 'operacional', false,'Abr/2026', 'pago'),
  ('Manutenção Miguel',  350.00::numeric, 'Escritório', 'operacional', false,'Abr/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Abr/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Abr/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob', 1125.27::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Abr/2026', 'pago'),
  ('Cartão Santander',    35.73::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Abr/2026', 'pago'),
  ('Simples Parcelado',  354.08::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Abr/2026', 'pago'),
  ('Darf Parcelado',     595.52::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Abr/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Abr/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- Impostos Abr/2026
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, status)
SELECT * FROM (VALUES
  ('DAS',        'Simples Nacional',  3462.00::numeric, 'Abr/2026', 'Mar/2026', 'pago'),
  ('taxa_conta', 'Taxa Conta Corrente', 69.90::numeric, 'Abr/2026', 'Abr/2026', 'pago'),
  ('DARF',       'DARF Março',         890.00::numeric, 'Abr/2026', 'Mar/2026', 'pago')
) AS v(tipo, descricao, valor, mes_referencia, competencia, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Abr/2026');

-- Faturas Cartão Abr/2026
INSERT INTO faturas_cartao (cartao, descricao, valor, data_compra, mes_fatura)
SELECT * FROM (VALUES
  ('Inter',     'Sem Rush (Conta Inter)',             3930.09::numeric, '2026-05-01'::date, 'Abr/2026'),
  ('Santander', 'Claude AI',                           110.00::numeric, '2026-04-09'::date, 'Abr/2026'),
  ('Santander', '99*',                                   6.20::numeric, '2026-04-09'::date, 'Abr/2026'),
  ('Santander', '99*',                                   6.00::numeric, '2026-04-10'::date, 'Abr/2026'),
  ('Santander', 'Apollo Elétrica',                      31.70::numeric, '2026-04-10'::date, 'Abr/2026'),
  ('Santander', 'Freepik',                              80.00::numeric, '2026-04-12'::date, 'Abr/2026'),
  ('Santander', '99* evento franquia italo',             9.43::numeric, '2026-04-14'::date, 'Abr/2026'),
  ('Santander', '99* evento franquia italo',            12.40::numeric, '2026-04-14'::date, 'Abr/2026'),
  ('Santander', '99* evento franquia italo',            14.11::numeric, '2026-04-14'::date, 'Abr/2026'),
  ('Santander', 'Anthropic',                            50.00::numeric, '2026-04-14'::date, 'Abr/2026'),
  ('Santander', 'Turbocloud',                           35.90::numeric, '2026-04-14'::date, 'Abr/2026'),
  ('Santander', 'Contabilizei UPBR',                   369.00::numeric, '2026-04-15'::date, 'Abr/2026'),
  ('Santander', 'Contabilizei consultoria',            189.00::numeric, '2026-04-15'::date, 'Abr/2026'),
  ('Santander', 'Pó de café Araujo',                    68.00::numeric, '2026-04-15'::date, 'Abr/2026'),
  ('Santander', 'Assai produtos de limpeza',            63.79::numeric, '2026-04-18'::date, 'Abr/2026'),
  ('Santander', 'Turbocloud',                           35.90::numeric, '2026-04-22'::date, 'Abr/2026'),
  ('Santander', 'Turbocloud',                           35.90::numeric, '2026-04-22'::date, 'Abr/2026'),
  ('Santander', '99* reunião italo',                     8.60::numeric, '2026-04-23'::date, 'Abr/2026'),
  ('Santander', '99* reunião italo',                     1.65::numeric, '2026-04-23'::date, 'Abr/2026'),
  ('Santander', 'Clone Web X',                          52.27::numeric, '2026-04-23'::date, 'Abr/2026'),
  ('Santander', 'Turbocloud',                           71.80::numeric, '2026-04-24'::date, 'Abr/2026'),
  ('Santander', '99* reunião italo',                    15.80::numeric, '2026-04-24'::date, 'Abr/2026'),
  ('Santander', '99* reunião italo',                    14.70::numeric, '2026-04-24'::date, 'Abr/2026'),
  ('Santander', 'Enhancer',                             24.54::numeric, '2026-04-25'::date, 'Abr/2026'),
  ('Santander', 'Lovable',                             125.21::numeric, '2026-04-25'::date, 'Abr/2026'),
  ('Santander', 'Turbocloud',                           35.90::numeric, '2026-04-27'::date, 'Abr/2026'),
  ('Santander', 'Assai Atacadista reunião 60+',         75.91::numeric, '2026-04-27'::date, 'Abr/2026'),
  ('Santander', 'Figma',                                99.40::numeric, '2026-04-27'::date, 'Abr/2026'),
  ('Santander', 'Petz Digital',                         60.25::numeric, '2026-04-28'::date, 'Abr/2026'),
  ('Santander', '99*',                                  10.90::numeric, '2026-04-28'::date, 'Abr/2026'),
  ('Santander', '99*',                                   8.70::numeric, '2026-04-29'::date, 'Abr/2026'),
  ('Santander', 'BotConversa',                         297.00::numeric, '2026-04-29'::date, 'Abr/2026'),
  ('Santander', '99*',                                   6.40::numeric, '2026-04-29'::date, 'Abr/2026'),
  ('Santander', 'Workspace',                           490.00::numeric, '2026-05-01'::date, 'Abr/2026'),
  ('Santander', 'Envato',                              164.62::numeric, '2026-05-01'::date, 'Abr/2026'),
  ('Santander', '99*',                                  12.30::numeric, '2026-05-03'::date, 'Abr/2026'),
  ('Santander', 'UIchemy',                              44.90::numeric, '2026-05-04'::date, 'Abr/2026'),
  ('Santander', 'Hetzner Online',                      104.88::numeric, '2026-05-05'::date, 'Abr/2026'),
  ('Santander', 'CapCut',                               65.90::numeric, '2026-05-06'::date, 'Abr/2026'),
  ('Santander', '99*',                                   8.20::numeric, '2026-05-06'::date, 'Abr/2026'),
  ('Santander', '99*',                                   6.10::numeric, '2026-05-07'::date, 'Abr/2026'),
  ('Santander', '99*',                                   6.10::numeric, '2026-05-07'::date, 'Abr/2026'),
  ('Santander', '99*',                                  17.45::numeric, '2026-05-07'::date, 'Abr/2026')
) AS v(cartao, descricao, valor, data_compra, mes_fatura)
WHERE NOT EXISTS (SELECT 1 FROM faturas_cartao WHERE mes_fatura = 'Abr/2026');

-- DRE Abr/2026
INSERT INTO dre_mensal (
  mes_referencia,
  receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
)
SELECT
  'Abr/2026',
  20596.00, 22097.72, 42693.72,
  8763.00, 2221.02, 5753.86, 2110.60,
  3462.00, 959.90, 23270.38,
  19423.34, 15423.34, 4000.00, 15423.34, 'fechado'
WHERE NOT EXISTS (SELECT 1 FROM dre_mensal WHERE mes_referencia = 'Abr/2026');

-- Orçamento Abr/2026
INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado)
VALUES
  ('Abr/2026', 'Folha',       8763.00,  8763.00),
  ('Abr/2026', 'Software',    2221.02,  2221.02),
  ('Abr/2026', 'Escritório',  5753.86,  5753.86),
  ('Abr/2026', 'Impostos',    4421.90,  4421.90),
  ('Abr/2026', 'Parcelas',    2110.60,  2110.60)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;

-- Histórico MRR Abr/2026
INSERT INTO historico_mrr (mes_referencia, mrr, novos_clientes, churn, expansao)
VALUES ('Abr/2026', 20596.00, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;


-- ═══════════════════════════════════════════════════════
-- MAIO 2026
-- Receita recorrente: R$ 27.791,38
-- Receita variável:   R$ 6.644,00
-- Receita total:      R$ 34.435,38
-- Folha total:        R$ 9.863,00
-- Despesa total:      R$ 23.533,49
-- EBITDA:             R$ 10.901,89
-- Lucro líquido:      R$ 6.901,89
-- Nota: já pode ter seed parcial no MASTER_SCHEMA — guards idempotentes garantem segurança
-- ═══════════════════════════════════════════════════════

-- Receitas Mai/2026 — Recorrentes
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Villa Grand Pets',              'Mai/2026',   500.00::numeric, 'pago', '2026-05-12'::date),
  ('Aquae Deca trafego',            'Mai/2026',  1700.00::numeric, 'pago', '2026-05-23'::date),
  ('Ramá Ipatinga',                 'Mai/2026',   491.00::numeric, 'pago', '2026-05-23'::date),
  ('Casa do bombeiro',              'Mai/2026',   500.00::numeric, 'pago', '2026-05-23'::date),
  ('Kind Roofing',                  'Mai/2026',  2460.00::numeric, 'pago', '2026-06-05'::date),
  ('Bragança Capital',              'Mai/2026',  1998.00::numeric, 'pago', '2026-06-05'::date),
  ('Inova franquia + trafego',      'Mai/2026',  5500.00::numeric, 'pago', '2026-06-05'::date),
  ('Mais 60 Saúde',                 'Mai/2026',  3000.00::numeric, 'pago', '2026-06-05'::date),
  ('Pratique Segurança',            'Mai/2026',   399.00::numeric, 'pago', '2026-06-07'::date),
  ('Valore',                        'Mai/2026',  5000.00::numeric, 'pago', '2026-06-10'::date),
  ('Ricardo Gontijo',               'Mai/2026',  2000.00::numeric, 'pago', '2026-06-10'::date),
  ('Valorem',                       'Mai/2026',  4000.00::numeric, 'pendente', NULL::date),
  ('manutenção site Favela.org',    'Mai/2026',   243.38::numeric, 'pago', '2026-05-25'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Mai/2026');

-- Receitas Mai/2026 — Variáveis
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Inova Select',   'Mai/2026', 1500.00::numeric, 'pago', '2026-06-05'::date),
  ('Lilian Giannasi','Mai/2026', 2498.00::numeric, 'pago', '2026-05-19'::date),
  ('Pizza Point',    'Mai/2026',  147.00::numeric, 'pago', '2026-06-09'::date),
  ('Lucas Galy',     'Mai/2026', 2499.00::numeric, 'pago', '2026-06-09'::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Mai/2026');

-- Folha Mai/2026
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Miguel',         'Desenvolvedor',    3000.00::numeric, 'PJ',         'Mai/2026', 'pago'),
  ('Davi Rodrigues', 'Analista',         2000.00::numeric, 'PJ',         'Mai/2026', 'pago'),
  ('Antônio Alves',  'Especialista',     1621.00::numeric, 'Pró-labore', 'Mai/2026', 'pago'),
  ('Ítalo Augusto',  'Dir. Comercial',   1621.00::numeric, 'Pró-labore', 'Mai/2026', 'pago'),
  ('Gabriel Diniz',  'Especialista SEO', 1621.00::numeric, 'Pró-labore', 'Mai/2026', 'pago')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Mai/2026');

-- Despesas Software Mai/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Claude AI pessoal',      110.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Claude AI agência',      441.30::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Data for SEO',           268.07::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Turbocloud',             215.40::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Magnific Premium',        80.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Registro.br',             40.00::numeric, 'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
  ('MeisterLabs',            210.59::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Lovable',                125.35::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Figma',                  188.81::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Domínio upbr.digital',   318.17::numeric, 'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
  ('Envato',                 166.88::numeric, 'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
  ('Google Workspace',       490.00::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
  ('Hetzner Online',          62.41::numeric, 'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mai/2026');

-- Despesas Escritório Mai/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia',             689.60::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Aluguel',            1665.70::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Condomínio',          966.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Estacionamento',      343.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Internet',            140.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Faxineira',           200.00::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Taxa TFLF UPBR',      336.89::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
  ('Taxa TFLF Consult.',  168.48::numeric, 'Escritório', 'operacional', true, 'Mai/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mai/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Mai/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob', 1125.27::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago'),
  ('Cartão Santander',    35.73::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago'),
  ('Simples Parcelado',  350.38::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Mai/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- Impostos Mai/2026
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, status)
SELECT * FROM (VALUES
  ('DAS',        'Simples Nacional',    3266.79::numeric, 'Mai/2026', 'Abr/2026', 'pago'),
  ('taxa_conta', 'Taxa Conta Corrente',   69.90::numeric, 'Mai/2026', 'Mai/2026', 'pago'),
  ('DARF',       'DARF Maio',           1595.77::numeric, 'Mai/2026', 'Mai/2026', 'pago')
) AS v(tipo, descricao, valor, mes_referencia, competencia, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Mai/2026');

-- Faturas Cartão Mai/2026
INSERT INTO faturas_cartao (cartao, descricao, valor, data_compra, mes_fatura)
SELECT * FROM (VALUES
  ('Inter',     'Sem Rush (Conta Inter)',        3756.64::numeric, '2026-06-02'::date, 'Mai/2026'),
  ('Santander', 'Claude AI',                      110.00::numeric, '2026-05-09'::date, 'Mai/2026'),
  ('Santander', 'Claude AI',                      441.30::numeric, '2026-05-09'::date, 'Mai/2026'),
  ('Santander', 'Data for SEO',                   268.07::numeric, '2026-05-11'::date, 'Mai/2026'),
  ('Santander', 'Magnific Premium',                80.00::numeric, '2026-05-12'::date, 'Mai/2026'),
  ('Santander', '99*',                              9.90::numeric, '2026-05-13'::date, 'Mai/2026'),
  ('Santander', 'Contabilizei UPBR',              369.00::numeric, '2026-05-15'::date, 'Mai/2026'),
  ('Santander', 'Contabilizei consultoria',       189.00::numeric, '2026-05-15'::date, 'Mai/2026'),
  ('Santander', 'Turbocloud',                      35.90::numeric, '2026-05-15'::date, 'Mai/2026'),
  ('Santander', 'Registro.br',                     40.00::numeric, '2026-05-18'::date, 'Mai/2026'),
  ('Santander', 'Turbocloud',                      35.90::numeric, '2026-05-21'::date, 'Mai/2026'),
  ('Santander', 'Turbocloud',                      35.90::numeric, '2026-05-21'::date, 'Mai/2026'),
  ('Santander', 'Paypal',                          52.75::numeric, '2026-05-23'::date, 'Mai/2026'),
  ('Santander', 'MeisterLabs',                    210.59::numeric, '2026-05-24'::date, 'Mai/2026'),
  ('Santander', 'Lovable',                        125.35::numeric, '2026-05-24'::date, 'Mai/2026'),
  ('Santander', 'Turbocloud',                      71.80::numeric, '2026-05-25'::date, 'Mai/2026'),
  ('Santander', 'Tim recarga',                     20.00::numeric, '2026-05-26'::date, 'Mai/2026'),
  ('Santander', 'Turbocloud',                      35.90::numeric, '2026-05-27'::date, 'Mai/2026'),
  ('Santander', 'Figma',                          188.81::numeric, '2026-05-27'::date, 'Mai/2026'),
  ('Santander', 'Uber',                             6.94::numeric, '2026-05-28'::date, 'Mai/2026'),
  ('Santander', 'Uber',                             8.68::numeric, '2026-05-28'::date, 'Mai/2026'),
  ('Santander', 'Godaddy',                        274.92::numeric, '2026-05-30'::date, 'Mai/2026'),
  ('Santander', 'Bot Conversa',                   297.00::numeric, '2026-05-31'::date, 'Mai/2026'),
  ('Santander', 'Envato',                         166.88::numeric, '2026-06-01'::date, 'Mai/2026'),
  ('Santander', 'Google Workspace',               490.00::numeric, '2026-06-01'::date, 'Mai/2026'),
  ('Santander', 'Dl Google Cloud',                  3.61::numeric, '2026-06-01'::date, 'Mai/2026'),
  ('Santander', 'Mercado Livre cabo tipo c tv',    74.95::numeric, '2026-06-02'::date, 'Mai/2026'),
  ('Santander', 'Uichemy',                         45.37::numeric, '2026-06-04'::date, 'Mai/2026'),
  ('Santander', 'Godaddy',                        318.17::numeric, '2026-06-04'::date, 'Mai/2026'),
  ('Santander', 'Hetzner Online',                  62.41::numeric, '2026-06-05'::date, 'Mai/2026'),
  ('Santander', 'Cap Cut',                         65.90::numeric, '2026-06-06'::date, 'Mai/2026')
) AS v(cartao, descricao, valor, data_compra, mes_fatura)
WHERE NOT EXISTS (SELECT 1 FROM faturas_cartao WHERE mes_fatura = 'Mai/2026');

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
  27791.38, 6644.00, 34435.38,
  9863.00, 2716.98, 4509.67, 1511.38,
  3266.79, 1665.67, 23533.49,
  10901.89, 6901.89, 4000.00, 6901.89, 'fechado'
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
VALUES ('Mai/2026', 27791.38, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;


-- ═══════════════════════════════════════════════════════
-- JUNHO 2026
-- Receita recorrente: R$ 30.450,00
-- Receita variável:   R$ 0,00
-- Receita total:      R$ 30.450,00
-- Folha total:        R$ 10.269,00
-- Despesa total:      R$ 19.634,34
-- EBITDA:             R$ 10.815,66
-- Lucro líquido:      R$ 6.815,66
-- Status: aberto (mês em andamento)
-- ═══════════════════════════════════════════════════════

-- Receitas Jun/2026 — Recorrentes
INSERT INTO receitas (cliente_nome, mes_referencia, valor, status, data_pagamento)
SELECT * FROM (VALUES
  ('Villa Grand Pets',   'Jun/2026',  500.00::numeric, 'pago',    '2026-06-12'::date),
  ('Aquae Deca trafego', 'Jun/2026', 1700.00::numeric, 'pago',    '2026-05-23'::date),
  ('Ramá Ipatinga',      'Jun/2026',  500.00::numeric, 'pago',    '2026-06-23'::date),
  ('Casa do bombeiro',   'Jun/2026',  500.00::numeric, 'pago',    '2026-06-23'::date),
  ('Pro Squad',          'Jun/2026', 3400.00::numeric, 'pendente', NULL::date),
  ('Rios Floor',         'Jun/2026', 4000.00::numeric, 'pendente', NULL::date),
  ('Bragança Capital',   'Jun/2026', 2000.00::numeric, 'pendente', NULL::date),
  ('Inova franquia',     'Jun/2026', 4000.00::numeric, 'pendente', NULL::date),
  ('Kind Roofing',       'Jun/2026', 2450.00::numeric, 'pendente', NULL::date),
  ('Pratique Segurança', 'Jun/2026',  400.00::numeric, 'pendente', NULL::date),
  ('Valore',             'Jun/2026', 5000.00::numeric, 'pendente', NULL::date),
  ('Ricardo Gontijo',    'Jun/2026', 2000.00::numeric, 'pendente', NULL::date),
  ('Valorem',            'Jun/2026', 4000.00::numeric, 'pendente', NULL::date)
) AS v(cliente_nome, mes_referencia, valor, status, data_pagamento)
WHERE NOT EXISTS (SELECT 1 FROM receitas WHERE mes_referencia = 'Jun/2026');

-- Folha Jun/2026
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status)
SELECT * FROM (VALUES
  ('Miguel',         'Desenvolvedor',    3000.00::numeric, 'PJ',         'Jun/2026', 'pendente'),
  ('Fernando Safar', 'Analista',          500.00::numeric, 'PJ',         'Jun/2026', 'pendente'),
  ('Davi Rodrigues', 'Analista',         1906.00::numeric, 'PJ',         'Jun/2026', 'pendente'),
  ('Antônio Alves',  'Especialista',     1621.00::numeric, 'Pró-labore', 'Jun/2026', 'pendente'),
  ('Ítalo Augusto',  'Dir. Comercial',   1621.00::numeric, 'Pró-labore', 'Jun/2026', 'pendente'),
  ('Gabriel Diniz',  'Especialista SEO', 1621.00::numeric, 'Pró-labore', 'Jun/2026', 'pendente')
) AS v(funcionario, cargo, salario, tipo, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM folha_pagamento WHERE mes_referencia = 'Jun/2026');

-- Despesas Escritório Jun/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Energia',      728.86::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Aluguel',     1665.70::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Condomínio',   966.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Estacionamento', 343.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Internet',     140.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente'),
  ('Faxineira',    200.00::numeric, 'Escritório', 'operacional', true, 'Jun/2026', 'pendente')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jun/2026' AND categoria_nome = 'Escritório');

-- Despesas Parcelas Jun/2026
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
SELECT * FROM (VALUES
  ('Empréstimo Sicoob', 1125.27::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jun/2026', 'pendente'),
  ('Cartão Santander',    35.73::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jun/2026', 'pendente'),
  ('Simples Parcelado',  350.38::numeric, 'Parcelas / Financiamentos', 'financeiro', true, 'Jun/2026', 'pendente')
) AS v(descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status)
WHERE NOT EXISTS (SELECT 1 FROM despesas WHERE mes_referencia = 'Jun/2026' AND categoria_nome = 'Parcelas / Financiamentos');

-- Impostos Jun/2026
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, data_vencimento, status)
SELECT * FROM (VALUES
  ('DAS',        'Simples Nacional',    2740.50::numeric, 'Jun/2026', 'Mai/2026', '2026-06-20'::date, 'pendente'),
  ('taxa_conta', 'Taxa Conta Corrente',   69.90::numeric, 'Jun/2026', 'Jun/2026', '2026-06-30'::date, 'pendente'),
  ('DARF',       'DARF Março (parcela)', 1000.00::numeric, 'Jun/2026', 'Mar/2026', '2026-06-30'::date, 'pendente')
) AS v(tipo, descricao, valor, mes_referencia, competencia, data_vencimento, status)
WHERE NOT EXISTS (SELECT 1 FROM impostos WHERE mes_referencia = 'Jun/2026');

-- Faturas Cartão Jun/2026
INSERT INTO faturas_cartao (cartao, descricao, valor, data_compra, mes_fatura)
SELECT * FROM (VALUES
  ('Inter', 'Sem Rush (Conta Inter)', 3800.00::numeric, '2025-11-17'::date, 'Jun/2026')
) AS v(cartao, descricao, valor, data_compra, mes_fatura)
WHERE NOT EXISTS (SELECT 1 FROM faturas_cartao WHERE mes_fatura = 'Jun/2026');

-- DRE Jun/2026
INSERT INTO dre_mensal (
  mes_referencia,
  receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
)
SELECT
  'Jun/2026',
  30450.00, 0.00, 30450.00,
  10269.00, 0.00, 4043.56, 1511.38,
  2740.50, 1069.90, 19634.34,
  10815.66, 6815.66, 4000.00, 6815.66, 'aberto'
WHERE NOT EXISTS (SELECT 1 FROM dre_mensal WHERE mes_referencia = 'Jun/2026');

-- Orçamento Jun/2026
INSERT INTO orcamento_mensal (mes_referencia, categoria, valor_orcado, valor_realizado)
VALUES
  ('Jun/2026', 'Folha',      10269.00, 0.00),
  ('Jun/2026', 'Software',       0.00, 0.00),
  ('Jun/2026', 'Escritório', 4043.56,  0.00),
  ('Jun/2026', 'Impostos',   3810.40,  0.00),
  ('Jun/2026', 'Parcelas',   1511.38,  0.00)
ON CONFLICT (mes_referencia, categoria) DO NOTHING;

-- Histórico MRR Jun/2026
INSERT INTO historico_mrr (mes_referencia, mrr, novos_clientes, churn, expansao)
VALUES ('Jun/2026', 30450.00, 0, 0, 0)
ON CONFLICT (mes_referencia) DO NOTHING;

-- ─── FIM ─────────────────────────────────────────────────────────────────────
-- Resultado esperado:
--   Jan/2026: 6 recorrentes, 8 variáveis, 6 folha, 11 software, 6 escritório, 5 parcelas, 4 impostos, 56 faturas
--   Fev/2026: 7 recorrentes, 9 variáveis, 6 folha, 12 software, 6 escritório, 6 parcelas, 4 impostos, 57 faturas
--   Mar/2026: 11 recorrentes, 4 variáveis, 6 folha, 13 software, 6 escritório, 6 parcelas, 3 impostos, 55 faturas
--   Abr/2026: 10 recorrentes, 6 variáveis, 6 folha, 15 software, 9 escritório, 4 parcelas, 3 impostos, 43 faturas
--   Mai/2026: 13 recorrentes, 4 variáveis, 5 folha, 13 software, 8 escritório, 3 parcelas, 3 impostos, 31 faturas
--   Jun/2026: 13 recorrentes, 0 variáveis, 6 folha, 0 software, 6 escritório, 3 parcelas, 3 impostos, 1 fatura
--   dre_mensal: 6 linhas (Jan–Jun)
--   historico_mrr: 6 linhas
--   orcamento_mensal: 30 linhas (5 categorias × 6 meses)
