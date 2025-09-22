import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SecureProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  medical_info?: string;
  allergies?: string;
  medical_conditions?: string;
  medications?: string;
  blood_type?: string;
  health_insurance?: string;
  class_id?: string;
  student_id?: string;
  enrollment_number?: string;
  status?: string;
}

export const useSecureProfile = (userId?: string) => {
  const { profile: currentUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<SecureProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (targetUserId: string) => {
    if (!currentUser?.id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use existing secure access pattern
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Check permissions and filter sensitive data
        const canViewPersonal = await supabase.rpc('can_access_personal_data', {
          target_user_id: targetUserId
        });
        
        const canViewMedical = await supabase.rpc('can_access_medical_data', {
          target_user_id: targetUserId
        });

        // Filter data based on permissions
        const filteredData = {
          ...data,
          cpf: canViewPersonal.data ? data.cpf : null,
          rg: canViewPersonal.data ? data.rg : null,
          birth_date: canViewPersonal.data ? data.birth_date : null,
          medical_info: canViewMedical.data ? data.medical_info : null,
          allergies: canViewMedical.data ? data.allergies : null,
          medical_conditions: canViewMedical.data ? data.medical_conditions : null,
          medications: canViewMedical.data ? data.medications : null,
          blood_type: canViewMedical.data ? data.blood_type : null,
          health_insurance: canViewMedical.data ? data.health_insurance : null,
        };

        setProfile(filteredData);
      } else {
        setError('Perfil não encontrado ou sem permissão de acesso');
      }
    } catch (err) {
      console.error('Error fetching secure profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar perfil';
      setError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Erro de Segurança',
        description: 'Não foi possível acessar os dados do perfil. Verifique suas permissões.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  const updateProfileSecure = useCallback(async (targetUserId: string, updates: Record<string, any>) => {
    if (!currentUser?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);

      // Basic permission check for updates
      const updateFields = Object.keys(updates);
      
      // Check if user can access this profile at all
      const canAccessProfile = await supabase.rpc('can_access_profile_data', {
        target_user_id: targetUserId
      });

      if (!canAccessProfile.data) {
        throw new Error('Sem permissão para atualizar este perfil');
      }

      // Additional checks for sensitive fields
      const sensitiveFields = ['role', 'medical_info', 'allergies', 'medical_conditions', 'medications', 'cpf', 'rg'];
      const hasSensitiveUpdates = updateFields.some(field => sensitiveFields.includes(field));
      
      if (hasSensitiveUpdates && currentUser.role !== 'admin' && currentUser.role !== 'secretary') {
        throw new Error('Sem permissão para atualizar campos sensíveis');
      }

      // Perform the update using standard Supabase update
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) throw error;

      // Log the update for audit
      await supabase.rpc('log_sensitive_access', {
        p_action: 'UPDATE',
        p_table_name: 'profiles', 
        p_record_id: targetUserId,
        p_accessed_fields: updateFields
      });

      // Refresh the profile data
      await fetchProfile(targetUserId);

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com segurança',
      });

      return data;
    } catch (err) {
      console.error('Error updating secure profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      
      toast({
        variant: 'destructive',
        title: 'Erro de Segurança',
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast, fetchProfile]);

  const checkFieldPermission = useCallback(async (targetUserId: string, fieldName: string) => {
    if (!currentUser?.id) return false;

    try {
      // Basic permission checks using existing functions
      const canAccessProfile = await supabase.rpc('can_access_profile_data', {
        target_user_id: targetUserId
      });

      if (!canAccessProfile.data) return false;

      // Sensitive fields require admin/secretary privileges
      const sensitiveFields = ['role', 'medical_info', 'allergies', 'medical_conditions', 'medications', 'cpf', 'rg'];
      if (sensitiveFields.includes(fieldName)) {
        return currentUser.role === 'admin' || currentUser.role === 'secretary';
      }

      // Basic fields can be updated by the user themselves or admin/secretary
      return targetUserId === currentUser.id || currentUser.role === 'admin' || currentUser.role === 'secretary';
    } catch (error) {
      console.error('Error checking field permission:', error);
      return false;
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (userId && currentUser?.id) {
      fetchProfile(userId);
    }
  }, [userId, currentUser?.id, fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfileSecure,
    checkFieldPermission,
    refetch: () => userId ? fetchProfile(userId) : Promise.resolve(),
  };
};