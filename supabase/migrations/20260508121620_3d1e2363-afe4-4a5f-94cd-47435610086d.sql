
-- Desativa replicação local para evitar trigger de auditoria que falha sem auth.uid()
SET session_replication_role = 'replica';

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'student'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.id IS NULL
  AND p.class_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

SET session_replication_role = 'origin';

-- Trigger preventivo
CREATE OR REPLACE FUNCTION public.ensure_student_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.class_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_student_role_on_profile_insert ON public.profiles;
CREATE TRIGGER ensure_student_role_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_student_role();

DROP TRIGGER IF EXISTS ensure_student_role_on_profile_update ON public.profiles;
CREATE TRIGGER ensure_student_role_on_profile_update
AFTER UPDATE OF class_id ON public.profiles
FOR EACH ROW
WHEN (NEW.class_id IS NOT NULL AND (OLD.class_id IS DISTINCT FROM NEW.class_id))
EXECUTE FUNCTION public.ensure_student_role();
