import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const StudentEquipmentCard = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAllocations = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('equipment_allocations')
          .select(`
            *,
            equipment:equipment_id (name, patrimonio, type)
          `)
          .eq('student_id', user.id)
          .eq('status', 'ativo')
          .order('end_date', { ascending: true });

        if (error) throw error;
        setAllocations(data || []);
      } catch (error) {
        console.error('Error fetching allocations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAllocations();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Meus Equipamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Meus Equipamentos
        </CardTitle>
        <CardDescription>
          Equipamentos alocados para você
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allocations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum equipamento alocado
          </p>
        ) : (
          <div className="space-y-3">
            {allocations.map(allocation => {
              const daysRemaining = Math.ceil(
                (new Date(allocation.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const isOverdue = daysRemaining < 0;

              return (
                <div key={allocation.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{allocation.equipment?.name || 'Equipamento'}</p>
                      <p className="text-sm text-muted-foreground">
                        {allocation.equipment?.patrimonio || 'Sem patrimônio'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Turno: <span className="font-medium capitalize">{allocation.shift}</span>
                      </p>
                    </div>
                    <Badge variant={isOverdue ? "destructive" : daysRemaining <= 3 ? "outline" : "default"}>
                      {isOverdue 
                        ? `${Math.abs(daysRemaining)} dias atrasado`
                        : daysRemaining === 0
                        ? 'Vence hoje'
                        : `${daysRemaining} dias restantes`
                      }
                    </Badge>
                  </div>
                  {isOverdue && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Devolução atrasada! Entre em contato com a secretaria.</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Devolução prevista: {new Date(allocation.end_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
