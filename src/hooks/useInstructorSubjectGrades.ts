import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GradeRecord {
  value: number;
  max_value: number;
  date: string;
  type: string;
  observations?: string;
}

export interface StudentGradeRow {
  student_id: string;
  student_name: string;
  student_number: string;
  grades_by_type: Record<string, GradeRecord[]>;
  average: number;
  status: 'approved' | 'failed' | 'pending';
  total_grades: number;
}

export interface GradesMatrix {
  students: StudentGradeRow[];
  evaluationTypes: string[];
  loading: boolean;
  error: string | null;
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  enrollment_number: string;
}

interface Grade {
  id: string;
  student_id: string;
  value: number;
  max_value: number;
  date: string;
  type: string;
  observations?: string;
}

export const useInstructorSubjectGrades = (
  subjectId: string | null,
  classId: string | null
): GradesMatrix & { refetch: () => Promise<void> } => {
  const [students, setStudents] = useState<StudentGradeRow[]>([]);
  const [evaluationTypes, setEvaluationTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!subjectId || !classId) {
      setStudents([]);
      setEvaluationTypes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar alunos da turma
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, student_id, enrollment_number')
        .eq('class_id', classId)
        .order('name');

      if (studentsError) throw studentsError;

      // 2. Buscar notas da disciplina
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('id, student_id, value, max_value, date, type, observations')
        .eq('subject_id', subjectId)
        .order('date', { ascending: true });

      if (gradesError) throw gradesError;

      // 3. Transformar em matriz
      const transformedData = transformToMatrix(
        studentsData as Student[] || [],
        gradesData as Grade[] || []
      );

      setStudents(transformedData.students);
      setEvaluationTypes(transformedData.evaluationTypes);
    } catch (err: any) {
      console.error('Error fetching grades matrix:', err);
      setError(err.message);
      setStudents([]);
      setEvaluationTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectId, classId]);

  return {
    students,
    evaluationTypes,
    loading,
    error,
    refetch: fetchData
  };
};

const transformToMatrix = (
  students: Student[],
  grades: Grade[]
): { students: StudentGradeRow[]; evaluationTypes: string[] } => {
  // Extrair tipos de avaliação únicos e ordenar
  const evaluationTypes = [...new Set(grades.map(g => g.type))].sort();

  // Criar mapa de notas por estudante e tipo
  const gradesMap = new Map<string, Map<string, GradeRecord[]>>();

  grades.forEach(grade => {
    if (!gradesMap.has(grade.student_id)) {
      gradesMap.set(grade.student_id, new Map());
    }
    const studentGrades = gradesMap.get(grade.student_id)!;
    
    if (!studentGrades.has(grade.type)) {
      studentGrades.set(grade.type, []);
    }
    
    studentGrades.get(grade.type)!.push({
      value: grade.value,
      max_value: grade.max_value,
      date: grade.date,
      type: grade.type,
      observations: grade.observations
    });
  });

  // Criar linhas da matriz
  const studentRows = students.map(student => {
    const studentGrades = gradesMap.get(student.id) || new Map();
    const grades_by_type: Record<string, GradeRecord[]> = {};

    let totalPoints = 0;
    let totalMaxPoints = 0;
    let totalGrades = 0;

    evaluationTypes.forEach(type => {
      const typeGrades = studentGrades.get(type) || [];
      grades_by_type[type] = typeGrades;
      
      typeGrades.forEach(grade => {
        totalPoints += grade.value;
        totalMaxPoints += grade.max_value;
        totalGrades++;
      });
    });

    const average = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 10 : 0;
    const status: 'approved' | 'failed' | 'pending' = totalGrades === 0 
      ? 'pending' 
      : average >= 7.0 
        ? 'approved' 
        : 'failed';

    return {
      student_id: student.id,
      student_name: student.name,
      student_number: student.student_id || student.enrollment_number || '',
      grades_by_type,
      average,
      status,
      total_grades: totalGrades
    };
  });

  return {
    students: studentRows,
    evaluationTypes
  };
};
