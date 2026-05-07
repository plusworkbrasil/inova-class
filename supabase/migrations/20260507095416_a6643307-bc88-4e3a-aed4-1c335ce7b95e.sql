-- Trigger to prevent students (and other non-admin roles) from changing administrative fields on their own profile
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role app_role;
BEGIN
  caller_role := public.get_user_role(auth.uid());

  -- Admins and secretaries can change anything
  IF caller_role IN ('admin', 'secretary') THEN
    RETURN NEW;
  END IF;

  -- For everyone else (including users editing their own profile),
  -- force administrative fields to keep their previous values.
  NEW.status := OLD.status;
  NEW.class_id := OLD.class_id;
  NEW.enrollment_number := OLD.enrollment_number;
  NEW.auto_student_id := OLD.auto_student_id;
  NEW.student_id := OLD.student_id;
  NEW.teacher_id := OLD.teacher_id;
  NEW.instructor_subjects := OLD.instructor_subjects;
  NEW.email := OLD.email;
  NEW.enrollment_date := OLD.enrollment_date;

  -- Audit blocked attempt if any administrative field was different
  IF (OLD.status IS DISTINCT FROM NEW.status)
     OR (OLD.class_id IS DISTINCT FROM NEW.class_id)
     OR (OLD.enrollment_number IS DISTINCT FROM NEW.enrollment_number)
     OR (OLD.student_id IS DISTINCT FROM NEW.student_id)
     OR (OLD.teacher_id IS DISTINCT FROM NEW.teacher_id)
     OR (OLD.instructor_subjects IS DISTINCT FROM NEW.instructor_subjects)
     OR (OLD.email IS DISTINCT FROM NEW.email) THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
    VALUES (auth.uid(), 'BLOCKED_ADMIN_FIELD_UPDATE', 'profiles', NEW.id,
            ARRAY['status','class_id','enrollment_number','student_id','teacher_id','instructor_subjects','email']);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_admin_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_admin_fields();