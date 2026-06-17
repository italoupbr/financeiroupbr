-- Migration: add data_vencimento to receitas
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/bmnemeupygblffiphhwj/sql

ALTER TABLE receitas
  ADD COLUMN IF NOT EXISTS data_vencimento date;

-- Backfill: derive vencimento from mes_referencia (last day of the reference month)
-- Format of mes_referencia: "Jun/2026" → month index lookup needed
-- Using a safe default: first day of the month + 30 days
UPDATE receitas
SET data_vencimento = (
  to_date(
    CASE split_part(mes_referencia, '/', 1)
      WHEN 'Jan' THEN '01'
      WHEN 'Fev' THEN '02'
      WHEN 'Mar' THEN '03'
      WHEN 'Abr' THEN '04'
      WHEN 'Mai' THEN '05'
      WHEN 'Jun' THEN '06'
      WHEN 'Jul' THEN '07'
      WHEN 'Ago' THEN '08'
      WHEN 'Set' THEN '09'
      WHEN 'Out' THEN '10'
      WHEN 'Nov' THEN '11'
      WHEN 'Dez' THEN '12'
    END || '/' || split_part(mes_referencia, '/', 2),
    'MM/YYYY'
  ) + interval '29 days'
)::date
WHERE data_vencimento IS NULL
  AND mes_referencia IS NOT NULL;
