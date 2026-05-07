import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Restricts access to a route to authenticated users whose role is included in
 * `allowedRoles`. Renders a loader while the profile is being fetched, redirects
 * unauthenticated users to /auth, and unauthorized users to /dashboard.
 */
export const RoleGuard = ({ allowedRoles, children, redirectTo = '/dashboard' }: RoleGuardProps) => {
  const { user, profile, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const role = profile?.role;
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
