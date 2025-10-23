import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { Textarea } from './textarea';
import { Input } from './input';
import { useEquipmentAllocations } from '@/hooks/useEquipmentAllocations';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  name: string;
  student_id?: string;
}

interface Equipment {
  id: string;
  name: string;
  patrimonio?: string;
  type: string;
}

interface EquipmentAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEquipment?: Equipment;
}

export const EquipmentAllocationDialog: React.FC<EquipmentAllocationDialogProps> = ({
  open,
  onOpenChange,
  selectedEquipment
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { createAllocation } = useEquipmentAllocations();

  useEffect(() => {
    if (open) {
      fetchStudents();
      // Reset form
      setSelectedStudent('');
      setSelectedShift('');
      setObservations('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, student_id')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      
      // Filtrar apenas estudantes usando a função get_user_role
      const studentsWithRoles = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: role } = await supabase.rpc('get_user_role', { user_id: profile.id });
          return role === 'student' ? profile : null;
        })
      );
      
      setStudents(studentsWithRoles.filter(s => s !== null) as Student[]);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEquipment || !selectedStudent || !selectedShift) {
      return;
    }

    setLoading(true);
    try {
      await createAllocation({
        equipment_id: selectedEquipment.id,
        student_id: selectedStudent,
        shift: selectedShift as 'manha' | 'tarde' | 'noite',
        start_date: startDate,
        end_date: endDate,
        observations
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating allocation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alocar Equipamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedEquipment && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedEquipment.name}</p>
              {selectedEquipment.patrimonio && (
                <p className="text-sm text-muted-foreground">Patrimônio: {selectedEquipment.patrimonio}</p>
              )}
              <p className="text-sm text-muted-foreground">Tipo: {selectedEquipment.type}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="student">Aluno</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} {student.student_id && `(${student.student_id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Turno</Label>
            <Select value={selectedShift} onValueChange={setSelectedShift} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manha">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data de Devolução Prevista</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações (opcional)</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações sobre a alocação..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Alocando...' : 'Alocar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};