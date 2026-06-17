-- Upsend Brasil CFO — Seed Data (Maio 2026)
-- Run AFTER schema.sql

-- Empresa
INSERT INTO empresa (nome, aliquota_simples, caixa_reserva)
VALUES ('Upsend Brasil', 12.5, 4000);

-- Socios (soma 100%)
INSERT INTO socios (nome, percentual, prolabore, cargo) VALUES
('Ítalo Ribeiro',   21, 1621, 'Diretor Comercial'),
('Gabriel Diniz',   21, 1621, 'Especialista SEO'),
('Antônio Alves',   21, 1621, 'Especialista'),
('Davi Rodrigues',  16, 2000, 'Analista'),
('Miguel Dev',      21, 3000, 'Desenvolvedor');

-- Categorias
INSERT INTO categorias_despesa (nome, tipo, cor) VALUES
('Software e Plataformas',    'operacional', '#8b5cf6'),
('Escritório',                'operacional', '#f59e0b'),
('Parcelas / Financiamentos', 'financeiro',  '#ef4444'),
('Impostos',                  'imposto',     '#dc2626'),
('Folha de Pagamento',        'folha',       '#127bf0');

-- Clientes Recorrentes (MRR: R$ 27.798)
INSERT INTO clientes (nome, tipo, valor_mensalidade, dia_pagamento) VALUES
('Villa Grand Pets',          'recorrente',  500,  3),
('Aquae Deca Tráfego',        'recorrente', 1700, 14),
('Ramá Ipatinga',             'recorrente',  491, 14),
('Casa do Bombeiro',          'recorrente',  500, 14),
('Bragança Capital',          'recorrente', 1998, 27),
('Inova Franquia + Tráfego',  'recorrente', 5500, 27),
('Kind Roofing',              'recorrente', 2460, 27),
('Mais 60 Saúde',             'recorrente', 3000, 27),
('Pratique Segurança',        'recorrente',  399, 29),
('Valore',                    'recorrente', 5000,  1),
('Ricardo Gontijo',           'recorrente', 2000,  1),
('Valorem',                   'recorrente', 4000, NULL),
('Manutenção Favela.org',     'recorrente',  250, 16);

-- Clientes Variáveis (total Maio: R$ 16.445)
INSERT INTO clientes (nome, tipo, valor_mensalidade, contrato_vigente) VALUES
('Inova Select',   'variavel', 1500, true),
('Lilian Giannasi','variavel', 3498, true),
('Embala e Limp',  'variavel', 3300, false),
('Task',           'variavel', 9000, false),
('Pizza Point',    'variavel',  147, false);

-- Folha Maio 2026 (total: R$ 9.863)
INSERT INTO folha_pagamento (funcionario, cargo, salario, tipo, mes_referencia, status) VALUES
('Miguel Dev',      'Desenvolvedor',    3000, 'PJ',          'Mai/2026', 'pago'),
('Davi Rodrigues',  'Analista',         2000, 'PJ',          'Mai/2026', 'pago'),
('Antônio Alves',   'Especialista',     1621, 'Pró-labore',  'Mai/2026', 'pago'),
('Ítalo Augusto',   'Dir. Comercial',   1621, 'Pró-labore',  'Mai/2026', 'pago'),
('Gabriel Diniz',   'Especialista SEO', 1621, 'Pró-labore',  'Mai/2026', 'pago');

-- Despesas Software Maio (total: R$ 2.716,98)
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status) VALUES
('Claude AI pessoal',      110.00,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('Claude AI agência',      441.30,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('DataForSEO',             268.07,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('TurboCloud',             215.40,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('Magnific Premium',        80.00,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('Registro.br',             40.00,  'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
('MeisterLabs',            210.59,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('Lovable',                125.35,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('Figma',                  188.81,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('Domínio upbr.digital',   318.17,  'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
('Envato',                 166.88,  'Software e Plataformas', 'operacional', false, 'Mai/2026', 'pago'),
('Google Workspace',       490.00,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago'),
('Hetzner Online',          62.41,  'Software e Plataformas', 'operacional', true,  'Mai/2026', 'pago');

-- Despesas Escritório Maio (total: R$ 4.509,67)
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status) VALUES
('Energia Cemig',            689.60, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
('Aluguel Salas',           1665.70, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
('Condomínio Med Center',    966.00, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
('Estacionamento Rodo Park', 343.00, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
('Internet',                 140.00, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
('Faxineira',                200.00, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
('Taxa TFLF UPBR',           336.89, 'Escritório', 'operacional', true, 'Mai/2026', 'pago'),
('Taxa TFLF Consultoria',    168.48, 'Escritório', 'operacional', true, 'Mai/2026', 'pago');

-- Parcelas Maio (total: R$ 1.511,38)
INSERT INTO despesas (descricao, valor, categoria_nome, categoria_tipo, recorrente, mes_referencia, status) VALUES
('Empréstimo Sicoob Gabriel', 1125.27, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago'),
('Cartão Santander',            35.73, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago'),
('Simples Parcelado',          350.38, 'Parcelas / Financiamentos', 'financeiro', true, 'Mai/2026', 'pago');

-- Impostos Maio (total: R$ 4.932,46)
INSERT INTO impostos (tipo, descricao, valor, mes_referencia, competencia, status) VALUES
('DAS',       'Simples Nacional',    3266.79, 'Mai/2026', 'Abr/2026', 'pago'),
('taxa_conta','Taxa Conta Corrente',   69.90, 'Mai/2026', 'Mai/2026', 'pago'),
('DARF',      'DARF Maio',          1595.77, 'Mai/2026', 'Mai/2026', 'pago');

-- DRE Fechado Maio 2026
INSERT INTO dre_mensal (
  mes_referencia, receita_recorrente, receita_variavel, receita_total,
  folha_total, despesas_software, despesas_escritorio, despesas_parcelas,
  impostos_das, impostos_outros, despesa_total,
  ebitda, lucro_liquido, caixa_reserva, lucro_distribuivel, status
) VALUES (
  'Mai/2026', 27798, 16445, 44243,
  9863, 2716.98, 4509.67, 1511.38,
  3266.79, 1665.67, 28273.15,
  15969.85, 11969.85, 4000, 11969.85, 'fechado'
);
