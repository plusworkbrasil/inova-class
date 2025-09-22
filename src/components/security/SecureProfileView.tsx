import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface SecureProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  medical_info?: string;
  allergies?: string;
  medical_conditions?: string;
  medications?: string;
  blood_type?: string;
  health_insurance?: string;
  class_id?: string;
  student_id?: string;
  enrollment_number?: string;
  status?: string;
}

interface SecureProfileViewProps {
  userId: string;
  className?: string;
}

export const SecureProfileView = ({ userId, className }: SecureProfileViewProps) => {
  const { profile: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<SecureProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecureProfile = async () => {
      if (!currentUser?.id || !userId) return;

      try {
        setLoading(true);
        
        // Use role-based secure data access
        if (currentUser.role === 'instructor') {
          // Instructors can only access limited academic data via secure RPC
          const { data, error } = await supabase.rpc('get_instructor_viewable_student_data', {
            target_student_id: userId
          });
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Convert RPC result to expected format
            const studentData = data[0];
            setProfileData({
              id: studentData.id,
              name: studentData.name,
              email: studentData.email,
              role: studentData.role,
              student_id: studentData.student_id,
              enrollment_number: studentData.enrollment_number,
              status: studentData.status,
              class_id: studentData.class_id,
              // No access to sensitive data for instructors
              cpf: null,
              rg: null,
              birth_date: null,
              medical_info: null,
              allergies: null,
              medical_conditions: null,
              medications: null,
              blood_type: null,
              health_insurance: null,
            });
          } else {
            setError('Perfil não encontrado ou sem permissão de acesso');
          }
        } else {
          // Admins, secretaries, and users viewing their own profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) throw error;

          if (data) {
            // Check permissions and filter sensitive data
            const canViewPersonal = await supabase.rpc('can_access_personal_data', {
              target_user_id: userId
            });
            
            const canViewMedical = await supabase.rpc('can_access_medical_data', {
              target_user_id: userId
            });

            // Filter data based on permissions
            const filteredData = {
              ...data,
              cpf: canViewPersonal.data ? data.cpf : null,
              rg: canViewPersonal.data ? data.rg : null,
              birth_date: canViewPersonal.data ? data.birth_date : null,
              medical_info: canViewMedical.data ? data.medical_info : null,
              allergies: canViewMedical.data ? data.allergies : null,
              medical_conditions: canViewMedical.data ? data.medical_conditions : null,
              medications: canViewMedical.data ? data.medications : null,
              blood_type: canViewMedical.data ? data.blood_type : null,
              health_insurance: canViewMedical.data ? data.health_insurance : null,
            };

            setProfileData(filteredData);
          } else {
            setError('Perfil não encontrado ou sem permissão de acesso');
          }
        }
      } catch (err) {
        console.error('Error fetching secure profile:', err);
        setError('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchSecureProfile();
  }, [currentUser?.id, userId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !profileData) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{error || 'Dados não disponíveis'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderProtectedField = (label: string, value: string | null | undefined, isProtected: boolean) => {
    if (isProtected && !value) {
      return (
        <div className="flex items-center gap-2">
          <EyeOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Informação protegida</span>
        </div>
      );
    }

    return (
      <div>
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm">
          {value || (
            <span className="text-muted-foreground italic">Não informado</span>
          )}
        </dd>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Perfil Seguro - {profileData.name}
          <Badge variant={profileData.role === 'admin' ? 'default' : 'secondary'}>
            {profileData.role}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information - Always Visible */}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
            <dd className="text-sm font-medium">{profileData.name}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="text-sm">{profileData.email}</dd>
          </div>

          {profileData.phone && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Telefone</dt>
              <dd className="text-sm">{profileData.phone}</dd>
            </div>
          )}

          {/* Protected Personal Data */}
          {renderProtectedField('CPF', profileData.cpf, !profileData.cpf)}
          {renderProtectedField('RG', profileData.rg, !profileData.rg)}
          {renderProtectedField('Data de Nascimento', profileData.birth_date, !profileData.birth_date)}

          {/* Medical Data - Highly Protected */}
          {renderProtectedField('Informações Médicas', profileData.medical_info, !profileData.medical_info)}
          {renderProtectedField('Alergias', profileData.allergies, !profileData.allergies)}
          {renderProtectedField('Condições Médicas', profileData.medical_conditions, !profileData.medical_conditions)}
          {renderProtectedField('Medicamentos', profileData.medications, !profileData.medications)}
          {renderProtectedField('Tipo Sanguíneo', profileData.blood_type, !profileData.blood_type)}

          {/* Academic Data */}
          {profileData.student_id && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">ID do Estudante</dt>
              <dd className="text-sm">{profileData.student_id}</dd>
            </div>
          )}

          {profileData.enrollment_number && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Número de Matrícula</dt>
              <dd className="text-sm">{profileData.enrollment_number}</dd>
            </div>
          )}

          {profileData.status && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={profileData.status === 'active' ? 'default' : 'secondary'}>
                  {profileData.status}
                </Badge>
              </dd>
            </div>
          )}
        </dl>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>
              Acesso baseado em permissões de segurança. Dados sensíveis são protegidos conforme sua função.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};