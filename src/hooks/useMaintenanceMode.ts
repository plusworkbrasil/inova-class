import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para o "modo manutenção" do sistema.
 * - Lê o estado atual via RPC pública `is_maintenance_mode` (funciona com ou sem login).
 * - Escuta mudanças em tempo real na tabela `system_settings`.
 * - Permite alternar o estado (apenas admin) via RPC `set_maintenance_mode`.
 */
export const useMaintenanceMode = () => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('is_maintenance_mode');
      if (error) {
        console.error('[useMaintenanceMode] erro ao consultar:', error);
        setEnabled(false);
      } else {
        setEnabled(Boolean(data));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const channel = supabase
      .channel('system_settings_maintenance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload: any) => {
          const row = payload.new || payload.old;
          if (row?.key === 'maintenance_mode') {
            const next = Boolean(row?.value?.enabled);
            setEnabled(next);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatus]);

  const toggle = useCallback(async (next: boolean) => {
    setToggling(true);
    try {
      const { data, error } = await supabase.rpc('set_maintenance_mode', { p_enabled: next });
      if (error) throw error;
      setEnabled(Boolean(data));
      return Boolean(data);
    } finally {
      setToggling(false);
    }
  }, []);

  return { enabled, loading, toggling, toggle, refresh: fetchStatus };
};
