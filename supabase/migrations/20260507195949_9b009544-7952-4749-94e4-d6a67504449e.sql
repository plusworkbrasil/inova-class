-- Fix mutable search_path on release_equipment_on_evasion trigger function
CREATE OR REPLACE FUNCTION public.release_equipment_on_evasion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE equipment_allocations
    SET 
      status = 'cancelado',
      observations = COALESCE(observations, '') || E'\n' || 
        'Alocação cancelada automaticamente - Aluno evadido em ' || 
        to_char(NEW.date, 'DD/MM/YYYY'),
      updated_at = now()
    WHERE student_id = NEW.student_id
      AND status = 'ativo';

    UPDATE equipment
    SET 
      status = 'disponivel',
      updated_at = now()
    WHERE id IN (
      SELECT equipment_id 
      FROM equipment_allocations 
      WHERE student_id = NEW.student_id 
        AND status = 'cancelado'
        AND updated_at >= NEW.date
    );
  END IF;
  RETURN NEW;
END;
$function$;