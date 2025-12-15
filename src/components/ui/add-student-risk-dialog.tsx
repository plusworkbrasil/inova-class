import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { StudentRiskData, useStudentsAtRisk } from '@/hooks/useStudentsAtRisk';
import { getRiskLevelLabel, getRiskLevelColor, getRiskLevelBadgeVariant } from '@/lib/riskCalculation';
import { Search, Loader2, AlertTriangle, User, TrendingDown, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface AddStudentRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingStudentIds: string[];
}

interface StudentOption {
  id: string;
  name: string;
  class_id: string | null;
  class_name?: string;
}

export const AddStudentRiskDialog = ({
  open,
  onOpenChange,
  onSuccess,
  existingStudentIds
}: AddStudentRiskDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [riskData, setRiskData] = useState<StudentRiskData | null>(null);
  const [adding, setAdding] = useState(false);

  const { analyzeStudentRisk, createRiskRecord } = useStudentsAtRisk();

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setStudents([]);
      setSelectedStudent(null);
      setRiskData(null);
    }
  }, [open]);

  useEffect(() => {
    const searchStudents = async () => {
      if (searchTerm.length < 2) {
        setStudents([]);
        return;
      }

      setLoading(true);
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, class_id')
          .ilike('name', `%${searchTerm}%`)
          .limit(10);

        if (profiles) {
          // Filter out students already in risk tracking
          const filtered = profiles.filter(p => !existingStudentIds.includes(p.id));
          
          // Get class names
          const withClasses = await Promise.all(
            filtered.map(async (p) => {
              let class_name = undefined;
              if (p.class_id) {
                const { data: classData } = await supabase
                  .from('classes')
                  .select('name')
                  .eq('id', p.class_id)
                  .maybeSingle();
                class_name = classData?.name;
              }
              return { ...p, class_name };
            })
          );
          
          setStudents(withClasses);
        }
      } catch (error) {
        console.error('Error searching students:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, existingStudentIds]);

  const handleSelectStudent = async (student: StudentOption) => {
    setSelectedStudent(student);
    setAnalyzing(true);
    setRiskData(null);

    const data = await analyzeStudentRisk(student.id);
    setRiskData(data);
    setAnalyzing(false);
  };

  const handleAddToTracking = async () => {
    if (!selectedStudent || !riskData) return;

    setAdding(true);
    const success = await createRiskRecord(selectedStudent.id, riskData);
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Aluno ao Acompanhamento</DialogTitle>
          <DialogDescription>
            Busque um aluno para analisar seu risco de evasão e adicionar ao acompanhamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && students.length > 0 && !selectedStudent && (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {students.map((student) => (
                  <Card
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelectStudent(student)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.class_name || 'Sem turma'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {!loading && searchTerm.length >= 2 && students.length === 0 && !selectedStudent && (
            <p className="text-center text-muted-foreground py-4">
              Nenhum aluno encontrado ou todos já estão em acompanhamento.
            </p>
          )}

          {/* Selected Student Analysis */}
          {selectedStudent && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{selectedStudent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedStudent.class_name || 'Sem turma'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => { setSelectedStudent(null); setRiskData(null); }}
                  >
                    Trocar
                  </Button>
                </div>

                {analyzing && (
                  <div className="flex flex-col items-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Analisando indicadores de risco...</p>
                  </div>
                )}

                {riskData && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Análise de Risco</span>
                      <Badge variant={getRiskLevelBadgeVariant(riskData.riskLevel)}>
                        {getRiskLevelLabel(riskData.riskLevel)} ({riskData.riskScore}/100)
                      </Badge>
                    </div>

                    <Progress value={riskData.riskScore} className="h-2" />

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingDown className={`h-4 w-4 ${riskData.indicators.attendancePercentage < 75 ? 'text-red-500' : 'text-green-500'}`} />
                        <span>Frequência: {riskData.indicators.attendancePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className={`h-4 w-4 ${riskData.indicators.gradeAverage < 5 ? 'text-red-500' : 'text-green-500'}`} />
                        <span>Média: {riskData.indicators.gradeAverage.toFixed(1)}</span>
                      </div>
                    </div>

                    {riskData.factors.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Fatores de Risco:</Label>
                        <div className="flex flex-wrap gap-1">
                          {riskData.factors.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddToTracking}
              disabled={!riskData || adding}
            >
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar ao Acompanhamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
