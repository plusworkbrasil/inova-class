-- Ensure the sequence exists for auto student IDs
CREATE SEQUENCE IF NOT EXISTS public.student_id_seq START 1001;

-- Update the function to stop referencing NEW.role and use get_user_role instead
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Generate automatic student ID only for users whose role in user_roles is 'student'
  IF public.get_user_role(NEW.id) = 'student'::app_role AND NEW.auto_student_id IS NULL THEN
    NEW.auto_student_id = nextval('public.student_id_seq');
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill auto_student_id for existing student profiles missing the value
UPDATE public.profiles
SET auto_student_id = nextval('public.student_id_seq')
WHERE auto_student_id IS NULL
  AND public.get_user_role(id) = 'student'::app_role;
