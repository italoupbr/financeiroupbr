-- Upsend Brasil CFO — Correção dos tipos de clientes
-- Problema: clientes que viraram recorrentes foram inseridos como variavel.
-- Baseado na leitura das abas "Clientes Recorrentes" de todas as planilhas.
-- https://supabase.com/dashboard/project/bmnemeupygblffiphhwj/sql

-- ─── 1. Corrige tipo para recorrente ─────────────────────────────────────────
-- Rios Floor: variável em Jan, recorrente de Fev em diante
UPDATE clientes SET tipo = 'recorrente', ativo = true
WHERE lower(nome) = 'rios floor';

-- Pro Squad: recorrente em Fev e Jun
UPDATE clientes SET tipo = 'recorrente', ativo = true
WHERE lower(nome) = 'pro squad';

-- Clínica Blanvur: recorrente em Jan, Fev e Mar
UPDATE clientes SET tipo = 'recorrente', ativo = false
WHERE lower(nome) = 'clínica blanvur';

-- Aquae Deca SEO: recorrente em Jan (serviço separado do Aquae Deca Tráfego)
UPDATE clientes SET tipo = 'recorrente', ativo = false
WHERE lower(nome) = 'aquae deca seo';

-- ─── 2. Remove Leo Web Designer (é funcionário, não cliente) ─────────────────
DELETE FROM clientes WHERE lower(nome) = 'leo web designer';

-- ─── 3. Adiciona recorrentes históricos que faltavam no seed ─────────────────
-- (Clínica Blanvur e Aquae Deca SEO já foram inseridos acima via FIXES_variaveis)
-- Garante que existem como recorrentes caso não tenham sido inseridos ainda

INSERT INTO clientes (nome, tipo, ativo)
SELECT v.nome, 'recorrente', v.ativo
FROM (VALUES
  ('Rios Floor',      true),   -- ativo hoje (aparece até Jun)
  ('Pro Squad',       true),   -- ativo hoje (aparece em Jun)
  ('Clínica Blanvur', false),  -- encerrou após Mar/2026
  ('Aquae Deca SEO',  false)   -- encerrou após Jan/2026
) AS v(nome, ativo)
WHERE NOT EXISTS (
  SELECT 1 FROM clientes c WHERE lower(c.nome) = lower(v.nome)
);

-- ─── 4. Corrige receitas que ficaram com tipo errado (pela aba de origem) ─────
-- As receitas em si estão corretas — o problema era só o cadastro do cliente.
-- Não há campo "tipo" na tabela receitas, então nada a corrigir lá.

-- ─── 5. Resumo esperado após execução ────────────────────────────────────────
-- Clientes recorrentes: Villa Grand Pets, Aquae Deca Tráfego, Ramá Ipatinga,
--   Casa do Bombeiro, Bragança Capital, Inova Franquia, Kind Roofing,
--   Mais 60 Saúde, Pratique Segurança, Valore, Ricardo Gontijo, Valorem,
--   Manutenção Favela.org, Rios Floor, Pro Squad, Clínica Blanvur, Aquae Deca SEO
-- Clientes variáveis: todos os demais (Antonio Bucomaxila, Inova Select, etc.)
