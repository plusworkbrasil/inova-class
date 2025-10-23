-- Inserir notebooks de 004 até 125 seguindo o padrão existente
INSERT INTO public.equipment (name, patrimonio, type, status)
SELECT 
  'Notebook ' || LPAD(num::text, 3, '0') as name,
  LPAD(num::text, 3, '0') as patrimonio,
  'notebook' as type,
  'disponivel' as status
FROM generate_series(4, 125) as num
ON CONFLICT DO NOTHING;