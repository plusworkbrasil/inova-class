import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ClipboardCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInstructorSubjects } from '@/hooks/useInstructorSubjects';
import { AttendanceForm } from '@/components/forms/AttendanceForm';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAttendance } from '@/hooks/useSupabaseAttendance';

const InstructorSubjects = () => {
  const { profile } = useAuth();
  const { subjects, loading } = useInstructorSubjects();
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const { toast } = useToast();
  const { createAttendance, refetch } = useSupabaseAttendance();

  const handleAttendanceClick = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setIsAttendanceFormOpen(true);
  };

  const handleAttendanceSubmit = async (data: any) => {
    try {
      for (const student of data.attendance) {
        await createAttendance({
          student_id: student.studentId,
          class_id: data.classId,
          subject_id: data.subjectId,
          date: data.date,
          is_present: student.isPresent,
          justification: student.isPresent ? null : 'Falta não justificada'
        });
      }
      
      toast({
        title: "Chamada registrada com sucesso!",
        description: `Frequência registrada para ${data.attendance.length} alunos.`,
      });
      
      refetch();
      setIsAttendanceFormOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar chamada",
        description: "Ocorreu um erro ao salvar a frequência.",
      });
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <Layout userRole={profile.role as any} userName={profile.name} userAvatar={profile.avatar}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Disciplinas</h1>
          <p className="text-muted-foreground mt-2">
            Visualize suas disciplinas e gerencie a frequência dos alunos
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma disciplina encontrada</h3>
              <p className="text-muted-foreground">
                Você ainda não está alocado em nenhuma disciplina.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {subject.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <GraduationCap className="h-4 w-4" />
                        {subject.class_name || 'Sem turma'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{subject.student_count} alunos</span>
                    </div>
                    <Badge variant="outline">Ativa</Badge>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => handleAttendanceClick(subject.id)}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Fazer Chamada
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AttendanceForm
          open={isAttendanceFormOpen}
          onOpenChange={setIsAttendanceFormOpen}
          onSubmit={handleAttendanceSubmit}
        />
      </div>
    </Layout>
  );
};

export default InstructorSubjects;
