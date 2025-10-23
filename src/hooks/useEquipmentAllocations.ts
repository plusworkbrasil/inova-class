import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface EquipmentAllocation {
  id: string;
  equipment_id: string;
  student_id: string;
  allocated_by: string;
  shift: 'manha' | 'tarde' | 'noite';
  start_date: string;
  end_date: string;
  status: 'ativo' | 'finalizado' | 'cancelado';
  allocated_at: string;
  returned_at?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  equipment?: {
    name: string;
    patrimonio?: string;
    type: string;
  } | null;
  student?: {
    name: string;
    student_id?: string;
  } | null;
  allocator?: {
    name: string;
  } | null;
}

export const useEquipmentAllocations = () => {
  const [data, setData] = useState<EquipmentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: allocations, error } = await supabase
        .from('equipment_allocations')
        .select(`
          *,
          equipment:equipment_id!inner (name, patrimonio, type),
          student:student_id!inner (name, student_id),
          allocator:allocated_by!inner (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData((allocations as any) || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching allocations:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar alocações de equipamentos."
      });
    } finally {
      setLoading(false);
    }
  };

  const createAllocation = async (allocationData: {
    equipment_id: string;
    student_id: string;
    shift: 'manha' | 'tarde' | 'noite';
    start_date?: string;
    end_date?: string;
    observations?: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const today = new Date().toISOString().split('T')[0];
      const defaultEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { error } = await supabase
        .from('equipment_allocations')
        .insert([{
          ...allocationData,
          allocated_by: user.user.id,
          start_date: allocationData.start_date || today,
          end_date: allocationData.end_date || defaultEndDate
        }]);

      if (error) throw error;

      await fetchAllocations();
      toast({
        title: "Sucesso!",
        description: "Equipamento alocado com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao alocar equipamento."
      });
      throw err;
    }
  };

  const returnEquipment = async (id: string, observations?: string) => {
    try {
      const { error } = await supabase
        .from('equipment_allocations')
        .update({
          status: 'finalizado',
          returned_at: new Date().toISOString(),
          ...(observations && { observations })
        })
        .eq('id', id);

      if (error) throw error;

      await fetchAllocations();
      toast({
        title: "Sucesso!",
        description: "Equipamento devolvido com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao devolver equipamento."
      });
      throw err;
    }
  };

  const cancelAllocation = async (id: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('equipment_allocations')
        .update({
          status: 'cancelado',
          ...(reason && { observations: reason })
        })
        .eq('id', id);

      if (error) throw error;

      await fetchAllocations();
      toast({
        title: "Sucesso!",
        description: "Alocação cancelada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao cancelar alocação."
      });
      throw err;
    }
  };

  const getAvailableEquipment = async (shift: string, date: string) => {
    try {
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select(`
          *,
          allocations:equipment_allocations!inner(id, status)
        `)
        .eq('status', 'disponivel')
        .not('allocations.status', 'eq', 'ativo')
        .not('allocations.shift', 'eq', shift)
        .not('allocations.date', 'eq', date);

      if (error) throw error;
      return equipment || [];
    } catch (err: any) {
      console.error('Error fetching available equipment:', err);
      return [];
    }
  };

  const getAllocationsByShift = async (shift: 'manha' | 'tarde' | 'noite', date: string) => {
    try {
      const { data: allocations, error } = await supabase
        .from('equipment_allocations')
        .select(`
          *,
          equipment:equipment_id!inner (name, patrimonio, type),
          student:student_id!inner (name, student_id)
        `)
        .eq('shift', shift)
        .eq('start_date', date)
        .eq('status', 'ativo');

      if (error) throw error;
      return (allocations as any) || [];
    } catch (err: any) {
      console.error('Error fetching allocations by shift:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchAllocations,
    createAllocation,
    returnEquipment,
    cancelAllocation,
    getAvailableEquipment,
    getAllocationsByShift
  };
};