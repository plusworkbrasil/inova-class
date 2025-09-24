import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  patrimonio?: string;
  description?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_date?: string;
  location?: string;
  status: string;
  observations?: string;
  responsible_id?: string;
  created_at: string;
  updated_at: string;
}

export const useEquipment = () => {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(equipment || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching equipment:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar equipamentos."
      });
    } finally {
      setLoading(false);
    }
  };

  const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .insert([equipmentData]);

      if (error) throw error;

      await fetchEquipment();
      toast({
        title: "Sucesso!",
        description: "Equipamento cadastrado com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao cadastrar equipamento."
      });
      throw err;
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchEquipment();
      toast({
        title: "Sucesso!",
        description: "Equipamento atualizado com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar equipamento."
      });
      throw err;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEquipment();
      toast({
        title: "Sucesso!",
        description: "Equipamento excluído com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir equipamento."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
  };
};