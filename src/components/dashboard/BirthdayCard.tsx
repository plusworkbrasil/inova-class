import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Cake, Gift, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BirthdayPerson {
  id: string;
  name: string;
  avatar?: string;
  birth_date: string;
  role: string;
  isToday: boolean;
}

export const BirthdayCard: React.FC = () => {
  const [birthdayPeople, setBirthdayPeople] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserBirthday, setIsUserBirthday] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBirthdayPeople();
  }, []);

  const fetchBirthdayPeople = async () => {
    try {
      setLoading(true);
      
      // Get current date and week range
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, avatar, birth_date, role')
        .not('birth_date', 'is', null);

      if (error) throw error;

      // Filter people with birthdays this week
      const currentYear = today.getFullYear();
      const weekBirthdays: BirthdayPerson[] = [];

      profiles?.forEach(person => {
        if (person.birth_date) {
          const birthDate = new Date(person.birth_date);
          const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
          
          // Check if birthday falls in current week
          if (thisYearBirthday >= startOfWeek && thisYearBirthday <= endOfWeek) {
            const isToday = thisYearBirthday.toDateString() === today.toDateString();
            
            weekBirthdays.push({
              ...person,
              isToday
            });

            // Check if current user has birthday today
            if (isToday && person.id === profile?.id) {
              setIsUserBirthday(true);
              // Show birthday toast
              toast({
                title: "🎉 Feliz Aniversário!",
                description: "Desejamos um dia maravilhoso e um ano repleto de conquistas!",
                duration: 6000,
              });
            }
          }
        }
      });

      // Sort by date (today first, then by date)
      weekBirthdays.sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
      });

      setBirthdayPeople(weekBirthdays);
    } catch (error) {
      console.error('Error fetching birthday people:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBirthday = (dateString: string, isToday: boolean) => {
    const date = new Date(dateString);
    if (isToday) return 'Hoje!';
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const thisYearBirthday = new Date(currentYear, date.getMonth(), date.getDate());
    
    return thisYearBirthday.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return '👨‍🎓';
      case 'teacher': 
      case 'instructor': return '👨‍🏫';
      case 'admin': return '👨‍💼';
      case 'secretary': return '👩‍💼';
      case 'coordinator': return '👨‍💼';
      case 'tutor': return '👨‍🏫';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            Aniversariantes da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Carregando aniversariantes...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-[var(--shadow-card)] ${isUserBirthday ? 'border-pink-500 border-2' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-pink-500" />
          Aniversariantes da Semana
          {isUserBirthday && <PartyPopper className="h-5 w-5 text-yellow-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isUserBirthday && (
          <div className="mb-4 p-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-pink-500" />
              <div>
                <h3 className="font-semibold text-pink-700 dark:text-pink-300">
                  🎉 Feliz Aniversário, {profile?.name}!
                </h3>
                <p className="text-sm text-pink-600 dark:text-pink-400">
                  Que este novo ano de vida seja repleto de conquistas e alegrias!
                </p>
              </div>
            </div>
          </div>
        )}

        {birthdayPeople.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum aniversariante esta semana</p>
          </div>
        ) : (
          <div className="space-y-3">
            {birthdayPeople.map((person) => (
              <div
                key={person.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  person.isToday
                    ? 'bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {person.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{person.name}</p>
                      <span className="text-sm">{getRoleIcon(person.role)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {person.role === 'student' ? 'Aluno' : 
                       person.role === 'teacher' || person.role === 'instructor' ? 'Instrutor' :
                       person.role === 'admin' ? 'Administrador' :
                       person.role === 'secretary' ? 'Secretaria' :
                       person.role === 'coordinator' ? 'Coordenador' :
                       person.role === 'tutor' ? 'Tutor' : person.role}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={person.isToday ? "default" : "outline"} 
                    className={person.isToday ? "bg-pink-500 hover:bg-pink-600" : ""}
                  >
                    {person.isToday && <PartyPopper className="w-3 h-3 mr-1" />}
                    {formatBirthday(person.birth_date, person.isToday)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};