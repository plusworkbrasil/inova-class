-- Melhorar a função get_user_role para tratar casos null
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = user_id),
    'student'::app_role
  );
$$;

-- Atualizar trigger prevent_role_escalation para permitir operações do sistema
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip validation if no authenticated user (system operations)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Allow role changes only for admins and secretaries
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF get_user_role(auth.uid()) NOT IN ('admin', 'secretary') THEN
      RAISE EXCEPTION 'Access denied: Only admins and secretaries can change user roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar trigger validate_profile_security para ser menos restritivo
CREATE OR REPLACE FUNCTION public.validate_profile_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip validation if no authenticated user (system operations)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent users from changing their own role (except admin/secretary)
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.uid() = NEW.id AND get_user_role(auth.uid()) NOT IN ('admin', 'secretary') THEN
      RAISE EXCEPTION 'Access denied: Users cannot change their own role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Adicionar função de log para debugging
CREATE OR REPLACE FUNCTION public.log_profile_update_attempt(
  user_id uuid,
  target_id uuid,
  operation text,
  details text DEFAULT ''
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    accessed_fields
  ) VALUES (
    user_id,
    operation || '_ATTEMPT',
    'profiles',
    target_id,
    ARRAY[details]
  );
END;
$$;