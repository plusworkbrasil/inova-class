import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldAlert, ShieldCheck, Search, Eye, Clock, Users as UsersIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { getRoleTranslation } from '@/lib/roleTranslations';

interface BlockedProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  class_id?: string | null;
  updated_at?: string | null;
  role?: UserRole | null;
  attempts: Array<{
    id: string;
    attempted_route: string;
    user_role: string | null;
    attempted_at: string;
  }>;
}

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const BlockedUsers = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || profile?.email || 'Admin';

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<BlockedProfile[]>([]);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<BlockedProfile | null>(null);
  const [confirmUnblock, setConfirmUnblock] = useState<BlockedProfile | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email, phone, class_id, updated_at')
        .eq('status', 'blocked')
        .order('updated_at', { ascending: false });
      if (pErr) throw pErr;

      const ids = (profiles || []).map((p) => p.id);
      let attemptsByUser: Record<string, BlockedProfile['attempts']> = {};
      let rolesByUser: Record<string, UserRole> = {};

      if (ids.length) {
        const [{ data: attempts }, { data: roles }] = await Promise.all([
          supabase
            .from('unauthorized_access_attempts')
            .select('id, user_id, attempted_route, user_role, attempted_at')
            .in('user_id', ids)
            .order('attempted_at', { ascending: false }),
          supabase
            .from('user_roles')
            .select('user_id, role, granted_at')
            .in('user_id', ids)
            .order('granted_at', { ascending: false }),
        ]);
        (attempts || []).forEach((a: any) => {
          if (!attemptsByUser[a.user_id]) attemptsByUser[a.user_id] = [];
          attemptsByUser[a.user_id].push({
            id: a.id,
            attempted_route: a.attempted_route,
            user_role: a.user_role,
            attempted_at: a.attempted_at,
          });
        });
        (roles || []).forEach((r: any) => {
          if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = r.role as UserRole;
        });
      }

      setUsers(
        (profiles || []).map((p: any) => ({
          ...p,
          role: rolesByUser[p.id] || null,
          attempts: attemptsByUser[p.id] || [],
        })),
      );
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao carregar', description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s),
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return {
      total: users.length,
      last24h: users.filter((u) => u.updated_at && new Date(u.updated_at).getTime() >= dayAgo).length,
      attempts: users.reduce((acc, u) => acc + u.attempts.length, 0),
    };
  }, [users]);

  const handleUnblock = async (user: BlockedProfile) => {
    setUnblocking(true);
    try {
      const { error } = await supabase.rpc('unblock_user', { p_user_id: user.id });
      if (error) throw error;
      toast({ title: 'Usuário desbloqueado', description: user.name || user.email });
      setConfirmUnblock(null);
      setDetail(null);
      await load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Falha ao desbloquear', description: e?.message });
    } finally {
      setUnblocking(false);
    }
  };

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-destructive" />
            Usuários Bloqueados
          </h1>
          <p className="text-sm text-muted-foreground">
            Contas bloqueadas automaticamente após múltiplas tentativas de acesso a áreas restritas. Revise os detalhes e desbloqueie quando apropriado.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs font-medium text-muted-foreground">Total bloqueados</p><p className="text-2xl font-bold text-destructive">{stats.total}</p></div>
            <UsersIcon className="h-7 w-7 text-destructive" />
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs font-medium text-muted-foreground">Bloqueios nas últimas 24h</p><p className="text-2xl font-bold text-warning">{stats.last24h}</p></div>
            <Clock className="h-7 w-7 text-warning" />
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs font-medium text-muted-foreground">Tentativas registradas</p><p className="text-2xl font-bold text-primary">{stats.attempts}</p></div>
            <ShieldAlert className="h-7 w-7 text-primary" />
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Lista</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Nenhum usuário bloqueado no momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Bloqueado em</TableHead>
                      <TableHead className="text-center">Tentativas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || '—'}</TableCell>
                        <TableCell className="text-sm">{u.email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.role ? getRoleTranslation(u.role) : '—'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(u.updated_at)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">{u.attempts.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => setDetail(u)}>
                              <Eye className="w-4 h-4" /><span className="text-xs">Detalhes</span>
                            </Button>
                            <Button size="sm" className="gap-1" onClick={() => setConfirmUnblock(u)}>
                              <ShieldCheck className="w-4 h-4" /><span className="text-xs">Desbloquear</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do bloqueio</DialogTitle>
            <DialogDescription>Informações do usuário e histórico de tentativas registradas.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Nome</p><p className="font-medium">{detail.name || '—'}</p></div>
                <div><p className="text-muted-foreground">E-mail</p><p className="font-medium">{detail.email || '—'}</p></div>
                <div><p className="text-muted-foreground">Perfil</p><p className="font-medium">{detail.role ? getRoleTranslation(detail.role) : '—'}</p></div>
                <div><p className="text-muted-foreground">Telefone</p><p className="font-medium">{detail.phone || '—'}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Bloqueado em</p><p className="font-medium">{formatDateTime(detail.updated_at)}</p></div>
              </div>

              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="font-medium text-destructive">Motivo do bloqueio</p>
                <p className="text-muted-foreground mt-1">
                  Bloqueio automático após 3 ou mais tentativas de acesso a rota restrita em até 5 minutos.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">Histórico de tentativas ({detail.attempts.length})</p>
                {detail.attempts.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma tentativa registrada.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quando</TableHead>
                          <TableHead>Rota</TableHead>
                          <TableHead>Perfil na época</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.attempts.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs whitespace-nowrap">{formatDateTime(a.attempted_at)}</TableCell>
                            <TableCell className="text-xs font-mono">{a.attempted_route}</TableCell>
                            <TableCell className="text-xs">{a.user_role || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setConfirmUnblock(detail)} className="gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Desbloquear usuário
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmUnblock} onOpenChange={(o) => !o && setConfirmUnblock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUnblock?.name || confirmUnblock?.email} voltará a ter acesso normal à plataforma. A ação ficará registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unblocking}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={unblocking}
              onClick={(e) => { e.preventDefault(); if (confirmUnblock) handleUnblock(confirmUnblock); }}
            >
              {unblocking ? 'Desbloqueando...' : 'Confirmar desbloqueio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default BlockedUsers;
