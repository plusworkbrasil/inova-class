-- Tabela de alunos em risco de evasão
CREATE TABLE public.students_at_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved', 'evaded')),
  identified_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Indicadores de risco
  attendance_percentage NUMERIC(5,2),
  grade_average NUMERIC(4,2),
  absences_last_30_days INTEGER DEFAULT 0,
  missed_activities INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por status ativo
CREATE INDEX idx_students_at_risk_status ON public.students_at_risk(status);
CREATE INDEX idx_students_at_risk_student ON public.students_at_risk(student_id);
CREATE INDEX idx_students_at_risk_risk_level ON public.students_at_risk(risk_level);

-- Tabela de intervenções/ações preventivas
CREATE TABLE public.risk_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_record_id UUID NOT NULL REFERENCES public.students_at_risk(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  intervention_type TEXT NOT NULL CHECK (intervention_type IN (
    'phone_call', 'meeting', 'family_contact', 'academic_support', 
    'psychological_support', 'financial_support', 'home_visit', 'other'
  )),
  description TEXT NOT NULL,
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'pending')),
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  follow_up_date DATE,
  follow_up_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por registro de risco
CREATE INDEX idx_risk_interventions_risk_record ON public.risk_interventions(risk_record_id);
CREATE INDEX idx_risk_interventions_student ON public.risk_interventions(student_id);

-- Habilitar RLS
ALTER TABLE public.students_at_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_interventions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para students_at_risk
CREATE POLICY "Admins and secretaries can manage all risk records"
ON public.students_at_risk FOR ALL
USING (get_user_role(auth.uid()) IN ('admin', 'secretary'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'secretary'));

CREATE POLICY "Tutors can view and create risk records"
ON public.students_at_risk FOR SELECT
USING (get_user_role(auth.uid()) = 'tutor');

CREATE POLICY "Tutors can insert risk records"
ON public.students_at_risk FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'tutor' AND identified_by = auth.uid());

CREATE POLICY "Tutors can update risk records they created or are assigned to"
ON public.students_at_risk FOR UPDATE
USING (get_user_role(auth.uid()) = 'tutor' AND (identified_by = auth.uid() OR assigned_to = auth.uid()))
WITH CHECK (get_user_role(auth.uid()) = 'tutor' AND (identified_by = auth.uid() OR assigned_to = auth.uid()));

CREATE POLICY "Instructors can view risk records of their students"
ON public.students_at_risk FOR SELECT
USING (get_user_role(auth.uid()) = 'instructor' AND instructor_can_view_student(student_id));

-- Políticas RLS para risk_interventions
CREATE POLICY "Admins and secretaries can manage all interventions"
ON public.risk_interventions FOR ALL
USING (get_user_role(auth.uid()) IN ('admin', 'secretary'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'secretary'));

CREATE POLICY "Tutors can view and create interventions"
ON public.risk_interventions FOR SELECT
USING (get_user_role(auth.uid()) = 'tutor');

CREATE POLICY "Tutors can insert interventions"
ON public.risk_interventions FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'tutor' AND performed_by = auth.uid());

CREATE POLICY "Users can update their own interventions"
ON public.risk_interventions FOR UPDATE
USING (performed_by = auth.uid())
WITH CHECK (performed_by = auth.uid());

CREATE POLICY "Instructors can view interventions of their students"
ON public.risk_interventions FOR SELECT
USING (get_user_role(auth.uid()) = 'instructor' AND instructor_can_view_student(student_id));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_students_at_risk_updated_at
  BEFORE UPDATE ON public.students_at_risk
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();