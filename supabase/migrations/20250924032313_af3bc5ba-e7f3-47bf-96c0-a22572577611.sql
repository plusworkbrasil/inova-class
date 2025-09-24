-- Adicionar campos de data de início e término para disciplinas
ALTER TABLE public.subjects 
ADD COLUMN start_date date,
ADD COLUMN end_date date;