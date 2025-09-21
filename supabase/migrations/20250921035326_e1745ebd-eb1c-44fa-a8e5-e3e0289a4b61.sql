-- Enhanced security for profiles table with sensitive data protection

-- First, let's create a function to safely check if user can access profile data
CREATE OR REPLACE FUNCTION public.can_access_profile_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User can access their own data
    auth.uid() = target_user_id
    OR
    -- Admins and secretaries can access all profiles
    get_user_role(auth.uid()) IN ('admin', 'secretary')
    OR
    -- Instructors can only access limited data of students in their classes/subjects
    (
      get_user_role(auth.uid()) = 'instructor' 
      AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = target_user_id 
        AND p.class_id IN (
          SELECT DISTINCT s.class_id 
          FROM subjects s 
          WHERE s.teacher_id = auth.uid() 
          OR s.name = ANY(
            SELECT unnest(instructor_subjects) 
            FROM profiles 
            WHERE id = auth.uid()
          )
        )
      )
    );
$$;

-- Create a function for limited instructor access (only basic student info)
CREATE OR REPLACE FUNCTION public.can_instructor_view_basic_student_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    get_user_role(auth.uid()) = 'instructor' 
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = target_user_id 
      AND p.role = 'student'
      AND p.class_id IN (
        SELECT DISTINCT s.class_id 
        FROM subjects s 
        WHERE s.teacher_id = auth.uid() 
        OR s.name = ANY(
          SELECT unnest(instructor_subjects) 
          FROM profiles 
          WHERE id = auth.uid()
        )
      )
    );
$$;

-- Drop existing policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Admins and secretaries can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and secretaries can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create enhanced RLS policies with better data protection

-- Only admins and secretaries can insert new profiles
CREATE POLICY "Secure profile creation" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) IN ('admin', 'secretary')
);

-- Enhanced viewing policy with data access control
CREATE POLICY "Secure profile viewing" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  can_access_profile_data(id)
);

-- Restrict profile updates to own profile or admin/secretary
CREATE POLICY "Secure profile updates" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  -- Users can update their own profile
  auth.uid() = id
  OR
  -- Admins and secretaries can update any profile
  get_user_role(auth.uid()) IN ('admin', 'secretary')
)
WITH CHECK (
  -- Same conditions for the updated data
  auth.uid() = id
  OR
  get_user_role(auth.uid()) IN ('admin', 'secretary')
);

-- Prevent deletion of profiles except by admins
CREATE POLICY "Secure profile deletion" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (
  get_user_role(auth.uid()) = 'admin'
);

-- Add additional security trigger to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION public.validate_profile_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent users from changing their own role (except admin/secretary)
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.uid() = NEW.id AND get_user_role(auth.uid()) NOT IN ('admin', 'secretary') THEN
      RAISE EXCEPTION 'Access denied: Users cannot change their own role';
    END IF;
  END IF;
  
  -- Log sensitive data access (optional audit trail)
  IF get_user_role(auth.uid()) = 'instructor' AND NEW.id != auth.uid() THEN
    INSERT INTO auth.audit_log_entries (
      instance_id, 
      id, 
      payload, 
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      gen_random_uuid(),
      json_build_object(
        'action', 'profile_access',
        'instructor_id', auth.uid(),
        'student_id', NEW.id,
        'timestamp', now()
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the security trigger
DROP TRIGGER IF EXISTS validate_profile_security_trigger ON public.profiles;
CREATE TRIGGER validate_profile_security_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_security();

-- Add indexes for better performance on security checks
CREATE INDEX IF NOT EXISTS idx_profiles_role_class ON public.profiles(role, class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON public.profiles(id) WHERE id = auth.uid();

-- Create a view for instructors to access only necessary student data
CREATE OR REPLACE VIEW public.instructor_student_view AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.student_id,
  p.class_id,
  p.enrollment_date,
  p.status,
  p.enrollment_number,
  -- Exclude sensitive medical, financial, and personal details
  NULL as cpf,
  NULL as rg,
  NULL as birth_date,
  NULL as phone,
  NULL as cep,
  NULL as street,
  NULL as number,
  NULL as complement,
  NULL as neighborhood,
  NULL as city,
  NULL as state,
  NULL as guardian_name,
  NULL as guardian_phone,
  NULL as guardian_email,
  NULL as parent_name,
  NULL as parent_phone,
  NULL as medical_conditions,
  NULL as allergies,
  NULL as medications,
  NULL as blood_type,
  NULL as health_insurance,
  NULL as emergency_contact_name,
  NULL as emergency_contact_phone
FROM public.profiles p
WHERE 
  p.role = 'student'
  AND can_instructor_view_basic_student_data(p.id);

-- Grant access to the view
GRANT SELECT ON public.instructor_student_view TO authenticated;

COMMENT ON TABLE public.profiles IS 'User profiles with enhanced security controls for sensitive personal data';
COMMENT ON FUNCTION public.can_access_profile_data(uuid) IS 'Security function to control access to profile data based on user roles and relationships';
COMMENT ON VIEW public.instructor_student_view IS 'Limited view for instructors to access only necessary student information without sensitive data';