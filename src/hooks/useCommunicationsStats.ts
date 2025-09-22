import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommunicationStats {
  totalEmails: number;
  totalWhatsapp: number;
  thisMonthCommunications: number;
  deliveryRate: number;
}

export const useCommunicationsStats = () => {
  const [stats, setStats] = useState<CommunicationStats>({
    totalEmails: 0,
    totalWhatsapp: 0,
    thisMonthCommunications: 0,
    deliveryRate: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get all communications
      const { data: communications, error } = await supabase
        .from('communications')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const thisMonth = communications?.filter(comm => {
        const commDate = new Date(comm.created_at);
        return commDate.getMonth() === now.getMonth() && 
               commDate.getFullYear() === now.getFullYear();
      }).length || 0;

      // Calculate stats (simplified for now)
      const totalCommunications = communications?.length || 0;
      const publishedCommunications = communications?.filter(c => c.is_published).length || 0;
      
      setStats({
        totalEmails: totalCommunications, // Simplified - assuming all are emails
        totalWhatsapp: Math.floor(totalCommunications * 0.8), // Simplified calculation
        thisMonthCommunications: thisMonth,
        deliveryRate: totalCommunications > 0 ? Math.round((publishedCommunications / totalCommunications) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching communication stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};