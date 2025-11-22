import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { useEquipmentIncidents } from '@/hooks/useEquipmentIncidents';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EquipmentIncidentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
}

export const EquipmentIncidentsDialog = ({
  open,
  onOpenChange,
  equipmentId,
  equipmentName
}: EquipmentIncidentsDialogProps) => {
  const { data: incidents, loading, createIncident } = useEquipmentIncidents(equipmentId);
  const [isCreating, setIsCreating] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'media' as const
  });
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newIncident.title || !newIncident.description) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios."
      });
      return;
    }

    try {
      await createIncident({
        equipment_id: equipmentId,
        ...newIncident
      });

      setNewIncident({ title: '', description: '', severity: 'media' });
      setIsCreating(false);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'critica':
        return 'destructive';
      case 'alta':
        return 'outline';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'resolvido':
        return 'outline';
      case 'em_analise':
        return 'default';
      case 'fechado':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Ocorrências - {equipmentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para nova ocorrência */}
          {isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle>Nova Ocorrência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                    placeholder="Ex: Equipamento com defeito no teclado"
                  />
                </div>
                <div>
                  <Label>Gravidade *</Label>
                  <Select 
                    value={newIncident.severity}
                    onValueChange={(value: any) => setNewIncident({...newIncident, severity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descrição *</Label>
                  <Textarea
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                    placeholder="Descreva detalhadamente o problema encontrado..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit}>
                    Registrar Ocorrência
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ocorrência
            </Button>
          )}

          {/* Lista de ocorrências */}
          <div className="space-y-3">
            <h3 className="font-semibold">Histórico de Ocorrências</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma ocorrência registrada
              </p>
            ) : (
              incidents.map(incident => (
                <Card key={incident.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{incident.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant={getSeverityVariant(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant={getStatusVariant(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {incident.description}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Reportado por: {incident.reporter?.name || 'Desconhecido'}</span>
                      <span>{new Date(incident.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    {incident.resolution && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <p className="text-sm font-medium mb-1">Resolução:</p>
                        <p className="text-sm">{incident.resolution}</p>
                        {incident.resolved_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Resolvido por {incident.resolver?.name || 'Desconhecido'} em{' '}
                            {new Date(incident.resolved_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
