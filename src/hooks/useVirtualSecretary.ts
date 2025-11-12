import { useState, useCallback } from 'react';
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useVirtualSecretary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<VirtualSecretaryResult | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const { toast } = useToast();

  // Health check para verificar se o serviço está disponível
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('ping');
      if (error) {
        console.warn('Health check failed, proceeding optimistically:', error);
        // Proceed optimistically to avoid blocking the UI when ping endpoint is unreachable
        return true;
      }
      return data?.status === 'ok';
    } catch (err) {
      console.warn('Health check error, proceeding optimistically:', err);
      // Network/CORS issues should not block the analysis flow
      return true;
    }
  }, []);

  const generateAnalysis = async (
    options: VirtualSecretaryOptions,
    forceRefresh: boolean = false
  ): Promise<VirtualSecretaryResult | null> => {
    const cacheKey = JSON.stringify(options);
    
    try {
      setLoading(true);
      setError(null);

      // Verificar cache (exceto se forçar refresh)
      if (!forceRefresh) {
        const cached = analysisCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          const age = Math.floor((Date.now() - cached.timestamp) / 60000);
          setCacheAge(age);
          setLastAnalysis(cached.data);
          console.log('Returning cached analysis');
          toast({
            title: 'Análise Recuperada',
            description: `Usando análise do cache (${age} min atrás).`,
          });
          return cached.data;
        }
      }

      // Health check antes de tentar análise
      const isHealthy = await checkHealth();
      if (!isHealthy) {
        console.warn('Health check reported unavailable; attempting analysis anyway.');
      }

      console.log('Generating new analysis with options:', options);

      // Retry com backoff exponencial
      let lastError: any = null;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s
            console.log(`Retry attempt ${attempt} after ${backoffMs}ms`);
            await sleep(backoffMs);
          }

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

          // Log detalhado em caso de erro
          if (invokeError) {
            console.error('Error invoking function:', {
              message: invokeError.message,
              context: invokeError.context,
              details: invokeError,
            });
            lastError = invokeError;
            
            // Não fazer retry para erros específicos
            if (invokeError.message?.includes('429') || 
                invokeError.message?.includes('402') ||
                invokeError.message?.includes('401') ||
                invokeError.message?.includes('403')) {
              throw invokeError;
            }
            
            // Retry para 503 e outros erros transitórios
            if (attempt < maxRetries) {
              continue;
            }
            throw invokeError;
          }

          if (!data || data.error) {
            const errorMsg = data?.error || 'Erro ao gerar análise';
            console.error('Function returned error:', errorMsg);
            throw new Error(errorMsg);
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
          
          setLastAnalysis(result);
          setCacheAge(0);

          toast({
            title: 'Análise Gerada',
            description: 'A SecretárIA concluiu a análise dos dados.',
          });

          return result;
        } catch (err) {
          lastError = err;
          if (attempt === maxRetries) {
            throw err;
          }
        }
      }
      
      throw lastError;
    } catch (err: any) {
      console.error('Error in generateAnalysis:', err);
      
      let errorMessage = 'Erro ao gerar análise. Tente novamente.';
      let errorTitle = 'Erro';
      
      // Mensagens específicas baseadas no status/código do erro
      if (err.message?.includes('429')) {
        errorTitle = 'Limite de Taxa Excedido';
        errorMessage = 'Muitas análises em pouco tempo. Aguarde alguns minutos e tente novamente.';
      } else if (err.message?.includes('402')) {
        errorTitle = 'Créditos Esgotados';
        errorMessage = 'Créditos de IA esgotados. Adicione créditos em Settings → Workspace → Usage.';
      } else if (err.message?.includes('401') || err.message?.includes('403')) {
        errorTitle = 'Erro de Autenticação';
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (err.message?.includes('503')) {
        errorTitle = 'Serviço Indisponível';
        errorMessage = 'Serviço temporariamente indisponível. Aguarde 30 segundos e tente novamente.';
      } else if (err.message?.includes('Serviço temporariamente indisponível')) {
        errorTitle = 'Serviço Indisponível';
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: errorTitle,
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
    setLastAnalysis(null);
    setCacheAge(null);
  };

  const getCachedAnalysis = (options: VirtualSecretaryOptions) => {
    const cacheKey = JSON.stringify(options);
    const cached = analysisCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const age = Math.floor((Date.now() - cached.timestamp) / 60000);
      return { data: cached.data, age };
    }
    
    return null;
  };

  return {
    generateAnalysis,
    clearCache,
    getCachedAnalysis,
    checkHealth,
    loading,
    error,
    lastAnalysis,
    cacheAge,
  };
};