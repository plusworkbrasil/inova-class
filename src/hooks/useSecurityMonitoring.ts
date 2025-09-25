import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SecurityAlert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
}

interface SuspiciousActivity {
  alert_type: string;
  user_id: string;
  user_name: string;
  description: string;
  severity: string;
  occurrences: number;
  last_occurrence: string;
}

export const useSecurityMonitoring = () => {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const checkSuspiciousActivity = async () => {
    if (!profile || profile.role !== 'admin') return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('detect_suspicious_activity');
      
      if (error) throw error;

      const securityAlerts: SecurityAlert[] = (data as SuspiciousActivity[]).map((activity, index) => ({
        id: `${activity.alert_type}_${activity.user_id}_${index}`,
        type: activity.severity.toLowerCase() === 'high' ? 'critical' : 
              activity.severity.toLowerCase() === 'medium' ? 'warning' : 'info',
        title: `Security Alert: ${activity.alert_type.replace(/_/g, ' ')}`,
        message: `${activity.description} - User: ${activity.user_name} (${activity.occurrences} occurrences)`,
        timestamp: new Date(activity.last_occurrence)
      }));

      setAlerts(securityAlerts);
    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityMetrics = async () => {
    if (!profile || profile.role !== 'admin') return null;

    try {
      const { data, error } = await supabase.rpc('get_security_metrics');
      
      if (error) throw error;
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return null;
    }
  };

  const clearAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      checkSuspiciousActivity();
      
      // Check for suspicious activity every 5 minutes
      const interval = setInterval(checkSuspiciousActivity, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [profile]);

  return {
    alerts,
    loading,
    checkSuspiciousActivity,
    getSecurityMetrics,
    clearAlert
  };
};