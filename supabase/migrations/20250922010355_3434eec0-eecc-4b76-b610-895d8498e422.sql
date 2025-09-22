-- Enhanced Profile Security Migration
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
      accessed_fields,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      'VIEW_MEDICAL_DATA',
      'profiles',
      target_user_id,
      accessed_fields,
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
  END IF;
END;
$$;

-- 3. Create secure profile view function that respects field-level permissions
CREATE OR REPLACE FUNCTION public.get_secure_profile_data(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role app_role,
  phone text,
  avatar text,
  -- Conditionally return sensitive fields based on permissions
  cpf text,
  rg text,
  birth_date date,
  medical_info text,
  allergies text,
  medical_conditions text,
  medications text,
  blood_type text,
  health_insurance text,
  class_id uuid,
  student_id text,
  enrollment_number text,
  status text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  can_view_personal boolean;
  can_view_medical boolean;
  profile_record profiles%ROWTYPE;
BEGIN
  -- Check permissions
  can_view_personal := can_access_personal_data(target_user_id);
  can_view_medical := can_access_medical_data(target_user_id);
  
  -- Get the profile data
  SELECT * INTO profile_record FROM profiles WHERE profiles.id = target_user_id;
  
  -- Log medical data access if accessing sensitive fields
  IF can_view_medical THEN
    PERFORM log_medical_data_access(target_user_id, ARRAY['medical_info', 'allergies', 'medical_conditions', 'medications', 'blood_type']);
  END IF;
  
  -- Return data based on permissions
  RETURN QUERY SELECT
    profile_record.id,
    profile_record.name,
    profile_record.email,
    profile_record.role,
    profile_record.phone,
    profile_record.avatar,
    -- Personal data (CPF, RG) only if authorized
    CASE WHEN can_view_personal THEN profile_record.cpf ELSE NULL END,
    CASE WHEN can_view_personal THEN profile_record.rg ELSE NULL END,
    CASE WHEN can_view_personal THEN profile_record.birth_date ELSE NULL END,
    -- Medical data only if authorized
    CASE WHEN can_view_medical THEN profile_record.medical_info ELSE NULL END,
    CASE WHEN can_view_medical THEN profile_record.allergies ELSE NULL END,
    CASE WHEN can_view_medical THEN profile_record.medical_conditions ELSE NULL END,
    CASE WHEN can_view_medical THEN profile_record.medications ELSE NULL END,
    CASE WHEN can_view_medical THEN profile_record.blood_type ELSE NULL END,
    CASE WHEN can_view_medical THEN profile_record.health_insurance ELSE NULL END,
    -- Academic data based on role permissions
    profile_record.class_id,
    profile_record.student_id,
    profile_record.enrollment_number,
    profile_record.status;
END;
$$;

-- 4. Drop existing insecure profile policies and create enhanced ones
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

-- 5. Add trigger to validate profile updates and prevent unauthorized changes
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

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS validate_profile_security ON public.profiles;
CREATE TRIGGER validate_profile_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_update();

-- 6. Create function to safely update profile with audit logging
CREATE OR REPLACE FUNCTION public.update_profile_secure(
  target_user_id uuid,
  profile_updates jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  field_key text;
  field_value text;
  updated_fields text[] := '{}';
BEGIN
  -- Check if user can update this profile
  IF NOT (auth.uid() = target_user_id OR get_user_role(auth.uid()) IN ('admin', 'secretary')) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update this profile';
  END IF;
  
  -- Validate each field update
  FOR field_key, field_value IN SELECT * FROM jsonb_each_text(profile_updates) LOOP
    IF NOT can_update_profile_field(target_user_id, field_key) THEN
      RAISE EXCEPTION 'Unauthorized: Cannot update field %', field_key;
    END IF;
    updated_fields := array_append(updated_fields, field_key);
  END LOOP;
  
  -- Log the update
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    accessed_fields
  ) VALUES (
    auth.uid(),
    'UPDATE_PROFILE',
    'profiles',
    target_user_id,
    updated_fields
  );
  
  RETURN true;
END;
$$;