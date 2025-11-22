import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EquipmentAllocationsSearch } from './equipment-allocations-search';

export const EquipmentAllocationsHistory = () => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('equipment_allocations')
        .select(`
          *,
          equipment:equipment_id (name, patrimonio, type),
          student:student_id (name, student_id),
          allocator:allocated_by (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllocations(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = 
      allocation.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.equipment?.patrimonio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || allocation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'finalizado':
        return 'outline';
      case 'cancelado':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <EquipmentAllocationsSearch 
        onSearch={setSearchTerm}
        onStatusFilter={setStatusFilter}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Alocado por</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Devolução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma alocação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredAllocations.map(allocation => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{allocation.equipment?.name || 'Equipamento'}</p>
                        <p className="text-xs text-muted-foreground">
                          {allocation.equipment?.patrimonio || 'Sem patrimônio'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{allocation.student?.name || 'Aluno'}</p>
                        <p className="text-xs text-muted-foreground">
                          {allocation.student?.student_id || 'Sem ID'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{allocation.allocator?.name || 'Desconhecido'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {allocation.shift}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(allocation.start_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{new Date(allocation.end_date).toLocaleDateString('pt-BR')}</p>
                        {allocation.returned_at && (
                          <p className="text-xs text-muted-foreground">
                            Devolvido: {new Date(allocation.returned_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(allocation.status)}>
                        {allocation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {allocation.observations ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{allocation.observations}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
