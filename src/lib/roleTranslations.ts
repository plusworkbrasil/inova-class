import { UserRole } from '@/types/user';

export const roleTranslations: Record<UserRole, string> = {
  admin: 'Admin',
  coordinator: 'Coordenador',
  secretary: 'Secretaria',
  tutor: 'Tutor',
  student: 'Aluno',
  instructor: 'Instrutor'
};

export const getRoleTranslation = (role: UserRole): string => {
  return roleTranslations[role] || role;
};