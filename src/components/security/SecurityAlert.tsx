import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Info, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SecurityAlertProps {
  type: 'info' | 'warning' | 'error' | 'success' | 'critical';
  title: string;
  description: string;
  className?: string;
}

export const SecurityAlert = ({ type, title, description, className }: SecurityAlertProps) => {
  const { profile } = useAuth();

  // Enhanced security: Only show security alerts to authorized users
  if (!profile || !['admin', 'secretary'].includes(profile.role)) {
    return null;
  }
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <Shield className="h-4 w-4 text-destructive" />;
      case 'critical':
        return <Lock className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {getIcon()}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};