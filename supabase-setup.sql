-- =============================================
-- DESPESAS APP - Setup Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('ferramenta', 'anuncios', 'pessoal', 'imposto', 'servicos')),
  valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON public.despesas(data DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON public.despesas(categoria);

-- 3. Habilitar RLS
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (cada user só vê/edita as próprias despesas)
CREATE POLICY "Users can view own despesas"
  ON public.despesas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own despesas"
  ON public.despesas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own despesas"
  ON public.despesas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own despesas"
  ON public.despesas FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Habilitar Realtime na tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.despesas;

-- 6. (Opcional) View para total mensal por categoria
CREATE OR REPLACE VIEW public.v_despesas_resumo_mensal AS
SELECT
  user_id,
  date_trunc('month', data) AS mes,
  categoria,
  COUNT(*) AS qtd,
  SUM(valor) AS total
FROM public.despesas
GROUP BY user_id, date_trunc('month', data), categoria
ORDER BY mes DESC, total DESC;
