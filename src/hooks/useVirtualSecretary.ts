import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VirtualSecretaryOptions {
  period: 'day' | 'week' | 'month';
  classId?: string | null;
  analysisDate?: Date;
}

interface AnalysisStats {
  totalStudents: number;
  attendanceRate: number;
  averageGrade: number;
  evasions: number;
  pendingInstructors: number;
}

interface VirtualSecretaryResult {
  analysis: string;
  generatedAt: string;
  metadata: {
    period: string;
    classId: string | null;
    stats: AnalysisStats;
  };
}

// Cache simples para evitar chamadas duplicadas
const analysisCache = new Map<string, { data: VirtualSecretaryResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useVirtualSecretary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAnalysis = async (
    options: VirtualSecretaryOptions
  ): Promise<VirtualSecretaryResult | null> => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache
      const cacheKey = JSON.stringify(options);
      const cached = analysisCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached analysis');
        toast({
          title: 'Análise Recuperada',
          description: 'Usando análise recente do cache.',
        });
        return cached.data;
      }

      console.log('Generating new analysis with options:', options);

      const { data, error: invokeError } = await supabase.functions.invoke(
        'analyze-educational-data',
        {
          body: {
            period: options.period,
            classId: options.classId || null,
            analysisDate: options.analysisDate?.toISOString() || new Date().toISOString(),
          },
        }
      );

      if (invokeError) {
        console.error('Error invoking function:', invokeError);
        throw invokeError;
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Erro ao gerar análise');
      }

      const result: VirtualSecretaryResult = {
        analysis: data.analysis,
        generatedAt: data.metadata.generatedAt,
        metadata: {
          period: data.metadata.period,
          classId: data.metadata.classId,
          stats: data.metadata.stats,
        },
      };

      // Armazenar no cache
      analysisCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      toast({
        title: 'Análise Gerada',
        description: 'A Secretária Virtual concluiu a análise dos dados.',
      });

      return result;
    } catch (err: any) {
      console.error('Error in generateAnalysis:', err);
      
      let errorMessage = 'Erro ao gerar análise. Tente novamente.';
      
      if (err.message?.includes('429')) {
        errorMessage = 'Muitas análises em pouco tempo. Aguarde alguns minutos.';
      } else if (err.message?.includes('402')) {
        errorMessage = 'Créditos de IA esgotados. Contacte o suporte.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    analysisCache.clear();
  };

  return {
    generateAnalysis,
    clearCache,
    loading,
    error,
  };
};