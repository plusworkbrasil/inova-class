import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SelectedStudent {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  shift: string | null;
  confirmed_shift: string | null;
  status: string;
  invite_token: string | null;
  token_expires_at: string | null;
  token_used_at: string | null;
  confirmed_at: string | null;
  enrolled_at: string | null;
  enrolled_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  whatsapp_sent_at: string | null;
  whatsapp_message_id: string | null;
  whatsapp_status: string | null;
  course_name: string | null;
  withdrawal_reason: string | null;
  withdrawn_at: string | null;
}

export interface CreateSelectedStudentInput {
  full_name: string;
  email: string;
  phone: string;
  cpf?: string;
  shift?: string;
  course_name?: string;
}

export const useSelectedStudents = () => {
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['selected-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('selected_students' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SelectedStudent[];
    },
  });

  const createStudent = useMutation({
    mutationFn: async (input: CreateSelectedStudentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Check email uniqueness against profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .maybeSingle();

      if (existingProfile) {
        throw new Error('Este e-mail já está sendo utilizado por um usuário na plataforma');
      }

      const { data, error } = await supabase
        .from('selected_students' as any)
        .insert({
          full_name: input.full_name,
          email: input.email,
          phone: input.phone,
          cpf: input.cpf,
          shift: input.shift || null,
          course_name: input.course_name || null,
          created_by: user.id,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('email')) {
          throw new Error('Este e-mail já está cadastrado na lista de selecionados');
        }
        throw error;
      }
      return data as unknown as SelectedStudent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selected-students'] });
      toast({ title: 'Aluno cadastrado com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' });
    },
  });

  const createBatch = useMutation({
    mutationFn: async (inputs: CreateSelectedStudentInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Check emails against profiles
      const emails = inputs.map(i => i.email);
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email')
        .in('email', emails);

      if (existingProfiles && existingProfiles.length > 0) {
        const existing = existingProfiles.map(p => p.email).join(', ');
        throw new Error(`E-mails já em uso na plataforma: ${existing}`);
      }

      const records = inputs.map(input => ({
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        cpf: input.cpf,
        shift: input.shift || null,
        course_name: input.course_name || null,
        created_by: user.id,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('selected_students' as any)
        .insert(records as any)
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Um ou mais e-mails já estão cadastrados');
        }
        throw error;
      }
      return data as unknown as SelectedStudent[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['selected-students'] });
      toast({ title: `${data.length} aluno(s) cadastrado(s) com sucesso` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro no cadastro em lote', description: error.message, variant: 'destructive' });
    },
  });

  const generateTokens = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const results: SelectedStudent[] = [];
      for (const id of studentIds) {
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('selected_students' as any)
          .update({
            invite_token: token,
            token_expires_at: expiresAt,
            status: 'invited',
          } as any)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        results.push(data as unknown as SelectedStudent);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selected-students'] });
    },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('selected_students' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selected-students'] });
      toast({ title: 'Registro removido' });
    },
  });

  const enrollStudent = useMutation({
    mutationFn: async ({ selectedStudentId, classId }: { selectedStudentId: string; classId: string }) => {
      const { data, error } = await supabase.functions.invoke('enroll-selected-student', {
        body: { selected_student_id: selectedStudentId, class_id: classId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['selected-students'] });
      toast({
        title: 'Aluno matriculado!',
        description: `Senha temporária: ${data.temp_password}`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao matricular', description: error.message, variant: 'destructive' });
    },
  });

  return {
    students,
    isLoading,
    createStudent,
    createBatch,
    generateTokens,
    deleteStudent,
    enrollStudent,
    pending: students.filter(s => s.status === 'pending' || s.status === 'invited'),
    confirmed: students.filter(s => s.status === 'confirmed'),
    enrolled: students.filter(s => s.status === 'enrolled'),
    withdrawn: students.filter(s => s.status === 'withdrawn'),
  };
};
