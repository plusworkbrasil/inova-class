import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface SecureStudentData {
  id: string;
  name: string;
  student_id: string;
  class_id: string;
  enrollment_number: string;
  status: string;
}

export interface SafeStudentData {
  student_name: string;
  student_number: string;
  class_reference: string;
  enrollment_number: string;
  academic_status: string;
}

export const useSecureStudentAccess = () => {
  const [students, setStudents] = useState<SecureStudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch students that the instructor is authorized to see
  const fetchInstructorStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the secure function that only returns basic student data
      const { data, error } = await supabase.rpc('get_instructor_students');

      if (error) throw error;

      setStudents(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching instructor students:', err);
      toast({
        title: "Erro ao carregar estudantes",
        description: err.message || "Não foi possível carregar os estudantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get safe student data for a specific student
  const getSafeStudentData = async (studentId: string): Promise<SafeStudentData | null> => {
    try {
      const { data, error } = await supabase.rpc('get_safe_student_data', {
        target_student_id: studentId
      });

      if (error) throw error;

      return data && data.length > 0 ? data[0] : null;
    } catch (err: any) {
      console.error('Error fetching safe student data:', err);
      toast({
        title: "Erro ao carregar dados do estudante",
        description: err.message || "Não foi possível carregar os dados do estudante.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get student basic info (name, number, class) for instructor
  const getStudentBasicInfo = async (studentId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_student_basic_info_for_instructor', {
        target_student_id: studentId
      });

      if (error) throw error;

      return data && data.length > 0 ? data[0] : null;
    } catch (err: any) {
      console.error('Error fetching student basic info:', err);
      toast({
        title: "Erro ao carregar informações do estudante",
        description: err.message || "Não foi possível carregar as informações do estudante.",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchInstructorStudents();
  }, []);

  return {
    students,
    loading,
    error,
    fetchInstructorStudents,
    getSafeStudentData,
    getStudentBasicInfo,
    // Security note: This hook only provides access to non-sensitive student data
    // Sensitive information like emails, phone numbers, addresses, CPF, medical conditions,
    // and guardian information is NOT accessible through this interface
  };
};