import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, User, Calendar, AlertCircle } from 'lucide-react';

const studentDeclarationSchema = z.object({
  type: z.string().min(1, 'Tipo de justificativa é obrigatório'),
  absence_date: z.string().min(1, 'Data da falta é obrigatória'),
  observations: z.string().optional(),
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
  const { uploadFile, uploading } = useSupabaseStorage();

  const form = useForm<StudentDeclarationValues>({
    resolver: zodResolver(studentDeclarationSchema),
    defaultValues: {
      type: '',
      absence_date: '',
      observations: '',
    },
  });

  const justificationTypes = [
    {
      value: 'atestado_medico',
      label: 'Atestado Médico',
      description: 'Justificativa de falta por motivo de saúde com atestado médico',
      icon: '🏥'
    },
    {
      value: 'atestado_trabalho',
      label: 'Atestado de Trabalho',
      description: 'Justificativa de falta por motivo profissional com declaração da empresa',
      icon: '💼'
    },
    {
      value: 'outros',
      label: 'Outros',
      description: 'Outros motivos de falta com documentação comprobatória',
      icon: '📄'
    }
  ];

  const selectedType = form.watch('type');
  const selectedJustification = justificationTypes.find(j => j.value === selectedType);

  const handleSubmit = async (data: StudentDeclarationValues) => {
    let filePath = '';
    
    // Upload file if selected
    if (selectedFile) {
      const uploadedPath = await uploadFile(selectedFile, 'declarations', 'justificativas');
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
      urgency: 'normal',
      title: `Justificativa de Falta - ${selectedJustification?.label || data.type}`,
      purpose: `Justificar falta do dia ${data.absence_date}`,
      file: selectedFile || undefined,
      filePath
    };
    
    onSubmit(formData);
    onOpenChange(false);
    form.reset();
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Enviar Justificativa de Falta
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

            {/* Tipo de Justificativa */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">Tipo de Justificativa *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione o tipo de justificativa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {justificationTypes.map((type) => (
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
                      
                      {selectedJustification && (
                        <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{selectedJustification.icon}</span>
                            <Badge variant="secondary" className="text-primary">
                              {selectedJustification.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedJustification.description}
                          </p>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Data da Falta */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="absence_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        Data da Falta *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-2">
                        Informe a data em que você faltou e precisa justificar
                      </p>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Upload de Documento */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                  <Upload className="h-5 w-5" />
                  Anexar Documento Comprobatório *
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-background border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Instruções Importantes
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• O documento deve estar legível e completo</li>
                      <li>• Atestados médicos devem conter CRM e período de afastamento</li>
                      <li>• Declarações de trabalho devem estar em papel timbrado</li>
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
                      📎 Clique na área acima para anexar seu documento
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

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
                          placeholder="Informações adicionais sobre a justificativa (opcional)..."
                          className="min-h-[100px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-2">
                        Opcional: Você pode adicionar informações adicionais relevantes
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
                disabled={uploading || !selectedFile}
              >
                {uploading 
                  ? 'Enviando...' 
                  : 'Enviar Justificativa'
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

            {/* Informação sobre aprovação */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ⏰ <strong>Prazo de análise:</strong> Até 2 dias úteis após o envio
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ✅ Após a aprovação pela secretaria, a falta será abonada automaticamente
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                📧 Você será notificado sobre o status da sua justificativa
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
