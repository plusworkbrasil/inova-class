-- Security Enhancement: Harden all database functions with proper search_path
-- This prevents potential SQL injection through search_path manipulation

-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = user_id),
    'student'::app_role
  );
$function$;

-- Update can_access_medical_data function  
CREATE OR REPLACE FUNCTION public.can_access_medical_data(target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT 
    -- Only admins and secretaries can access medical data
    get_user_role(auth.uid()) IN ('admin', 'secretary')
    OR 
    -- Users can access their own medical data
    auth.uid() = target_user_id;
$function$;

-- Update can_access_personal_data function
CREATE OR REPLACE FUNCTION public.can_access_personal_data(target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT 
    -- Admins and secretaries can access personal data
    get_user_role(auth.uid()) IN ('admin', 'secretary')
    OR 
    -- Users can access their own personal data
    auth.uid() = target_user_id;
$function$;

-- Update instructor_can_view_student function
CREATE OR REPLACE FUNCTION public.instructor_can_view_student(target_student_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles student_profile
    JOIN subjects s ON s.class_id = student_profile.class_id
    JOIN profiles instructor_profile ON instructor_profile.id = auth.uid()
    WHERE student_profile.id = target_student_id
      AND student_profile.role = 'student'
      AND instructor_profile.role = 'instructor'
      AND (
        s.teacher_id = auth.uid() 
        OR s.name = ANY(instructor_profile.instructor_subjects)
      )
  );
$function$;

-- Update is_instructor_of_subject function
CREATE OR REPLACE FUNCTION public.is_instructor_of_subject(user_id uuid, subject text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT subject = ANY(instructor_subjects) FROM public.profiles WHERE id = user_id AND role = 'instructor';
$function$;

-- Update can_access_profile_data function
CREATE OR REPLACE FUNCTION public.can_access_profile_data(target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.get_security_metrics()
 RETURNS TABLE(
   total_logs bigint,
   sensitive_actions bigint,
   medical_access_count bigint,
   failed_access_attempts bigint,
   unique_users bigint,
   recent_admin_actions bigint
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT 
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE action LIKE '%MEDICAL%' OR action LIKE '%PERSONAL%') as sensitive_actions,
    COUNT(*) FILTER (WHERE 'medical_info' = ANY(accessed_fields) OR 'allergies' = ANY(accessed_fields)) as medical_access_count,
    COUNT(*) FILTER (WHERE action LIKE '%FAILED%' OR action LIKE '%DENIED%') as failed_access_attempts,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours' AND user_id IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )) as recent_admin_actions
  FROM audit_logs
  WHERE created_at >= NOW() - INTERVAL '30 days';
$function$;

-- Create function to detect suspicious activities
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
 RETURNS TABLE(
   alert_type text,
   user_id uuid,
   user_name text,
   description text,
   severity text,
   occurrences bigint,
   last_occurrence timestamp with time zone
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  -- Detect users with excessive failed login attempts
  SELECT 
    'EXCESSIVE_FAILED_LOGINS' as alert_type,
    al.user_id,
    p.name as user_name,
    'User has multiple failed login attempts in the last hour' as description,
    'HIGH' as severity,
    COUNT(*) as occurrences,
    MAX(al.created_at) as last_occurrence
  FROM audit_logs al
  JOIN profiles p ON p.id = al.user_id
  WHERE al.action LIKE '%FAILED%' 
    AND al.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY al.user_id, p.name
  HAVING COUNT(*) >= 5

  UNION ALL

  -- Detect unusual medical data access patterns
  SELECT 
    'UNUSUAL_MEDICAL_ACCESS' as alert_type,
    al.user_id,
    p.name as user_name,
    'User accessed medical data for multiple students in short time' as description,
    'MEDIUM' as severity,
    COUNT(DISTINCT al.record_id) as occurrences,
    MAX(al.created_at) as last_occurrence
  FROM audit_logs al
  JOIN profiles p ON p.id = al.user_id
  WHERE ('medical_info' = ANY(al.accessed_fields) OR 'allergies' = ANY(al.accessed_fields))
    AND al.created_at >= NOW() - INTERVAL '1 hour'
    AND p.role != 'admin'
  GROUP BY al.user_id, p.name
  HAVING COUNT(DISTINCT al.record_id) >= 10

  UNION ALL

  -- Detect after-hours administrative actions
  SELECT 
    'AFTER_HOURS_ADMIN' as alert_type,
    al.user_id,
    p.name as user_name,
    'Administrative actions performed outside business hours' as description,
    'LOW' as severity,
    COUNT(*) as occurrences,
    MAX(al.created_at) as last_occurrence
  FROM audit_logs al
  JOIN profiles p ON p.id = al.user_id
  WHERE p.role = 'admin'
    AND (EXTRACT(hour FROM al.created_at) < 8 OR EXTRACT(hour FROM al.created_at) > 18)
    AND al.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY al.user_id, p.name
  HAVING COUNT(*) >= 5;
$function$;