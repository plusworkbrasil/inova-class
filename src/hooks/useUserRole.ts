import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/user';

/**
 * Hook to get the current user's role from the user_roles table
 * This replaces direct profile.role access for security
 */
export const useUserRole = (userId?: string) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!userId) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('get_user_role', {
          user_id: userId
        });

        if (rpcError) {
          throw rpcError;
        }

        setRole(data as UserRole);
      } catch (err: any) {
        console.error('Error fetching user role:', err);
        setError(err.message);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  return { role, loading, error };
};