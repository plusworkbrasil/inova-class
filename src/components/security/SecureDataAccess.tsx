import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
      // Get IP address and user agent for enhanced logging
      const ipAddress = null; // Would need server-side implementation for real IP
      const userAgent = navigator.userAgent;
      
      // Enhanced logging for medical data access
      const medicalFields = accessedFields.filter(field => 
        ['medical_info', 'allergies', 'medical_conditions', 'medications', 'blood_type', 'health_insurance'].includes(field)
      );

      // Enhanced logging for medical data access
      if (medicalFields.length > 0) {
        // Log medical data access using enhanced function
        await supabase.rpc('log_sensitive_access_enhanced', {
          p_action: 'VIEW_MEDICAL',
          p_table_name: 'profiles',
          p_record_id: userId,
          p_accessed_fields: medicalFields,
          p_ip_address: ipAddress,
          p_user_agent: userAgent
        });
      }

      // Log all access with enhanced logging
      await supabase.rpc('log_sensitive_access_enhanced', {
        p_action: 'VIEW',
        p_table_name: 'profiles',
        p_record_id: userId,
        p_accessed_fields: accessedFields,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });
    } catch (error) {
      console.error('Failed to log sensitive data access:', error);
    }
  }, [profile?.id, userId]);

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