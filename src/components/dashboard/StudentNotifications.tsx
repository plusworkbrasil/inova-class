import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Calendar, AlertTriangle, Info } from 'lucide-react';
import { useCommunications } from '@/hooks/useCommunications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentNotificationsProps {
  studentRole?: string;
}

const StudentNotifications = ({ studentRole = 'student' }: StudentNotificationsProps) => {
  const { data: communications, loading } = useCommunications();

  // Filtrar apenas comunicações publicadas e ativas
  const activeNotifications = communications?.filter(comm => 
    comm.is_published && 
    comm.published_at &&
    new Date(comm.published_at) <= new Date() &&
    (!comm.expires_at || new Date(comm.expires_at) > new Date()) &&
    comm.target_audience?.includes(studentRole)
  ) || [];

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Urgente</Badge>;
      case 'normal':
        return <Badge variant="default">Normal</Badge>;
      default:
        return <Badge variant="outline">Informativo</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Avisos e Comunicados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Carregando avisos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Avisos e Comunicados
          {activeNotifications.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {activeNotifications.length} novo{activeNotifications.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum aviso no momento</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {activeNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(notification.priority)}
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                    </div>
                    <div className="flex-shrink-0">
                      {getPriorityBadge(notification.priority)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(notification.published_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    
                    {notification.expires_at && (
                      <div className="flex items-center gap-1">
                        <span>Expira em:</span>
                        <span>
                          {formatDistanceToNow(new Date(notification.expires_at), {
                            locale: ptBR
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNotifications;