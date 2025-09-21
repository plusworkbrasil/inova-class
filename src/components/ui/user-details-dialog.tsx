import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Users } from 'lucide-react';
import { roleTranslations } from '@/lib/roleTranslations';
import type { UserRole } from '@/types/user';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any | null;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  if (!user) return null;

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'coordinator': return 'default';
      case 'teacher': return 'secondary';
      case 'secretary': return 'outline';
      case 'tutor': return 'secondary';
      case 'student': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.photo || user.avatar} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-muted-foreground">{user.full_name || user.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
                      {roleTranslations[user.role as UserRole] || user.role}
                    </Badge>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.cpf && (
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <span className="text-sm">CPF: {user.cpf}</span>
                  </div>
                )}
                {user.student_id && (
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-muted-foreground" />
                    <span className="text-sm">Matrícula: {user.student_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações Acadêmicas - Apenas para estudantes */}
          {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Acadêmicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.escolaridade && (
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-muted-foreground" />
                    <span className="text-sm">Escolaridade: {user.escolaridade}</span>
                  </div>
                )}
                {user.class_id && (
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="text-sm">Turma: {user.class_id}</span>
                  </div>
                )}
                {user.parent_name && (
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <span className="text-sm">Responsável: {user.parent_name}</span>
                  </div>
                )}
                {user.guardian_name && (
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <span className="text-sm">Responsável Legal: {user.guardian_name}</span>
                  </div>
                )}
                {user.guardian_phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <span className="text-sm">Tel. Responsável: {user.guardian_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Endereço */}
          {(user.street || user.cep) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endereço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-muted-foreground mt-1" />
                  <div className="text-sm">
                    {user.street && (
                      <div>
                        {user.street}
                        {user.number && `, ${user.number}`}
                        {user.complement && `, ${user.complement}`}
                      </div>
                    )}
                    {user.neighborhood && <div>{user.neighborhood}</div>}
                    {user.city && user.state && (
                      <div>{user.city} - {user.state}</div>
                    )}
                    {user.cep && <div>CEP: {user.cep}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-muted-foreground" />
                <span className="text-sm">
                  Criado em: {formatDate(user.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-muted-foreground" />
                <span className="text-sm">
                  Última atualização: {formatDate(user.updated_at)}
                </span>
              </div>
              {user.enrollment_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  <span className="text-sm">
                    Data de matrícula: {formatDate(user.enrollment_date)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};