import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Loader2, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useVirtualSecretary } from '@/hooks/useVirtualSecretary';
import { useClasses } from '@/hooks/useClasses';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';

interface VirtualSecretaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VirtualSecretaryDialog = ({ open, onOpenChange }: VirtualSecretaryDialogProps) => {
  const [analysisType, setAnalysisType] = useState<'general' | 'class'>('general');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  const { generateAnalysis, loading, error, getCachedAnalysis, checkHealth, cacheAge } = useVirtualSecretary();
  const { data: classes } = useClasses();

  const handleGenerateAnalysis = async (forceRefresh: boolean = false) => {
    const options = {
      period,
      classId: analysisType === 'class' ? selectedClassId : null,
      analysisDate: new Date(),
    };

    // Verificar se existe cache antes de gerar
    if (!forceRefresh) {
      const cached = getCachedAnalysis(options);
      if (cached) {
        setAnalysisResult(cached.data);
        return;
      }
    }

    const result = await generateAnalysis(options, forceRefresh);
    if (result) {
      setAnalysisResult(result);
    }
  };

  const handleExportPDF = () => {
    if (!analysisResult) return;

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">
          🤖 SecretárIA - Análise Educacional
        </h1>
        <p style="color: #666; margin-bottom: 20px;">
          Gerado em: ${new Date(analysisResult.generatedAt).toLocaleString('pt-BR')}
        </p>
        <div style="margin-top: 20px;">
          ${analysisResult.analysis.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;

    const opt = {
      margin: 15,
      filename: `analise-secretaria-virtual-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  };

  // Health check e auto-generate analysis quando dialog abre
  useEffect(() => {
    if (open) {
      // Health check
      checkHealth().then(setIsHealthy);
      
      // Auto-generate apenas se não houver resultado ou se não estiver carregando
      if (!analysisResult && !loading) {
        handleGenerateAnalysis(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-3xl">🤖</span>
            SecretárIA
          </DialogTitle>
          <DialogDescription>
            Análise inteligente dos dados educacionais com insights e recomendações
          </DialogDescription>
        </DialogHeader>

        <Tabs value={analysisType} onValueChange={(v) => setAnalysisType(v as 'general' | 'class')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Análise Geral</TabsTrigger>
            <TabsTrigger value="class">Por Turma</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {!isHealthy && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    ⚠️ Serviço temporariamente indisponível. Aguarde alguns segundos.
                  </div>
                )}
                
                {cacheAge !== null && cacheAge > 0 && analysisResult && (
                  <div className="p-3 bg-muted border border-border rounded-md text-sm flex items-center justify-between">
                    <span>📦 Análise gerada há {cacheAge} min (cache)</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateAnalysis(true)}
                      disabled={loading}
                    >
                      🔄 Forçar nova análise
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Período de Análise</label>
                    <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Últimas 24 horas
                          </span>
                        </SelectItem>
                        <SelectItem value="week">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Última semana
                          </span>
                        </SelectItem>
                        <SelectItem value="month">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Último mês
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => handleGenerateAnalysis(false)}
                    disabled={loading || !isHealthy}
                    className="mt-6"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Gerar Análise
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="class" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {!isHealthy && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    ⚠️ Serviço temporariamente indisponível. Aguarde alguns segundos.
                  </div>
                )}
                
                {cacheAge !== null && cacheAge > 0 && analysisResult && (
                  <div className="p-3 bg-muted border border-border rounded-md text-sm flex items-center justify-between">
                    <span>📦 Análise gerada há {cacheAge} min (cache)</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateAnalysis(true)}
                      disabled={loading}
                    >
                      🔄 Forçar nova análise
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Turma</label>
                    <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Período</label>
                    <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Últimas 24 horas</SelectItem>
                        <SelectItem value="week">Última semana</SelectItem>
                        <SelectItem value="month">Último mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => handleGenerateAnalysis(false)}
                  disabled={loading || !selectedClassId || !isHealthy}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Gerar Análise da Turma
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Área de Resultados */}
        <div className="flex-1 min-h-0">
          {loading && (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <div>
                  <p className="font-medium">Coletando dados educacionais...</p>
                  <p className="text-sm text-muted-foreground">A IA está analisando frequência, notas, evasões e pendências</p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="h-full flex items-center justify-center border-destructive">
              <CardContent className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <p className="font-medium text-destructive">Erro ao Gerar Análise</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button onClick={() => handleGenerateAnalysis(false)} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && analysisResult && (
            <Card className="h-full flex flex-col">
              <CardContent className="flex-1 pt-6 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-xs">
                      📅 {new Date(analysisResult.generatedAt).toLocaleString('pt-BR')}
                    </Badge>
                    {analysisResult.metadata.stats && (
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>👥 {analysisResult.metadata.stats.totalStudents} alunos</span>
                        <span>📊 {analysisResult.metadata.stats.attendanceRate.toFixed(1)}% presença</span>
                        <span>📈 Média {analysisResult.metadata.stats.averageGrade.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={handleExportPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
                <ScrollArea className="flex-1 pr-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysisResult.analysis}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {!loading && !error && !analysisResult && (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center space-y-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">Pronto para Análise</p>
                  <p className="text-sm text-muted-foreground">Configure os parâmetros e clique em "Gerar Análise"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};