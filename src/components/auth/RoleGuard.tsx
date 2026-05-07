import { ReactNode, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Restringe rota a usuários autenticados cujo papel está em `allowedRoles`.
 * - Conta com status `blocked` → logout forçado.
 * - Acesso negado → registra tentativa via RPC (3 em 5 min ⇒ conta bloqueada
 *   automaticamente, com notificação para admins e registro em audit_logs).
 */
export const RoleGuard = ({ allowedRoles, children, redirectTo = '/dashboard' }: RoleGuardProps) => {
  const { user, profile, loading, logout } = useSupabaseAuth();
  const location = useLocation();
  const { toast } = useToast();
  const reportedRef = useRef<string | null>(null);
  const [blockedNotice, setBlockedNotice] = useState(false);

  const role = profile?.role;
  const isAuthorized = !!role && allowedRoles.includes(role);
  const isBlocked = profile?.status === 'blocked';

  useEffect(() => {
    // Se a conta está bloqueada, força logout imediato
    if (!loading && user && isBlocked) {
      toast({
        variant: 'destructive',
        title: 'Conta bloqueada',
        description: 'Sua conta foi bloqueada. Procure um administrador.',
      });
      logout();
      return;
    }

    // Registra tentativa de acesso não autorizado (uma vez por rota)
    if (!loading && user && role && !isAuthorized && reportedRef.current !== location.pathname) {
      reportedRef.current = location.pathname;
      supabase.rpc('record_unauthorized_access_attempt', { p_route: location.pathname })
        .then(({ data, error }) => {
          if (error) {
            console.error('[RoleGuard] Falha ao registrar tentativa:', error);
            return;
          }
          const result = data as { ok?: boolean; blocked?: boolean; recent_attempts?: number } | null;
          if (result?.blocked) {
            setBlockedNotice(true);
            toast({
              variant: 'destructive',
              title: 'Conta bloqueada',
              description: 'Você ultrapassou o limite de tentativas de acesso a áreas restritas.',
            });
            setTimeout(() => logout(), 1500);
          } else {
            toast({
              variant: 'destructive',
              title: 'Acesso negado',
              description: `Tentativa registrada (${result?.recent_attempts ?? 1}/3). Após 3 tentativas em 5 min sua conta será bloqueada.`,
            });
          }
        });
    }
  }, [loading, user, role, isAuthorized, isBlocked, location.pathname, logout, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (isBlocked || blockedNotice) return <Navigate to="/auth" replace />;
  if (!isAuthorized) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
};
