import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CreateInterventionData } from '@/hooks/useRiskInterventions';
import { getInterventionTypeLabel, getOutcomeLabel } from '@/lib/riskCalculation';
import { Loader2 } from 'lucide-react';

const interventionSchema = z.object({
  intervention_type: z.enum(['phone_call', 'meeting', 'family_contact', 'academic_support', 'psychological_support', 'financial_support', 'home_visit', 'other']),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  outcome: z.enum(['positive', 'neutral', 'negative', 'pending']).optional(),
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional()
});

type InterventionFormData = z.infer<typeof interventionSchema>;

interface InterventionFormProps {
  riskRecordId: string;
  studentId: string;
  onSubmit: (data: CreateInterventionData) => Promise<boolean>;
  onCancel: () => void;
}

const INTERVENTION_TYPES = [
  'phone_call',
  'meeting',
  'family_contact',
  'academic_support',
  'psychological_support',
  'financial_support',
  'home_visit',
  'other'
] as const;

const OUTCOMES = ['positive', 'neutral', 'negative', 'pending'] as const;

export const InterventionForm = ({ riskRecordId, studentId, onSubmit, onCancel }: InterventionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterventionFormData>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      intervention_type: 'phone_call',
      description: '',
      outcome: 'pending',
      follow_up_date: '',
      follow_up_notes: ''
    }
  });

  const handleSubmit = async (formData: InterventionFormData) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        risk_record_id: riskRecordId,
        student_id: studentId,
        intervention_type: formData.intervention_type,
        description: formData.description,
        outcome: formData.outcome,
        follow_up_date: formData.follow_up_date || undefined,
        follow_up_notes: formData.follow_up_notes || undefined
      });

      if (success) {
        form.reset();
        onCancel();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="intervention_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Intervenção</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INTERVENTION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {getInterventionTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Intervenção</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva detalhadamente a intervenção realizada, os tópicos discutidos e as observações relevantes..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="outcome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resultado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o resultado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {OUTCOMES.map(outcome => (
                    <SelectItem key={outcome} value={outcome}>
                      {getOutcomeLabel(outcome)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="follow_up_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Follow-up (opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="follow_up_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas para Follow-up (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="O que deve ser verificado no próximo contato..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Intervenção
          </Button>
        </div>
      </form>
    </Form>
  );
};
