import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { Label } from './label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { useEquipmentAllocations, EquipmentAllocation } from '@/hooks/useEquipmentAllocations';
import { Clock, User, Monitor, Package } from 'lucide-react';

export const EquipmentAllocationsView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [morningAllocations, setMorningAllocations] = useState<EquipmentAllocation[]>([]);
  const [afternoonAllocations, setAfternoonAllocations] = useState<EquipmentAllocation[]>([]);
  const [nightAllocations, setNightAllocations] = useState<EquipmentAllocation[]>([]);
  const [loading, setLoading] = useState(false);

  const { getAllocationsByShift, returnEquipment, cancelAllocation } = useEquipmentAllocations();

  useEffect(() => {
    fetchAllocationsByDate();
  }, [selectedDate]);

  const fetchAllocationsByDate = async () => {
    setLoading(true);
    try {
      const [morning, afternoon, night] = await Promise.all([
        getAllocationsByShift('manha', selectedDate),
        getAllocationsByShift('tarde', selectedDate),
        getAllocationsByShift('noite', selectedDate)
      ]);

      setMorningAllocations(morning as any);
      setAfternoonAllocations(afternoon as any);
      setNightAllocations(night as any);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id: string) => {
    try {
      await returnEquipment(id);
      await fetchAllocationsByDate();
    } catch (error) {
      console.error('Error returning equipment:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelAllocation(id);
      await fetchAllocationsByDate();
    } catch (error) {
      console.error('Error canceling allocation:', error);
    }
  };

  const AllocationCard: React.FC<{ allocation: EquipmentAllocation }> = ({ allocation }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(allocation.end_date);
    endDate.setHours(0, 0, 0, 0);
    const isOverdue = allocation.status === 'ativo' && endDate < today;
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card className={`mb-3 ${isOverdue ? 'border-destructive' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4 text-primary" />
                <span className="font-medium">{allocation.equipment?.name}</span>
                {allocation.equipment?.patrimonio && (
                  <Badge variant="outline" className="text-xs">
                    {allocation.equipment.patrimonio}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Atrasado
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-3 w-3" />
                <span>{allocation.student?.name}</span>
                {allocation.student?.student_id && (
                  <span className="text-xs">({allocation.student.student_id})</span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span>Início: {new Date(allocation.start_date).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Devolução: {endDate.toLocaleDateString('pt-BR')}
                  {allocation.status === 'ativo' && (
                    <span className={isOverdue ? 'text-destructive ml-2 font-medium' : 'text-muted-foreground ml-2'}>
                      ({isOverdue ? `${Math.abs(daysRemaining)} dias atrasado` : `${daysRemaining} dias restantes`})
                    </span>
                  )}
                </span>
              </div>
              
              {allocation.returned_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Devolvido em: {new Date(allocation.returned_at).toLocaleString('pt-BR')}</span>
                </div>
              )}
              
              {allocation.observations && (
                <p className="text-xs text-muted-foreground mt-2">{allocation.observations}</p>
              )}
            </div>
            
            {allocation.status === 'ativo' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReturn(allocation.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  Devolver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel(allocation.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ShiftContent: React.FC<{ allocations: EquipmentAllocation[]; shiftName: string }> = ({ 
    allocations, 
    shiftName 
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5" />
        <span className="font-medium">{allocations.length} equipamentos alocados</span>
      </div>
      
      {allocations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum equipamento alocado para o turno {shiftName.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      ) : (
        allocations.map((allocation) => (
          <AllocationCard key={allocation.id} allocation={allocation} />
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <Tabs defaultValue="manha" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manha">
            Manhã ({morningAllocations.length})
          </TabsTrigger>
          <TabsTrigger value="tarde">
            Tarde ({afternoonAllocations.length})
          </TabsTrigger>
          <TabsTrigger value="noite">
            Noite ({nightAllocations.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manha">
          <ShiftContent allocations={morningAllocations} shiftName="Manhã" />
        </TabsContent>
        
        <TabsContent value="tarde">
          <ShiftContent allocations={afternoonAllocations} shiftName="Tarde" />
        </TabsContent>
        
        <TabsContent value="noite">
          <ShiftContent allocations={nightAllocations} shiftName="Noite" />
        </TabsContent>
      </Tabs>
    </div>
  );
};