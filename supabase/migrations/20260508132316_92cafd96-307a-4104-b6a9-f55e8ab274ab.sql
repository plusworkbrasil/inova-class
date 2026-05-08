ALTER TABLE public.declarations DROP CONSTRAINT declarations_type_check;
ALTER TABLE public.declarations ADD CONSTRAINT declarations_type_check
  CHECK (type IN (
    'medical_certificate',
    'enrollment_certificate',
    'atestado_medico',
    'atestado_trabalho',
    'outros'
  ));