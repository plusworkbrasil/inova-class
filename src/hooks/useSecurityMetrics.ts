import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SecurityMetrics {
  total_logs: number;
  sensitive_actions: number;
  medical_access_count: number;
  failed_access_attempts: number;
  unique_users: number;
  recent_admin_actions: number;
}

interface SuspiciousActivity {
  alert_type: string;
  user_id: string;
  user_name: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  occurrences: number;
  last_occurrence: string;
}

export const useSecurityMetrics = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch security metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_security_metrics');

      if (metricsError) {
        throw metricsError;
      }

      if (metricsData && metricsData.length > 0) {
        setMetrics(metricsData[0]);
      }

      // Fetch suspicious activities
      const { data: alertsData, error: alertsError } = await supabase
        .rpc('detect_suspicious_activity');

      if (alertsError) {
        throw alertsError;
      }

      setAlerts((alertsData || []).map(alert => ({
        ...alert,
        severity: alert.severity as 'HIGH' | 'MEDIUM' | 'LOW'
      })));

    } catch (error: any) {
      console.error('Error fetching security metrics:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar métricas de segurança."
      });
    } finally {
      setLoading(false);
    }
  };

  const logEnhancedAudit = async (
    action: string,
    tableName: string,
    recordId?: string,
    accessedFields?: string[]
  ) => {
    try {
      const { error } = await supabase.functions.invoke('enhanced-audit-log', {
        body: {
          action,
          table_name: tableName,
          record_id: recordId,
          accessed_fields: accessedFields
        }
      });

      if (error) {
        console.error('Enhanced audit logging error:', error);
      }
    } catch (error) {
      console.error('Error calling enhanced audit log:', error);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
  }, []);

  return {
    metrics,
    alerts,
    loading,
    fetchSecurityMetrics,
    logEnhancedAudit
  };
};