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
      // Enhanced security: Check if user has permission to access these fields
      const hasPermission = await supabase.rpc('can_access_sensitive_fields', {
        target_user_id: userId
      });
      
      if (!hasPermission.data) {
        // Log unauthorized access attempt
        await logEnhancedAudit('UNAUTHORIZED_ACCESS_ATTEMPT', 'profiles', userId, accessedFields);
        throw new Error('Unauthorized access to sensitive data');
      }

      // Filter sensitive fields for enhanced logging
      const sensitiveFields = accessedFields.filter(field => 
        ['cpf', 'rg', 'medical_info', 'allergies', 'medical_conditions', 'medications', 'blood_type', 'health_insurance', 'phone', 'emergency_contact_phone', 'guardian_phone', 'parent_phone'].includes(field)
      );

      // Use enhanced audit logging with IP capture for sensitive fields
      if (sensitiveFields.length > 0) {
        await logEnhancedAudit('VIEW_SENSITIVE_DATA', 'profiles', userId, sensitiveFields);
      }

      // Log all field access with regular priority
      if (accessedFields.length !== sensitiveFields.length) {
        const regularFields = accessedFields.filter(field => !sensitiveFields.includes(field));
        await logEnhancedAudit('VIEW_PROFILE', 'profiles', userId, regularFields);
      }
      
    } catch (error) {
      console.error('Failed to log sensitive data access:', error);
      // Re-throw security errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        throw error;
      }
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