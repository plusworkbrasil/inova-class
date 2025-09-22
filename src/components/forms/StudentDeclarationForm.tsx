import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, User } from 'lucide-react';

const studentDeclarationSchema = z.object({
  type: z.string().min(1, 'Tipo de declaração é obrigatório'),
  observations: z.string().optional(),
  attachMedicalCertificate: z.boolean().default(false),
});

type StudentDeclarationValues = z.infer<typeof studentDeclarationSchema>;

interface StudentDeclarationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudentDeclarationValues & { file?: File; filePath?: string }) => void;
  currentUser?: {
    id: string;
    name: string;
    studentId: string;
  };
}

export const StudentDeclarationForm: React.FC<StudentDeclarationFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  currentUser
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMedicalUpload, setShowMedicalUpload] = useState(false);
  const { uploadFile, uploading } = useSupabaseStorage();

  const form = useForm<StudentDeclarationValues>({
    resolver: zodResolver(studentDeclarationSchema),
    defaultValues: {
      type: '',
      observations: '',
      attachMedicalCertificate: false,
    },
  });

  const declarationTypes = [
    {
      value: 'Declaração de Matrícula',
      label: 'Declaração de Matrícula',
      description: 'Comprova que você está matriculado na instituição',
      icon: '📄'
    },
    {
      value: 'Declaração de Frequência',
      label: 'Declaração de Frequência',
      description: 'Atesta sua frequência nas aulas',
      icon: '📊'
    },
    {
      value: 'Histórico Escolar',
      label: 'Histórico Escolar',
      description: 'Documento com seu histórico completo de notas',
      icon: '📋'
    },
    {
      value: 'Declaração de Conclusão',
      label: 'Declaração de Conclusão',
      description: 'Comprova a conclusão do seu curso',
      icon: '🎓'
    },
    {
      value: 'Declaração de Escolaridade',
      label: 'Declaração de Escolaridade',
      description: 'Atesta seu nível de escolaridade atual',
      icon: '📚'
    },
    {
      value: 'Boletim Escolar',
      label: 'Boletim Escolar',
      description: 'Relatório das suas notas do período letivo',
      icon: '📈'
    },
    {
      value: 'Justificativa de Falta',
      label: 'Justificativa de Falta',
      description: 'Solicitação para justificar faltas com atestado médico',
      icon: '🏥'
    }
  ];

  const selectedType = form.watch('type');
  const selectedDeclaration = declarationTypes.find(d => d.value === selectedType);
  const isMedicalJustification = selectedType === 'Justificativa de Falta';

  const handleSubmit = async (data: StudentDeclarationValues) => {
    let filePath = '';
    
    // Upload file if selected (medical certificate)
    if (selectedFile) {
      const uploadedPath = await uploadFile(selectedFile, 'declarations', 'medical-certificates');
      if (uploadedPath) {
        filePath = uploadedPath;
      } else {
        return; // Upload failed, don't proceed
      }
    }
    
    // Auto-fill student data
    const formData = {
      ...data,
      studentName: currentUser?.name || '',
      studentId: currentUser?.studentId || '',
      requestedBy: 'Aluno',
      urgency: isMedicalJustification ? 'normal' : 'baixa',
      title: isMedicalJustification ? 'Justificativa de Falta com Atestado Médico' : data.type,
      purpose: isMedicalJustification ? 'Justificar faltas por motivo médico' : '',
      file: selectedFile || undefined,
      filePath
    };
    
    onSubmit(formData);
    onOpenChange(false);
    form.reset();
    setSelectedFile(null);
    setShowMedicalUpload(false);
  };

  const handleTypeChange = (value: string) => {
    form.setValue('type', value);
    const isMedical = value === 'Justificativa de Falta';
    setShowMedicalUpload(isMedical);
    form.setValue('attachMedicalCertificate', isMedical);
    
    if (!isMedical) {
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Nova Solicitação de Declaração
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Seus Dados */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  Seus Dados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <div className="p-3 bg-muted rounded-md text-sm font-medium">
                      {currentUser?.name || 'Nome não informado'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Matrícula</label>
                    <div className="p-3 bg-muted rounded-md text-sm font-medium">
                      {currentUser?.studentId || 'Matrícula não informada'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipo de Declaração */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">Tipo de Declaração</FormLabel>
                      <Select onValueChange={handleTypeChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione o tipo de declaração que você precisa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80">
                          {declarationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="py-3">
                              <div className="flex items-start gap-3">
                                <span className="text-lg">{type.icon}</span>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {type.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      
                      {selectedDeclaration && (
                        <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{selectedDeclaration.icon}</span>
                            <Badge variant="secondary" className="text-primary">
                              {selectedDeclaration.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedDeclaration.description}
                          </p>
                          {isMedicalJustification && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-800 font-medium">
                                📋 Para justificativa de faltas, você precisará anexar o atestado médico.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Upload de Atestado Médico */}
            {showMedicalUpload && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-blue-800">
                    <Upload className="h-5 w-5" />
                    Anexar Atestado Médico
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📋 Instruções Importantes:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• O atestado deve estar legível e completo</li>
                        <li>• Deve conter data, CRM do médico e período de afastamento</li>
                        <li>• Formatos aceitos: PDF, JPG, PNG</li>
                        <li>• Tamanho máximo: 10MB</li>
                      </ul>
                    </div>
                    
                    <FileUpload
                      onFileSelect={setSelectedFile}
                      currentFile={selectedFile}
                      onRemoveFile={() => setSelectedFile(null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={10}
                      disabled={uploading}
                    />
                    
                    {!selectedFile && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        📎 Clique na área acima para anexar seu atestado médico
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={
                            isMedicalJustification 
                              ? "Descreva brevemente o motivo das faltas ou informações adicionais sobre o atestado..."
                              : "Informações adicionais que podem ajudar no processamento da sua solicitação..."
                          }
                          className="min-h-[120px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-2">
                        {isMedicalJustification 
                          ? "Opcional: Você pode adicionar informações sobre o período das faltas ou outros detalhes relevantes."
                          : "Opcional: Inclua qualquer informação adicional que possa ser útil para o processamento da declaração."
                        }
                      </p>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={uploading || (isMedicalJustification && !selectedFile)}
              >
                {uploading 
                  ? 'Enviando...' 
                  : isMedicalJustification
                    ? 'Enviar Justificativa'
                    : 'Solicitar Declaração'
                }
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={uploading}
              >
                Cancelar
              </Button>
            </div>

            {/* Informação sobre prazo */}
            {selectedType && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ⏰ <strong>Prazo de processamento:</strong> {' '}
                  {isMedicalJustification 
                    ? "Até 2 dias úteis após análise do documento"
                    : "Entre 3 a 5 dias úteis, dependendo do tipo de declaração"
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  📧 Você receberá uma notificação quando sua solicitação for processada.
                </p>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};