import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, FileSearch, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const USERS_TO_DIAGNOSE = [
  '4nna.menezes@gmail.com',
  'jejejessicamaria@gmail.com',
  'annelais002@gmail.com',
  'beatrizsouza85596@gmail.com'
];

interface DiagnosisResult {
  profile_email: string;
  profile_id: string | null;
  profile_name: string | null;
  auth_email: string | null;
  email_confirmed: boolean | null;
  last_sign_in_at: string | null;
  status: 'SYNCED' | 'MISMATCH' | 'NOT_FOUND_IN_PROFILES' | 'NOT_FOUND_IN_AUTH' | 'ERROR';
  message: string;
}

export function DiagnoseAuthForm() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosisResult[]>([]);

  const handleDiagnose = async () => {
    try {
      setLoading(true);
      setResults([]);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('diagnose-auth-profile-emails', {
        body: { emails: USERS_TO_DIAGNOSE }
      });

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        const mismatchCount = data.results.filter((r: DiagnosisResult) => r.status === 'MISMATCH').length;
        
        if (mismatchCount > 0) {
          toast.warning(`Diagnóstico completo: ${mismatchCount} emails desincronizados encontrados`);
        } else {
          toast.success('Diagnóstico completo: Todos os emails estão sincronizados');
        }
      } else {
        throw new Error(data.error || 'Erro ao executar diagnóstico');
      }
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      toast.error('Erro ao executar diagnóstico: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle2 size={14} /> Sincronizado</Badge>;
      case 'MISMATCH':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle size={14} /> Desincronizado</Badge>;
      case 'NOT_FOUND_IN_PROFILES':
      case 'NOT_FOUND_IN_AUTH':
        return <Badge variant="secondary" className="flex items-center gap-1"><XCircle size={14} /> Não Encontrado</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle size={14} /> Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <Alert>
        <FileSearch className="h-4 w-4" />
        <AlertDescription>
          Este diagnóstico verifica se os emails na tabela <code className="font-mono">profiles</code> estão 
          sincronizados com os emails no sistema de autenticação (<code className="font-mono">auth.users</code>).
          <br />
          <strong>Usuários a verificar:</strong> {USERS_TO_DIAGNOSE.join(', ')}
        </AlertDescription>
      </Alert>

      <Button 
        onClick={handleDiagnose}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Diagnosticando...
          </>
        ) : (
          <>
            <FileSearch className="mr-2 h-4 w-4" />
            Executar Diagnóstico
          </>
        )}
      </Button>

      {results.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email (Profiles)</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email (Auth)</TableHead>
                <TableHead>Email Confirmado</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">{result.profile_email}</TableCell>
                  <TableCell>{result.profile_name || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {result.auth_email || '-'}
                    {result.auth_email && result.auth_email !== result.profile_email && (
                      <span className="text-destructive ml-1">⚠️</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.email_confirmed === null ? '-' : result.email_confirmed ? '✅' : '❌'}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(result.last_sign_in_at)}</TableCell>
                  <TableCell>{getStatusBadge(result.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-4 bg-muted text-sm space-y-1">
            <p className="font-semibold">Detalhes:</p>
            {results.map((result, index) => (
              <p key={index} className="text-muted-foreground">
                • <strong>{result.profile_email}</strong>: {result.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
