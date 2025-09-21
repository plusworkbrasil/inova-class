import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  email: string;
  student_id?: string;
  enrollment_number?: string;
  status?: string;
  phone?: string;
  birth_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
}

interface ClassStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  className: string;
}

export function ClassStudentsDialog({ open, onOpenChange, classId, className }: ClassStudentsDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  useEffect(() => {
    if (open && classId) {
      fetchStudents();
    }
  }, [open, classId]);

  const fetchStudents = async () => {
    if (!classId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('class_id', classId)
        .eq('role', 'student');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <Dialog open={open && !showStudentDetails} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alunos da Turma {className}
            </DialogTitle>
            <DialogDescription>
              Clique em um aluno para ver mais detalhes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno encontrado nesta turma</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {students.map((student) => (
                  <div 
                    key={student.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleStudentClick(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {student.name}
                        </h4>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {student.student_id && <span>ID: {student.student_id}</span>}
                          {student.enrollment_number && <span>Matrícula: {student.enrollment_number}</span>}
                        </div>
                      </div>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status === 'active' ? 'Ativo' : student.status || 'Ativo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStudentDetails} onOpenChange={(open) => {
        setShowStudentDetails(open);
        if (!open) {
          setSelectedStudent(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Aluno
            </DialogTitle>
            <DialogDescription>
              Informações completas do aluno selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {/* Informações Básicas */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Informações Pessoais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <p className="text-sm">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedStudent.birth_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedStudent.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedStudent.phone || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações Acadêmicas */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Informações Acadêmicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID do Aluno</label>
                    <p className="text-sm">{selectedStudent.student_id || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número de Matrícula</label>
                    <p className="text-sm">{selectedStudent.enrollment_number || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                      {selectedStudent.status === 'active' ? 'Ativo' : selectedStudent.status || 'Ativo'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Turma</label>
                    <p className="text-sm">{className}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Responsável */}
              {(selectedStudent.guardian_name || selectedStudent.guardian_phone) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Responsável</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStudent.guardian_name && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome do Responsável</label>
                        <p className="text-sm">{selectedStudent.guardian_name}</p>
                      </div>
                    )}
                    {selectedStudent.guardian_phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Telefone do Responsável</label>
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedStudent.guardian_phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowStudentDetails(false)}>
                  Voltar para Lista
                </Button>
                <Button onClick={() => {
                  setShowStudentDetails(false);
                  onOpenChange(false);
                }}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}