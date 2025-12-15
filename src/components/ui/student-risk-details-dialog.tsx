import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { StudentAtRisk } from '@/hooks/useStudentsAtRisk';
import { useRiskInterventions } from '@/hooks/useRiskInterventions';
import { InterventionForm } from '@/components/forms/InterventionForm';
import { InterventionTimeline } from '@/components/ui/intervention-timeline';
import { 
  getRiskLevelLabel, 
  getRiskLevelColor, 
  getRiskLevelBadgeVariant,
  getStatusLabel
} from '@/lib/riskCalculation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertTriangle, 
  TrendingDown, 
  GraduationCap, 
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  User,
  BookOpen
} from 'lucide-react';

interface StudentRiskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskRecord: StudentAtRisk | null;
  onResolve: (id: string, status: 'resolved' | 'evaded', notes: string) => Promise<boolean>;
}

export const StudentRiskDetailsDialog = ({
  open,
  onOpenChange,
  riskRecord,
  onResolve
}: StudentRiskDetailsDialogProps) => {
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<'resolved' | 'evaded'>('resolved');
  const [resolveNotes, setResolveNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const { data: interventions, loading: loadingInterventions, createIntervention } = useRiskInterventions(riskRecord?.id);

  if (!riskRecord) return null;

  const handleResolve = async () => {
    if (!resolveNotes.trim()) return;
    setIsResolving(true);
    const success = await onResolve(riskRecord.id, resolveStatus, resolveNotes);
    if (success) {
      setShowResolveForm(false);
      setResolveNotes('');
      onOpenChange(false);
    }
    setIsResolving(false);
  };

  const isActive = riskRecord.status === 'active' || riskRecord.status === 'monitoring';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            {riskRecord.student?.name || 'Aluno'}
            <Badge variant={getRiskLevelBadgeVariant(riskRecord.risk_level)}>
              {getRiskLevelLabel(riskRecord.risk_level)}
            </Badge>
            <Badge variant="outline">
              {getStatusLabel(riskRecord.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${getRiskLevelColor(riskRecord.risk_level)}`} />
                <p className="text-2xl font-bold">{riskRecord.risk_score}</p>
                <p className="text-xs text-muted-foreground">Pontuação de Risco</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingDown className={`h-6 w-6 mx-auto mb-2 ${(riskRecord.attendance_percentage || 0) < 75 ? 'text-red-500' : 'text-green-500'}`} />
                <p className="text-2xl font-bold">{(riskRecord.attendance_percentage || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Frequência</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <GraduationCap className={`h-6 w-6 mx-auto mb-2 ${(riskRecord.grade_average || 0) < 5 ? 'text-red-500' : 'text-green-500'}`} />
                <p className="text-2xl font-bold">{(riskRecord.grade_average || 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Média</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{riskRecord.absences_last_30_days || 0}</p>
                <p className="text-xs text-muted-foreground">Faltas (30 dias)</p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Score Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Nível de Risco</span>
                <span className={`text-sm font-bold ${getRiskLevelColor(riskRecord.risk_level)}`}>
                  {riskRecord.risk_score}/100
                </span>
              </div>
              <Progress 
                value={riskRecord.risk_score} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Baixo</span>
                <span>Médio</span>
                <span>Alto</span>
                <span>Crítico</span>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Turma:</span>
                <span className="font-medium">{riskRecord.student_class?.name || 'Não informada'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Identificado em:</span>
                <span>{format(new Date(riskRecord.identified_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Identificado por:</span>
                <span>{riskRecord.identifier?.name || 'Sistema'}</span>
              </div>
              {riskRecord.assignee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responsável:</span>
                  <span>{riskRecord.assignee.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Intervenções:</span>
                <span className="font-medium">{riskRecord.interventions_count || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="interventions">
            <TabsList className="w-full">
              <TabsTrigger value="interventions" className="flex-1">
                <BookOpen className="h-4 w-4 mr-2" />
                Intervenções ({interventions.length})
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Nova Intervenção
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interventions" className="mt-4">
              <InterventionTimeline interventions={interventions} loading={loadingInterventions} />
            </TabsContent>

            <TabsContent value="new" className="mt-4">
              {isActive ? (
                <InterventionForm
                  riskRecordId={riskRecord.id}
                  studentId={riskRecord.student_id}
                  onSubmit={createIntervention}
                  onCancel={() => {}}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Este caso já foi encerrado.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Resolve Actions */}
          {isActive && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Encerrar Acompanhamento</CardTitle>
              </CardHeader>
              <CardContent>
                {!showResolveForm ? (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => { setResolveStatus('resolved'); setShowResolveForm(true); }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Marcar como Resolvido
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => { setResolveStatus('evaded'); setShowResolveForm(true); }}
                    >
                      <XCircle className="h-4 w-4 mr-2 text-red-500" />
                      Registrar Evasão
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>
                        {resolveStatus === 'resolved' 
                          ? 'Descreva como o caso foi resolvido:' 
                          : 'Observações sobre a evasão:'}
                      </Label>
                      <Textarea
                        value={resolveNotes}
                        onChange={(e) => setResolveNotes(e.target.value)}
                        placeholder={resolveStatus === 'resolved' 
                          ? 'Ex: Após 3 intervenções, aluno apresentou melhora significativa na frequência...'
                          : 'Ex: Aluno não respondeu às tentativas de contato e confirmou desistência...'}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => { setShowResolveForm(false); setResolveNotes(''); }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleResolve}
                        disabled={!resolveNotes.trim() || isResolving}
                        variant={resolveStatus === 'resolved' ? 'default' : 'destructive'}
                      >
                        {resolveStatus === 'resolved' ? 'Confirmar Resolução' : 'Confirmar Evasão'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resolution Notes */}
          {riskRecord.resolution_notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notas de Encerramento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{riskRecord.resolution_notes}</p>
                {riskRecord.resolved_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Encerrado em {format(new Date(riskRecord.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
