CREATE OR REPLACE FUNCTION public.instructor_insert_attendance_batch(
  p_records jsonb,
  p_daily_activity text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_role app_role;
  v_record jsonb;
  v_subject_id uuid;
  v_inserted int := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  v_role := public.get_user_role(v_user);

  IF v_role NOT IN ('admin'::app_role, 'secretary'::app_role, 'instructor'::app_role) THEN
    RAISE EXCEPTION 'Sem permissão para registrar frequência';
  END IF;

  IF p_records IS NULL OR jsonb_typeof(p_records) <> 'array' OR jsonb_array_length(p_records) = 0 THEN
    RAISE EXCEPTION 'Nenhum registro de frequência fornecido';
  END IF;

  -- Para instrutor, validar que TODOS os subject_ids pertencem a ele
  IF v_role = 'instructor'::app_role THEN
    FOR v_record IN SELECT * FROM jsonb_array_elements(p_records)
    LOOP
      v_subject_id := (v_record->>'subject_id')::uuid;
      IF NOT public.instructor_can_access_subject(v_user, v_subject_id) THEN
        RAISE EXCEPTION 'Você não tem permissão para registrar frequência nesta disciplina';
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.attendance (
    student_id, class_id, subject_id, date, is_present, justification, daily_activity
  )
  SELECT 
    (r->>'student_id')::uuid,
    (r->>'class_id')::uuid,
    (r->>'subject_id')::uuid,
    (r->>'date')::date,
    (r->>'is_present')::boolean,
    NULLIF(r->>'justification', ''),
    p_daily_activity
  FROM jsonb_array_elements(p_records) AS r;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'inserted', v_inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.instructor_insert_attendance_batch(jsonb, text) TO authenticated;