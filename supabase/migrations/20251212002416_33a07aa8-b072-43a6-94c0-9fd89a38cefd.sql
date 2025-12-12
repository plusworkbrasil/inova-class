-- Remover a constraint antiga
ALTER TABLE evasions DROP CONSTRAINT IF EXISTS evasions_status_check;

-- Criar nova constraint incluindo 'cancelled'
ALTER TABLE evasions ADD CONSTRAINT evasions_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'returned'::text, 'confirmed'::text, 'cancelled'::text]));