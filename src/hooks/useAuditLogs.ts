import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  accessed_fields: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchLogs = async (
    page: number = 0,
    pageSize: number = 50,
    userFilter: string = '',
    actionFilter: string = ''
  ) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!audit_logs_user_id_fkey (
            name,
            email,
            role
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (userFilter) {
        query = query.or(`profiles.name.ilike.%${userFilter}%,profiles.email.ilike.%${userFilter}%`);
      }

      if (actionFilter && actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      // Aplicar paginação
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar logs de auditoria."
        });
        return;
      }

      // Transformar dados para o formato esperado
      const transformedLogs = data?.map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        table_name: log.table_name,
        record_id: log.record_id,
        accessed_fields: log.accessed_fields,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user_name: log.profiles?.name || 'Usuário não encontrado',
        user_email: log.profiles?.email || '',
        user_role: log.profiles?.role || ''
      })) || [];

      setLogs(transformedLogs);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar logs de auditoria."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    totalCount,
    fetchLogs,
    refreshLogs: () => fetchLogs()
  };
};