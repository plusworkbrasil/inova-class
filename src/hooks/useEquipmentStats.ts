import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEquipmentStats = () => {
  const [stats, setStats] = useState({
    activeAllocations: 0,
    available: 0,
    overdue: 0,
    inMaintenance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Buscar alocações ativas
        const { data: allocations, error: allocError } = await supabase
          .from('equipment_allocations')
          .select('*')
          .eq('status', 'ativo');

        if (allocError) throw allocError;

        // Buscar equipamentos disponíveis
        const { data: equipment, error: equipError } = await supabase
          .from('equipment')
          .select('*')
          .eq('status', 'disponivel');

        if (equipError) throw equipError;

        // Buscar equipamentos em manutenção
        const { data: maintenance, error: maintError } = await supabase
          .from('equipment')
          .select('*')
          .eq('status', 'manutencao');

        if (maintError) throw maintError;

        // Calcular atrasados
        const today = new Date();
        const overdue = allocations?.filter(a => 
          new Date(a.end_date) < today
        ).length || 0;

        setStats({
          activeAllocations: allocations?.length || 0,
          available: equipment?.length || 0,
          overdue: overdue,
          inMaintenance: maintenance?.length || 0
        });
      } catch (error) {
        console.error('Error fetching equipment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
};
