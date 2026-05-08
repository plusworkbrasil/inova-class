
-- Allow profiles.email to stay in sync with auth.users.email after the user
-- confirms an email change. We modify the protection trigger to permit
-- self-updates when the new email matches the actual authenticated email.

CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_role app_role;
  auth_email text;
BEGIN
  caller_role := public.get_user_role(auth.uid());

  -- Admins and secretaries can change anything
  IF caller_role IN ('admin', 'secretary') THEN
    RETURN NEW;
  END IF;

  -- Allow user to sync their own profile.email with their confirmed auth email
  IF auth.uid() = NEW.id AND OLD.email IS DISTINCT FROM NEW.email THEN
    SELECT email INTO auth_email FROM auth.users WHERE id = NEW.id;
    IF auth_email IS NOT NULL AND lower(auth_email) = lower(NEW.email) THEN
      -- email change is legitimate, leave NEW.email as is
      NULL;
    ELSE
      NEW.email := OLD.email;
    END IF;
  ELSE
    NEW.email := OLD.email;
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
  NEW.enrollment_date := OLD.enrollment_date;

  IF (OLD.status IS DISTINCT FROM NEW.status)
     OR (OLD.class_id IS DISTINCT FROM NEW.class_id)
     OR (OLD.enrollment_number IS DISTINCT FROM NEW.enrollment_number)
     OR (OLD.student_id IS DISTINCT FROM NEW.student_id)
     OR (OLD.teacher_id IS DISTINCT FROM NEW.teacher_id)
     OR (OLD.instructor_subjects IS DISTINCT FROM NEW.instructor_subjects) THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
    VALUES (auth.uid(), 'BLOCKED_ADMIN_FIELD_UPDATE', 'profiles', NEW.id,
            ARRAY['status','class_id','enrollment_number','student_id','teacher_id','instructor_subjects']);
  END IF;

  RETURN NEW;
END;
$function$;
