import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  hasData?: boolean;
}

interface DeleteResult {
  id: string;
  email?: string;
  success: boolean;
  error?: string;
}

export const BulkUserDelete = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailList, setEmailList] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResults, setDeleteResults] = useState<DeleteResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const parseEmails = () => {
    const emails = emailList
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    return emails;
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const emails = parseEmails();
      if (emails.length === 0) {
        toast({
          title: "Erro",
          description: "Por favor, insira pelo menos um email válido",
          variant: "destructive"
        });
        return;
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .in('email', emails);

      if (error) throw error;

      // Check for users with related data
      const usersWithData = await Promise.all(
        profiles?.map(async (profile) => {
          const [attendance, grades, evasions, declarations] = await Promise.all([
            supabase.from('attendance').select('id', { count: 'exact' }).eq('student_id', profile.id),
            supabase.from('grades').select('id', { count: 'exact' }).eq('student_id', profile.id),
            supabase.from('evasions').select('id', { count: 'exact' }).eq('student_id', profile.id),
            supabase.from('declarations').select('id', { count: 'exact' }).eq('student_id', profile.id)
          ]);

          const hasData = 
            (attendance.count || 0) > 0 ||
            (grades.count || 0) > 0 ||
            (evasions.count || 0) > 0 ||
            (declarations.count || 0) > 0;

          return {
            ...profile,
            hasData
          };
        }) || []
      );

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar usuários",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    setDeleteResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-cascade', {
        body: {
          userEmails: users.map(user => user.email)
        }
      });

      if (error) throw error;

      setDeleteResults(data.results || []);
      setShowResults(true);
      
      toast({
        title: "Exclusão Concluída",
        description: `${data.summary?.successful || 0} usuários deletados com sucesso`,
      });

      // Clear the form
      setEmailList('');
      setUsers([]);
      
    } catch (error) {
      console.error('Error deleting users:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar usuários",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = () => {
    setEmailList('');
    setUsers([]);
    setDeleteResults([]);
    setShowResults(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          Exclusão em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exclusão de Usuários em Lote</DialogTitle>
          <DialogDescription>
            Delete múltiplos usuários e todos os dados relacionados. Esta ação é irreversível.
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Lista de Emails (um por linha)
              </label>
              <Textarea
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                placeholder="joao@exemplo.com&#10;maria@exemplo.com&#10;admin@escola.com"
                rows={10}
                className="font-mono text-sm"
              />
              <div className="flex gap-2 mt-2">
                <Button onClick={fetchUsers} disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verificar Usuários
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Limpar
                </Button>
              </div>
            </div>

            {users.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Usuários Encontrados ({users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                            {user.role}
                          </Badge>
                          {user.hasData && (
                            <Badge variant="outline" className="text-orange-600">
                              Com dados
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Atenção: Ação Irreversível
                    </div>
                    <p className="text-red-700 text-sm">
                      Esta ação irá deletar permanentemente todos os usuários listados e todos os dados relacionados 
                      (notas, frequências, declarações, etc.). Esta operação não pode ser desfeita.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="destructive" 
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Confirmar Exclusão de {users.length} Usuários
                    </Button>
                    <Button variant="outline" onClick={() => setUsers([])}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Exclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deleteResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">ID: {result.id.slice(0, 8)}...</div>
                          {result.email && (
                            <div className="text-sm text-muted-foreground">{result.email}</div>
                          )}
                        </div>
                      </div>
                      <div>
                        {result.success ? (
                          <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
                        ) : (
                          <Badge variant="destructive">Erro</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button onClick={handleReset} className="w-full mt-4">
                  Fechar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};