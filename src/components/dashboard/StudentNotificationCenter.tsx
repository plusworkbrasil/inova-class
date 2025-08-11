import React, { useState, useEffect } from 'react';
import { useCommunications } from '@/hooks/useCommunications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Megaphone, 
  AlertTriangle, 
  Info, 
  Bell, 
  Eye, 
  X, 
  Calendar,
  Clock,
  MessageSquare 
} from 'lucide-react';

interface StudentNotificationCenterProps {
  studentRole?: string;
}

const StudentNotificationCenter = ({ studentRole = 'student' }: StudentNotificationCenterProps) => {
  const { data: communications, loading } = useCommunications();
  const [dismissedNotices, setDismissedNotices] = useState<number[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Recuperar avisos dispensados do localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notices') || '[]');
    setDismissedNotices(dismissed);
  }, []);

  // Filtrar avisos relevantes para alunos
  const studentNotices = communications?.filter(comm => 
    comm.is_published && 
    comm.published_at &&
    new Date(comm.published_at) <= new Date() &&
    (!comm.expires_at || new Date(comm.expires_at) > new Date()) &&
    comm.target_audience?.includes(studentRole) &&
    !dismissedNotices.includes(comm.id)
  ) || [];

  // Separar avisos por prioridade
  const urgentNotices = studentNotices.filter(notice => notice.priority === 'high');
  const regularNotices = studentNotices.filter(notice => notice.priority !== 'high');

  const dismissNotice = (noticeId: number) => {
    const newDismissed = [...dismissedNotices, noticeId];
    setDismissedNotices(newDismissed);
    localStorage.setItem('dismissed_notices', JSON.stringify(newDismissed));
  };

  const viewNoticeDetails = (notice: any) => {
    setSelectedNotice(notice);
    setIsDialogOpen(true);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Megaphone className="h-4 w-4 text-warning" />;
      case 'low':
        return <Info className="h-4 w-4 text-info" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">URGENTE</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs">Importante</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Informativo</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Aviso</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (studentNotices.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Nenhum aviso no momento</h3>
              <p className="text-sm text-muted-foreground">
                Você está em dia! Não há novos avisos para exibir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Avisos Urgentes */}
      {urgentNotices.length > 0 && (
        <Card className="border-destructive bg-gradient-to-r from-destructive/5 to-background border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg text-destructive">Avisos Urgentes</CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {urgentNotices.length} {urgentNotices.length === 1 ? 'aviso' : 'avisos'}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Requer atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentNotices.map((notice) => (
                <Alert key={notice.id} className="border-destructive/20 bg-destructive/5">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <AlertTitle className="font-semibold text-destructive">
                          {notice.title}
                        </AlertTitle>
                        {getPriorityBadge(notice.priority)}
                      </div>
                      <AlertDescription className="text-foreground text-sm">
                        {notice.content.length > 100 
                          ? `${notice.content.substring(0, 100)}...` 
                          : notice.content}
                      </AlertDescription>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(notice.published_at!).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {notice.expires_at && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Expira: {new Date(notice.expires_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewNoticeDetails(notice)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotice(notice.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos Gerais */}
      {regularNotices.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Avisos e Comunicados</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {regularNotices.length} {regularNotices.length === 1 ? 'aviso' : 'avisos'}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Informações importantes da secretaria e coordenação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {regularNotices.map((notice, index) => (
                  <div key={notice.id}>
                    <Alert className="bg-card hover:bg-accent/50 transition-colors cursor-pointer" 
                          onClick={() => viewNoticeDetails(notice)}>
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-0.5">
                            {getPriorityIcon(notice.priority)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <AlertTitle className="font-semibold text-foreground">
                                {notice.title}
                              </AlertTitle>
                              {getPriorityBadge(notice.priority)}
                            </div>
                            <AlertDescription className="text-muted-foreground text-sm">
                              {notice.content.length > 120 
                                ? `${notice.content.substring(0, 120)}...` 
                                : notice.content}
                            </AlertDescription>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(notice.published_at!).toLocaleDateString('pt-BR')}</span>
                              </div>
                              {notice.expires_at && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Expira: {new Date(notice.expires_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotice(notice.id);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Alert>
                    {index < regularNotices.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Dialog para detalhes do aviso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center space-x-2 mb-2">
              {selectedNotice && getPriorityIcon(selectedNotice.priority)}
              <DialogTitle>{selectedNotice?.title}</DialogTitle>
              {selectedNotice && getPriorityBadge(selectedNotice.priority)}
            </div>
            <DialogDescription>
              Detalhes do aviso
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotice && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-foreground leading-relaxed">
                  {selectedNotice.content}
                </p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Publicado: {new Date(selectedNotice.published_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {selectedNotice.expires_at && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Expira: {new Date(selectedNotice.expires_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    dismissNotice(selectedNotice.id);
                    setIsDialogOpen(false);
                  }}
                >
                  Marcar como lido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentNotificationCenter;