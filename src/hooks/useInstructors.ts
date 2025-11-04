import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Instructor {
  id: string;
  name: string;
  email: string;
}

export const useInstructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar IDs dos instrutores da tabela user_roles
      const { data: instructorRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'instructor');
      
      if (rolesError) throw rolesError;
      
      if (!instructorRoles || instructorRoles.length === 0) {
        setInstructors([]);
        setLoading(false);
        return;
      }
      
      const instructorIds = instructorRoles.map(r => r.user_id);
      
      // Buscar dados dos profiles dos instrutores
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', instructorIds)
        .order('name', { ascending: true });
      
      if (profilesError) throw profilesError;
      
      setInstructors(profiles || []);
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  return { instructors, loading, error, refetch: fetchInstructors };
};
