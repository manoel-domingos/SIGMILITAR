-- Adiciona coluna para controle de laudo na tabela students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sob_laudo_paed_cid TEXT;
