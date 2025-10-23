-- Renomear coluna date para start_date
ALTER TABLE public.equipment_allocations 
RENAME COLUMN date TO start_date;

-- Adicionar coluna end_date com valor padrão de 7 dias após a data de início
ALTER TABLE public.equipment_allocations 
ADD COLUMN end_date date NOT NULL DEFAULT CURRENT_DATE + INTERVAL '7 days';

-- Comentários para documentação
COMMENT ON COLUMN public.equipment_allocations.start_date IS 'Data de início da alocação do equipamento';
COMMENT ON COLUMN public.equipment_allocations.end_date IS 'Data prevista para devolução do equipamento';
COMMENT ON COLUMN public.equipment_allocations.returned_at IS 'Data/hora real da devolução (quando status = finalizado)';