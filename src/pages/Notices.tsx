import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunications } from '@/hooks/useCommunications';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Plus, Edit, Trash2, Megaphone, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';

const Notices = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: communications, loading, createCommunication, updateCommunication, deleteCommunication, refetch } = useCommunications();
  const { toast } = useToast();
  
  const [userRole, setUserRole] = useState<UserRole>('secretary');
  const [userName, setUserName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    target_audience: 'student',
    expires_at: ''
  });

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role') as UserRole;
    const storedName = localStorage.getItem('user_name');
    
    if (storedRole) setUserRole(storedRole);
    if (storedName) setUserName(storedName);
  }, []);

  // Filtrar apenas avisos da secretaria (baseado no role do autor atual)
  const secretaryNotices = communications?.filter(comm => 
    userRole === 'secretary' || userRole === 'admin'
  ) || [];

  const handleCreateNotice = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Título e conteúdo são obrigatórios."
      });
      return;
    }

    try {
      const noticeData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        target_audience: [formData.target_audience],
        is_published: true,
        expires_at: formData.expires_at || null
      };

      await createCommunication(noticeData);
      
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        target_audience: 'student',
        expires_at: ''
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating notice:', error);
    }
  };

  const handleEditNotice = async () => {
    if (!editingNotice || !formData.title.trim() || !formData.content.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Título e conteúdo são obrigatórios."
      });
      return;
    }

    try {
      const noticeData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority as 'low' | 'medium' | 'high',
        target_audience: [formData.target_audience],
        expires_at: formData.expires_at || null
      };

      await updateCommunication(editingNotice.id, noticeData);
      
      setEditingNotice(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating notice:', error);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      await deleteCommunication(noticeId);
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  const openEditDialog = (notice: any) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority || 'medium',
      target_audience: Array.isArray(notice.target_audience) ? notice.target_audience[0] : notice.target_audience,
      expires_at: notice.expires_at ? new Date(notice.expires_at).toISOString().slice(0, 16) : ''
    });
    setIsEditDialogOpen(true);
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
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="default">Média</Badge>;
      case 'low':
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusBadge = (isPublished: boolean, expiresAt: string | null) => {
    if (!isPublished) return <Badge variant="secondary">Rascunho</Badge>;
    if (expiresAt && new Date(expiresAt) <= new Date()) return <Badge variant="destructive">Expirado</Badge>;
    return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
  };

  if (userRole !== 'secretary' && userRole !== 'admin') {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito à secretaria.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avisos para Alunos</h1>
            <p className="text-muted-foreground">
              Gerencie avisos e comunicados importantes para os estudantes
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Aviso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Aviso</DialogTitle>
                <DialogDescription>
                  Crie um novo aviso para ser exibido no perfil dos alunos
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Aviso</Label>
                  <Input
                    id="title"
                    placeholder="Digite o título do aviso"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    placeholder="Digite o conteúdo do aviso"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateNotice}>
                    Criar Aviso
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Avisos</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{secretaryNotices.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avisos Ativos</CardTitle>
              <div className="h-4 w-4 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {secretaryNotices.filter(notice => 
                  notice.is_published && (!notice.expires_at || new Date(notice.expires_at) > new Date())
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {secretaryNotices.filter(notice => notice.priority === 'high').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Avisos */}
        <Card>
          <CardHeader>
            <CardTitle>Avisos Cadastrados</CardTitle>
            <CardDescription>Gerencie todos os avisos criados para os alunos</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secretaryNotices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(notice.priority)}
                          <div>
                            <p className="font-medium">{notice.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-48">
                              {notice.content}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(notice.priority)}</TableCell>
                      <TableCell>{getStatusBadge(notice.is_published, notice.expires_at)}</TableCell>
                      <TableCell>
                        {notice.created_at ? new Date(notice.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {notice.expires_at ? new Date(notice.expires_at).toLocaleDateString('pt-BR') : 'Sem expiração'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(notice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotice(notice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Aviso</DialogTitle>
              <DialogDescription>
                Edite as informações do aviso
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título do Aviso</Label>
                <Input
                  id="edit-title"
                  placeholder="Digite o título do aviso"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Conteúdo</Label>
                <Textarea
                  id="edit-content"
                  placeholder="Digite o conteúdo do aviso"
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-expires_at">Data de Expiração (opcional)</Label>
                  <Input
                    id="edit-expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditNotice}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Notices;