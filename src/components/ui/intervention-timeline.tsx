import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RiskIntervention } from '@/hooks/useRiskInterventions';
import { getInterventionTypeLabel, getOutcomeLabel, getOutcomeColor } from '@/lib/riskCalculation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Phone, 
  Users, 
  Home, 
  BookOpen, 
  Heart, 
  DollarSign, 
  MapPin, 
  MoreHorizontal,
  Calendar,
  Clock
} from 'lucide-react';

interface InterventionTimelineProps {
  interventions: RiskIntervention[];
  loading?: boolean;
}

const getInterventionIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    phone_call: <Phone className="h-4 w-4" />,
    meeting: <Users className="h-4 w-4" />,
    family_contact: <Home className="h-4 w-4" />,
    academic_support: <BookOpen className="h-4 w-4" />,
    psychological_support: <Heart className="h-4 w-4" />,
    financial_support: <DollarSign className="h-4 w-4" />,
    home_visit: <MapPin className="h-4 w-4" />,
    other: <MoreHorizontal className="h-4 w-4" />
  };
  return icons[type] || <MoreHorizontal className="h-4 w-4" />;
};

const getOutcomeBadgeVariant = (outcome: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (outcome === 'positive') return 'default';
  if (outcome === 'negative') return 'destructive';
  if (outcome === 'neutral') return 'secondary';
  return 'outline';
};

export const InterventionTimeline = ({ interventions, loading }: InterventionTimelineProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (interventions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma intervenção registrada ainda.</p>
        <p className="text-sm mt-1">Registre a primeira intervenção para este aluno.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4">
        {interventions.map((intervention, index) => (
          <div key={intervention.id} className="relative pl-10">
            {/* Timeline dot */}
            <div className="absolute left-2 top-4 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-muted">
                      {getInterventionIcon(intervention.intervention_type)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {getInterventionTypeLabel(intervention.intervention_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        por {intervention.performer?.name || 'Usuário'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getOutcomeBadgeVariant(intervention.outcome)}>
                    {getOutcomeLabel(intervention.outcome)}
                  </Badge>
                </div>

                <p className="mt-3 text-sm">{intervention.description}</p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(intervention.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  
                  {intervention.follow_up_date && (
                    <span className="flex items-center gap-1 text-primary">
                      <Clock className="h-3 w-3" />
                      Follow-up: {format(new Date(intervention.follow_up_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>

                {intervention.follow_up_notes && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notas para follow-up:</p>
                    <p>{intervention.follow_up_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
