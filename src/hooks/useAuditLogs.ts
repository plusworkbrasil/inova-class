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
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
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

      // Buscar dados dos usuários em batch (profiles e roles)
      const userIds = [...new Set(data?.map(log => log.user_id) || [])];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Criar mapas de user_id -> dados
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const roleMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      // Transformar dados para o formato esperado
      const transformedLogs = data?.map((log: any) => {
        const profile = profileMap.get(log.user_id);
        return {
          id: log.id,
          user_id: log.user_id,
          action: log.action,
          table_name: log.table_name,
          record_id: log.record_id,
          accessed_fields: log.accessed_fields,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: log.created_at,
          user_name: profile?.name || 'Usuário não encontrado',
          user_email: profile?.email || '',
          user_role: roleMap.get(log.user_id) || ''
        };
      }) || [];

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