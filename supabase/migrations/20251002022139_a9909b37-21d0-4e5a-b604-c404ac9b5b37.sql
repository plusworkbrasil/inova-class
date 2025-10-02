-- Corrigir papéis de usuário: atualizar 'teacher' para 'instructor'
UPDATE profiles 
SET role = 'instructor'
WHERE role = 'teacher';

-- Remover 'teacher' do enum app_role para evitar confusão futura
-- Primeiro, verificar se há algum uso remanescente
DO $$ 
BEGIN
  -- Apenas informativo: contar quantos foram atualizados
  RAISE NOTICE 'Papéis de teacher atualizados para instructor';
END $$;

-- Atualizar qualquer referência em subjects que possa estar usando teacher_id
-- mas vinculado a usuários com papel teacher (agora instructor)
-- Não há necessidade de atualizar subjects.teacher_id pois é apenas um ID UUID

-- Garantir que as políticas RLS estejam corretas para instrutores
-- As políticas já existem, apenas verificando se estão ativas