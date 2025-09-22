import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';

const declarationFormSchema = z.object({
  studentName: z.string().min(1, 'Nome do aluno é obrigatório'),
  studentId: z.string().min(1, 'Matrícula é obrigatória'),
  type: z.string().min(1, 'Tipo de declaração é obrigatório'),
  requestedBy: z.string().min(1, 'Solicitante é obrigatório'),
  purpose: z.string().optional(),
  observations: z.string().optional(),
  urgency: z.string().min(1, 'Urgência é obrigatória'),
  title: z.string().optional(),
  description: z.string().optional(),
});

type DeclarationFormValues = z.infer<typeof declarationFormSchema>;

interface DeclarationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DeclarationFormValues & { file?: File; filePath?: string }) => void;
  initialData?: Partial<DeclarationFormValues>;
  mode: 'create' | 'edit';
  declarationType?: 'request' | 'submit'; // request = solicitar, submit = enviar documento
  userRole?: string;
  currentUser?: {
    id: string;
    name: string;
    studentId: string;
  };
}

export const DeclarationForm: React.FC<DeclarationFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  declarationType = 'request',
  userRole,
  currentUser
}) => {
  const isStudent = userRole === 'student';
  const isSubmitMode = declarationType === 'submit';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadFile, uploading } = useSupabaseStorage();

  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationFormSchema),
    defaultValues: {
      studentName: isStudent ? currentUser?.name || '' : initialData?.studentName || '',
      studentId: isStudent ? currentUser?.studentId || '' : initialData?.studentId || '',
      type: isSubmitMode ? 'Envio de Atestado Médico' : initialData?.type || '',
      requestedBy: isStudent ? 'Aluno' : initialData?.requestedBy || '',
      purpose: isSubmitMode ? '' : initialData?.purpose || '',
      observations: initialData?.observations || '',
      urgency: initialData?.urgency || 'normal',
      title: initialData?.title || '',
      description: initialData?.description || '',
    },
  });

  const handleSubmit = async (data: DeclarationFormValues) => {
    let filePath = '';
    
    // Upload file if selected
    if (selectedFile) {
      const uploadedPath = await uploadFile(selectedFile, 'declarations', 'documents');
      if (uploadedPath) {
        filePath = uploadedPath;
      } else {
        return; // Upload failed, don't proceed
      }
    }
    
    onSubmit({ ...data, file: selectedFile || undefined, filePath });
    onOpenChange(false);
    form.reset();
    setSelectedFile(null);
  };

  const mockStudents = [
    { id: '2024001', name: 'João Silva', class: '1º Ano A' },
    { id: '2024002', name: 'Maria Santos', class: '1º Ano A' },
    { id: '2024003', name: 'Pedro Oliveira', class: '2º Ano B' },
    { id: '2024004', name: 'Ana Costa', class: '2º Ano B' },
    { id: '2024005', name: 'Carlos Souza', class: '3º Ano A' },
  ];

  const requestDeclarationTypes = [
    {
      value: 'Declaração de Matrícula',
      label: 'Declaração de Matrícula',
      description: 'Comprova que o aluno está matriculado na instituição'
    },
    {
      value: 'Declaração de Frequência',
      label: 'Declaração de Frequência',
      description: 'Atesta a frequência do aluno nas aulas'
    },
    {
      value: 'Histórico Escolar',
      label: 'Histórico Escolar',
      description: 'Documento com histórico completo de notas e disciplinas'
    },
    {
      value: 'Declaração de Conclusão',
      label: 'Declaração de Conclusão',
      description: 'Comprova a conclusão do curso pelo aluno'
    },
    {
      value: 'Declaração de Escolaridade',
      label: 'Declaração de Escolaridade',
      description: 'Atesta o nível de escolaridade do aluno'
    },
    {
      value: 'Boletim Escolar',
      label: 'Boletim Escolar',
      description: 'Relatório das notas do período letivo'
    }
  ];

  const submitDocumentTypes = [
    {
      value: 'Envio de Atestado Médico',
      label: 'Atestado Médico',
      description: 'Envio de atestado médico para justificar faltas'
    },
    {
      value: 'Envio de Documento Pessoal',
      label: 'Documento Pessoal',
      description: 'Envio de documentos pessoais solicitados pela escola'
    },
    {
      value: 'Envio de Comprovante',
      label: 'Comprovante',
      description: 'Envio de comprovantes diversos (residência, renda, etc.)'
    }
  ];

  const declarationTypes = isSubmitMode ? submitDocumentTypes : requestDeclarationTypes;

  const urgencyLevels = [
    { value: 'baixa', label: 'Baixa (até 10 dias)', color: 'text-green-600' },
    { value: 'normal', label: 'Normal (até 5 dias)', color: 'text-blue-600' },
    { value: 'alta', label: 'Alta (até 2 dias)', color: 'text-orange-600' },
    { value: 'urgente', label: 'Urgente (24 horas)', color: 'text-red-600' },
  ];

  const selectedType = form.watch('type');
  const selectedDeclaration = declarationTypes.find(d => d.value === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' 
              ? (isSubmitMode ? 'Enviar Documento' : 'Nova Solicitação de Declaração')
              : 'Editar Solicitação'
            }
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Dados do Aluno - Apenas para Admin/Secretária */}
            {!isStudent && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Dados do Aluno</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aluno</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const student = mockStudents.find(s => s.name === value);
                              if (student) {
                                field.onChange(value);
                                form.setValue('studentId', student.id);
                              }
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o aluno" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockStudents.map((student) => (
                                <SelectItem key={student.id} value={student.name}>
                                  {student.name} - {student.class}
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
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matrícula</FormLabel>
                          <FormControl>
                            <Input placeholder="Matrícula do aluno" {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Aluno - Para visualização quando é estudante */}
            {isStudent && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Seus Dados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome</label>
                      <div className="p-2 bg-muted rounded-md text-sm">
                        {currentUser?.name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Matrícula</label>
                      <div className="p-2 bg-muted rounded-md text-sm">
                        {currentUser?.studentId}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tipo de Declaração/Documento */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">
                  {isSubmitMode ? 'Tipo de Documento' : 'Tipo de Declaração'}
                </h3>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isSubmitMode ? 'Selecione o tipo de documento' : 'Selecione o tipo'}
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isSubmitMode ? "Escolha o tipo de documento" : "Escolha o tipo de declaração"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {declarationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {selectedDeclaration && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            <strong>{selectedDeclaration.label}:</strong> {selectedDeclaration.description}
                          </p>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Upload de Arquivo - apenas no modo submit */}
            {isSubmitMode && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Anexar Documento</h3>
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    currentFile={selectedFile}
                    onRemoveFile={() => setSelectedFile(null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={10}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: PDF, JPG, PNG. Tamanho máximo: 10MB
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Título e Descrição - para modo submit */}
            {isSubmitMode && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Informações do Documento</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Breve título para o documento (ex: Atestado médico - 15/09/2024)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o conteúdo do documento e sua finalidade..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados da Solicitação */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Dados da Solicitação</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!isStudent && (
                      <FormField
                        control={form.control}
                        name="requestedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Solicitante</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Quem está solicitando?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Aluno">Aluno</SelectItem>
                                <SelectItem value="Responsável">Responsável</SelectItem>
                                <SelectItem value="Escola">Escola</SelectItem>
                                <SelectItem value="Terceiro">Terceiro (procuração)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {isStudent && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Solicitante</label>
                        <div className="p-2 bg-muted rounded-md text-sm">
                          Aluno
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgência</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Nível de urgência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {urgencyLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  <span className={level.color}>{level.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!isSubmitMode && (
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finalidade</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Para que será utilizada a declaração? (ex: matrícula em curso, trabalho, bolsa de estudos)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Adicionais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais importantes para a emissão da declaração..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={uploading || (isSubmitMode && !selectedFile)}>
                {uploading 
                  ? 'Enviando...' 
                  : mode === 'create' 
                    ? (isSubmitMode ? 'Enviar Documento' : 'Solicitar Declaração')
                    : 'Salvar Alterações'
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};