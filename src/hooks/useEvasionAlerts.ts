import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EvasionAlert {
  classId: string;
  className: string;
  currentCount: number;
  previousAverage: number;
  increasePercentage: number;
  severity: 'high' | 'medium';
}

interface ClassInfo {
  id: string;
  name: string;
}

export const useEvasionAlerts = () => {
  const [alerts, setAlerts] = useState<EvasionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);

        // Fetch classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, name');
        
        setClasses(classesData || []);
        const classMap = new Map((classesData || []).map(c => [c.id, c.name]));

        // Get current month's evasions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const { data: currentEvasions } = await supabase
          .from('evasions')
          .select(`
            id,
            date,
            status,
            profiles!evasions_student_id_fkey(class_id)
          `)
          .gte('date', thirtyDaysAgoStr)
          .eq('status', 'active');

        // Get historical evasions (previous 90 days, excluding last 30)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

        const { data: historicalEvasions } = await supabase
          .from('evasions')
          .select(`
            id,
            date,
            status,
            profiles!evasions_student_id_fkey(class_id)
          `)
          .gte('date', ninetyDaysAgoStr)
          .lt('date', thirtyDaysAgoStr)
          .eq('status', 'active');

        // Group current evasions by class
        const currentByClass: Record<string, number> = {};
        currentEvasions?.forEach(e => {
          const classId = e.profiles?.class_id;
          if (classId) {
            currentByClass[classId] = (currentByClass[classId] || 0) + 1;
          }
        });

        // Calculate historical average by class (per month)
        const historicalByClass: Record<string, number> = {};
        historicalEvasions?.forEach(e => {
          const classId = e.profiles?.class_id;
          if (classId) {
            historicalByClass[classId] = (historicalByClass[classId] || 0) + 1;
          }
        });

        // Historical period is 2 months (60 days), so divide by 2 for monthly average
        const historicalMonthlyAvg: Record<string, number> = {};
        Object.entries(historicalByClass).forEach(([classId, count]) => {
          historicalMonthlyAvg[classId] = count / 2;
        });

        // Detect significant increases
        const detectedAlerts: EvasionAlert[] = [];
        
        Object.entries(currentByClass).forEach(([classId, currentCount]) => {
          const previousAvg = historicalMonthlyAvg[classId] || 0;
          
          // If no historical data, consider alert if current count >= 3
          if (previousAvg === 0 && currentCount >= 3) {
            detectedAlerts.push({
              classId,
              className: classMap.get(classId) || 'Turma Desconhecida',
              currentCount,
              previousAverage: 0,
              increasePercentage: 100,
              severity: currentCount >= 5 ? 'high' : 'medium'
            });
          } else if (previousAvg > 0) {
            const increasePercentage = ((currentCount - previousAvg) / previousAvg) * 100;
            
            // Alert if increase > 50%
            if (increasePercentage >= 50) {
              detectedAlerts.push({
                classId,
                className: classMap.get(classId) || 'Turma Desconhecida',
                currentCount,
                previousAverage: previousAvg,
                increasePercentage,
                severity: increasePercentage >= 100 ? 'high' : 'medium'
              });
            }
          }
        });

        // Sort by severity and percentage
        detectedAlerts.sort((a, b) => {
          if (a.severity !== b.severity) {
            return a.severity === 'high' ? -1 : 1;
          }
          return b.increasePercentage - a.increasePercentage;
        });

        setAlerts(detectedAlerts);
      } catch (error) {
        console.error('Error fetching evasion alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const hasAlerts = useMemo(() => alerts.length > 0, [alerts]);
  const highSeverityCount = useMemo(() => alerts.filter(a => a.severity === 'high').length, [alerts]);

  return {
    alerts,
    loading,
    hasAlerts,
    highSeverityCount,
    classes
  };
};
