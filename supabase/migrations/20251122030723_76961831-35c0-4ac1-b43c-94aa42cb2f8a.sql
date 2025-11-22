-- ========================================
-- ETAPA 4 & 5: Automação e Sistema de Ocorrências
-- ========================================

-- Criar tipo ENUM para gravidade de incidentes
CREATE TYPE incident_severity AS ENUM ('baixa', 'media', 'alta', 'critica');

-- Criar tipo ENUM para status de incidentes
CREATE TYPE incident_status AS ENUM ('aberto', 'em_analise', 'resolvido', 'fechado');

-- Criar tabela de ocorrências/incidentes de equipamentos
CREATE TABLE IF NOT EXISTS equipment_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  allocation_id UUID REFERENCES equipment_allocations(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'media',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  status incident_status NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para equipment_incidents
CREATE INDEX idx_equipment_incidents_equipment_id ON equipment_incidents(equipment_id);
CREATE INDEX idx_equipment_incidents_status ON equipment_incidents(status);
CREATE INDEX idx_equipment_incidents_created_at ON equipment_incidents(created_at DESC);
CREATE INDEX idx_equipment_incidents_reported_by ON equipment_incidents(reported_by);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_equipment_incidents_updated_at
  BEFORE UPDATE ON equipment_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS Policies para equipment_incidents
-- ========================================

ALTER TABLE equipment_incidents ENABLE ROW LEVEL SECURITY;

-- Admins e secretários podem fazer tudo
CREATE POLICY "Admins and secretaries can manage incidents"
  ON equipment_incidents
  FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'secretary'));

-- Instrutores podem criar e ver ocorrências
CREATE POLICY "Instructors can view incidents"
  ON equipment_incidents
  FOR SELECT
  USING (get_user_role(auth.uid()) = 'instructor');

CREATE POLICY "Instructors can create incidents"
  ON equipment_incidents
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'instructor' 
    AND reported_by = auth.uid()
  );

-- ========================================
-- ETAPA 4: Função e Trigger para Liberar Equipamentos de Alunos Evadidos
-- ========================================

-- Função para liberar equipamentos quando aluno é evadido
CREATE OR REPLACE FUNCTION release_equipment_on_evasion()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas executar se a evasão está ativa
  IF NEW.status = 'active' THEN
    -- Cancelar todas as alocações ativas do aluno
    UPDATE equipment_allocations
    SET 
      status = 'cancelado',
      observations = COALESCE(observations, '') || E'\n' || 
        'Alocação cancelada automaticamente - Aluno evadido em ' || 
        to_char(NEW.date, 'DD/MM/YYYY'),
      updated_at = now()
    WHERE student_id = NEW.student_id
      AND status = 'ativo';

    -- Liberar equipamentos (atualizar status para disponível)
    UPDATE equipment
    SET 
      status = 'disponivel',
      updated_at = now()
    WHERE id IN (
      SELECT equipment_id 
      FROM equipment_allocations 
      WHERE student_id = NEW.student_id 
        AND status = 'cancelado'
        AND updated_at >= NEW.date
    );

    RAISE NOTICE 'Equipamentos do aluno % liberados automaticamente', NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_release_equipment_on_evasion ON evasions;
CREATE TRIGGER trigger_release_equipment_on_evasion
  AFTER INSERT OR UPDATE ON evasions
  FOR EACH ROW
  EXECUTE FUNCTION release_equipment_on_evasion();

-- ========================================
-- ETAPA 7: Ajustar RLS Policies para equipment_allocations
-- ========================================

-- Garantir que alunos vejam suas próprias alocações
DROP POLICY IF EXISTS "Students can view their own allocations" ON equipment_allocations;
CREATE POLICY "Students can view their own allocations"
  ON equipment_allocations
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'student' 
    AND student_id = auth.uid()
  );

-- Instrutor pode atualizar suas próprias alocações
DROP POLICY IF EXISTS "Instructors can update their allocations" ON equipment_allocations;
CREATE POLICY "Instructors can update their allocations"
  ON equipment_allocations
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'instructor' 
    AND allocated_by = auth.uid()
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'instructor' 
    AND allocated_by = auth.uid()
  );

-- Comentários para documentação
COMMENT ON TABLE equipment_incidents IS 'Tabela para registro de ocorrências e problemas com equipamentos';
COMMENT ON FUNCTION release_equipment_on_evasion() IS 'Função trigger que libera automaticamente equipamentos quando um aluno é marcado como evadido';
COMMENT ON TRIGGER trigger_release_equipment_on_evasion ON evasions IS 'Trigger que executa a liberação automática de equipamentos ao registrar evasão';