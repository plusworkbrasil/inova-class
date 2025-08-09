import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { useCommunications } from '@/hooks/useCommunications';
import { useState } from 'react';

interface StudentBannerProps {
  studentRole?: string;
}

const StudentBanner = ({ studentRole = 'student' }: StudentBannerProps) => {
  const { data: communications, loading } = useCommunications();
  const [dismissedNotices, setDismissedNotices] = useState<number[]>([]);

  // Filtrar apenas avisos urgentes e ativos para o banner
  const urgentNotices = communications?.filter(comm => 
    comm.is_published && 
    comm.published_at &&
    new Date(comm.published_at) <= new Date() &&
    (!comm.expires_at || new Date(comm.expires_at) > new Date()) &&
    comm.target_audience?.includes(studentRole) &&
    comm.priority === 'high' &&
    !dismissedNotices.includes(comm.id)
  ) || [];

  const dismissNotice = (noticeId: number) => {
    setDismissedNotices(prev => [...prev, noticeId]);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Megaphone className="h-5 w-5" />;
    }
  };

  if (loading || urgentNotices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {urgentNotices.map((notice) => (
        <Alert key={notice.id} className="border-destructive bg-destructive/5">
          <div className="flex items-start justify-between w-full">
            <div className="flex items-start space-x-3 flex-1">
              <div className="text-destructive mt-0.5">
                {getPriorityIcon(notice.priority)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <AlertTitle className="text-destructive font-semibold text-base">
                    {notice.title}
                  </AlertTitle>
                  <Badge variant="destructive" className="text-xs">
                    URGENTE
                  </Badge>
                </div>
                <AlertDescription className="text-foreground">
                  {notice.content}
                </AlertDescription>
                {notice.expires_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Expira em: {new Date(notice.expires_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissNotice(notice.id)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default StudentBanner;