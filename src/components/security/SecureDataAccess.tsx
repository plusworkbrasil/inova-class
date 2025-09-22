import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityMetrics } from '@/hooks/useSecurityMetrics';
import { useCallback, useEffect, useState } from 'react';

interface SecureDataAccessProps {
  userId: string;
  children: (data: {
    canViewMedicalData: boolean;
    canViewPersonalData: boolean;
    canViewFullProfile: boolean;
    canViewBasicData: boolean;
    logAccess: (fields: string[]) => Promise<void>;
    isLoading: boolean;
  }) => React.ReactNode;
}

export const SecureDataAccess = ({ userId, children }: SecureDataAccessProps) => {
  const { profile } = useAuth();
  const { logEnhancedAudit } = useSecurityMetrics();
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    canViewMedicalData: false,
    canViewPersonalData: false,
    canViewFullProfile: false,
    canViewBasicData: false
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!profile?.id || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check medical data access
        const { data: medicalAccess } = await supabase.rpc('can_access_medical_data', {
          target_user_id: userId
        });

        // Check personal data access
        const { data: personalAccess } = await supabase.rpc('can_access_personal_data', {
          target_user_id: userId
        });

        // Check if user is instructor who can view basic student data
        const { data: instructorAccess } = await supabase.rpc('instructor_can_view_student', {
          target_student_id: userId
        });

        setPermissions({
          canViewMedicalData: medicalAccess || false,
          canViewPersonalData: personalAccess || false,
          canViewFullProfile: profile.role === 'admin' || profile.role === 'secretary',
          canViewBasicData: personalAccess || instructorAccess || false
        });
      } catch (error) {
        console.error('Failed to check data access permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [profile?.id, profile?.role, userId]);

  const logAccess = useCallback(async (accessedFields: string[]) => {
    if (!profile?.id || !accessedFields.length) return;
    
    try {
      // Filter medical fields for specific logging
      const medicalFields = accessedFields.filter(field => 
        ['medical_info', 'allergies', 'medical_conditions', 'medications', 'blood_type', 'health_insurance'].includes(field)
      );

      // Use enhanced audit logging with IP capture
      if (medicalFields.length > 0) {
        await logEnhancedAudit('VIEW_MEDICAL', 'profiles', userId, medicalFields);
      }

      // Log all field access
      await logEnhancedAudit('VIEW_PROFILE', 'profiles', userId, accessedFields);
      
    } catch (error) {
      console.error('Failed to log sensitive data access:', error);
    }
  }, [profile?.id, userId, logEnhancedAudit]);

  return (
    <>
      {children({
        ...permissions,
        logAccess,
        isLoading
      })}
    </>
  );
};