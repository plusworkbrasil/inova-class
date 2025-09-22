-- Enhanced Profile Security Migration (Fixed)
-- This migration addresses critical security vulnerabilities identified in the security review

-- 1. Create enhanced field-level access control function
CREATE OR REPLACE FUNCTION public.can_update_profile_field(target_user_id uuid, field_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Admin and secretary can update any field
  IF get_user_role(auth.uid()) IN ('admin', 'secretary') THEN
    RETURN true;
  END IF;
  
  -- Users can only update their own basic fields
  IF auth.uid() = target_user_id THEN
    -- Allow basic personal fields
    IF field_name IN ('name', 'phone', 'avatar', 'emergency_contact_name', 'emergency_contact_phone') THEN
      RETURN true;
    END IF;
    
    -- Block sensitive fields that users shouldn't modify themselves
    IF field_name IN ('role', 'medical_info', 'allergies', 'medical_conditions', 'medications', 
                     'blood_type', 'health_insurance', 'cpf', 'rg', 'class_id', 'student_id',
                     'enrollment_number', 'status', 'auto_student_id') THEN
      RETURN false;
    END IF;
    
    -- Allow other non-sensitive fields
    RETURN true;
  END IF;
  
  -- Default deny
  RETURN false;
END;
$$;

-- 2. Enhanced medical data access logging
CREATE OR REPLACE FUNCTION public.log_medical_data_access(target_user_id uuid, accessed_fields text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only log if accessing medical fields
  IF array_length(accessed_fields, 1) > 0 THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      accessed_fields
    ) VALUES (
      auth.uid(),
      'VIEW_MEDICAL_DATA',
      'profiles',
      target_user_id,
      accessed_fields
    );
  END IF;
END;
$$;

-- 3. Drop existing insecure profile policies and create enhanced ones
DROP POLICY IF EXISTS "Secure profile updates" ON public.profiles;

-- Create new enhanced profile update policy with field-level checks
CREATE POLICY "Enhanced secure profile updates"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR 
  get_user_role(auth.uid()) IN ('admin', 'secretary')
)
WITH CHECK (
  -- Prevent role escalation attempts
  (OLD.role = NEW.role OR get_user_role(auth.uid()) IN ('admin', 'secretary')) AND
  -- Ensure field-level permissions are respected
  (auth.uid() = id OR get_user_role(auth.uid()) IN ('admin', 'secretary'))
);

-- 4. Update the existing profile validation trigger function
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is trying to update their own role without proper permissions
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.uid() = NEW.id AND get_user_role(auth.uid()) NOT IN ('admin', 'secretary') THEN
      RAISE EXCEPTION 'Unauthorized: Cannot modify role';
    END IF;
  END IF;
  
  -- Check sensitive field updates for non-privileged users
  IF auth.uid() = NEW.id AND get_user_role(auth.uid()) NOT IN ('admin', 'secretary') THEN
    -- Prevent modification of sensitive academic fields
    IF OLD.class_id IS DISTINCT FROM NEW.class_id OR
       OLD.student_id IS DISTINCT FROM NEW.student_id OR
       OLD.enrollment_number IS DISTINCT FROM NEW.enrollment_number OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.auto_student_id IS DISTINCT FROM NEW.auto_student_id THEN
      RAISE EXCEPTION 'Unauthorized: Cannot modify academic information';
    END IF;
    
    -- Prevent modification of identity fields
    IF OLD.cpf IS DISTINCT FROM NEW.cpf OR
       OLD.rg IS DISTINCT FROM NEW.rg THEN
      RAISE EXCEPTION 'Unauthorized: Cannot modify identity documents';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS validate_profile_security ON public.profiles;
CREATE TRIGGER validate_profile_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_update();

-- 5. Enhanced storage security policies for declarations bucket
DROP POLICY IF EXISTS "Users can upload declarations" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their declarations" ON storage.objects;

CREATE POLICY "Secure declaration uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'declarations' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Only allow specific file types
  lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx')
);

CREATE POLICY "Secure declaration access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'declarations' AND (
    -- Users can access their own files
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admins and secretaries can access all files
    get_user_role(auth.uid()) IN ('admin', 'secretary')
  )
);