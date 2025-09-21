import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

interface SecureDataAccessProps {
  userId: string;
  children: (data: {
    canViewMedicalData: boolean;
    canViewPersonalData: boolean;
    canViewFullProfile: boolean;
    logAccess: (fields: string[]) => Promise<void>;
  }) => React.ReactNode;
}

export const SecureDataAccess = ({ userId, children }: SecureDataAccessProps) => {
  const { profile } = useAuth();

  const canViewMedicalData = profile?.role === 'admin' || profile?.role === 'secretary' || profile?.id === userId;
  const canViewPersonalData = profile?.role === 'admin' || profile?.role === 'secretary' || profile?.id === userId;
  const canViewFullProfile = profile?.role === 'admin' || profile?.role === 'secretary';

  const logAccess = useCallback(async (accessedFields: string[]) => {
    if (!profile?.id) return;
    
    try {
      await supabase.rpc('log_sensitive_access', {
        p_action: 'VIEW',
        p_table_name: 'profiles',
        p_record_id: userId,
        p_accessed_fields: accessedFields
      });
    } catch (error) {
      console.error('Failed to log sensitive data access:', error);
    }
  }, [profile?.id, userId]);

  return (
    <>
      {children({
        canViewMedicalData,
        canViewPersonalData,
        canViewFullProfile,
        logAccess
      })}
    </>
  );
};