import { useState, useEffect, useCallback, useRef } from 'react';
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

export interface AuditFilters {
  userQuery?: string;
  action?: string;
  tableName?: string;
  startDate?: string;
  endDate?: string;
}

const PROFILE_CACHE = new Map<string, { name: string; email: string; role: string }>();

const enrichLogs = async (raw: any[]): Promise<AuditLog[]> => {
  const userIds = [...new Set(raw.map((l) => l.user_id).filter(Boolean))];
  const missing = userIds.filter((id) => !PROFILE_CACHE.has(id));

  if (missing.length > 0) {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, name, email').in('id', missing),
      supabase.from('user_roles').select('user_id, role').in('user_id', missing),
    ]);
    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
    (profiles || []).forEach((p: any) =>
      PROFILE_CACHE.set(p.id, {
        name: p.name || 'Usuário',
        email: p.email || '',
        role: roleMap.get(p.id) || '',
      })
    );
    missing.forEach((id) => {
      if (!PROFILE_CACHE.has(id))
        PROFILE_CACHE.set(id, { name: 'Sistema/Desconhecido', email: '', role: '' });
    });
  }

  return raw.map((log: any) => {
    const p = PROFILE_CACHE.get(log.user_id) || { name: 'Sistema', email: '', role: '' };
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
      user_name: p.name,
      user_email: p.email,
      user_role: p.role,
    };
  });
};

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const filtersRef = useRef<AuditFilters>({});
  const pageRef = useRef({ page: 0, pageSize: 50 });
  const { toast } = useToast();

  const fetchLogs = useCallback(
    async (page = 0, pageSize = 50, filters: AuditFilters = {}) => {
      pageRef.current = { page, pageSize };
      filtersRef.current = filters;
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        let query = supabase
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (filters.action && filters.action !== '__all__')
          query = query.eq('action', filters.action);
        if (filters.tableName && filters.tableName !== '__all__')
          query = query.eq('table_name', filters.tableName);
        if (filters.startDate) query = query.gte('created_at', filters.startDate);
        if (filters.endDate) query = query.lte('created_at', filters.endDate);

        const from = page * pageSize;
        query = query.range(from, from + pageSize - 1);

        const { data, error, count } = await query;
        if (error) {
          console.error('Error fetching audit logs:', error);
          if (error.code !== 'PGRST301') {
            toast({
              variant: 'destructive',
              title: 'Erro',
              description: 'Erro ao carregar logs de auditoria.',
            });
          }
          return;
        }

        let enriched = await enrichLogs(data || []);

        if (filters.userQuery) {
          const q = filters.userQuery.toLowerCase();
          enriched = enriched.filter(
            (l) =>
              l.user_name.toLowerCase().includes(q) ||
              l.user_email.toLowerCase().includes(q)
          );
        }

        setLogs(enriched);
        setTotalCount(count || 0);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Realtime subscription
  useEffect(() => {
    let unsubAuth: (() => void) | undefined;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchLogs();
      else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
          if (s) {
            fetchLogs();
            subscription.unsubscribe();
          }
        });
        unsubAuth = () => subscription.unsubscribe();
      }
    };
    init();

    const channel = supabase
      .channel('audit-logs-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        async (payload) => {
          // Apenas se estamos na primeira página e sem filtros restritivos avançados
          if (pageRef.current.page !== 0) return;
          const enriched = await enrichLogs([payload.new]);
          const f = filtersRef.current;
          const log = enriched[0];
          if (f.action && f.action !== '__all__' && log.action !== f.action) return;
          if (f.tableName && f.tableName !== '__all__' && log.table_name !== f.tableName) return;
          if (f.userQuery) {
            const q = f.userQuery.toLowerCase();
            if (!log.user_name.toLowerCase().includes(q) && !log.user_email.toLowerCase().includes(q))
              return;
          }
          setLogs((prev) => [log, ...prev].slice(0, pageRef.current.pageSize));
          setTotalCount((c) => c + 1);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      if (unsubAuth) unsubAuth();
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  return {
    logs,
    loading,
    totalCount,
    isLive,
    fetchLogs,
    refreshLogs: () =>
      fetchLogs(pageRef.current.page, pageRef.current.pageSize, filtersRef.current),
  };
};
