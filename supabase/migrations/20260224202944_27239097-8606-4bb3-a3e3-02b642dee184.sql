CREATE OR REPLACE FUNCTION public.update_student_status_for_evasion(
  p_student_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_new_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Status invalido: %', p_new_status;
  END IF;

  IF get_user_role(auth.uid()) NOT IN ('admin', 'secretary', 'tutor') THEN
    RAISE EXCEPTION 'Sem permissao para alterar status do aluno';
  END IF;

  UPDATE profiles
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_student_id;
END;
$$;