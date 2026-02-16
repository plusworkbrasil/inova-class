import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AttendanceStatus = 'present' | 'absent' | null;

export interface StudentAttendanceRow {
  student_id: string;
  student_name: string;
  student_number: string;
  attendance_by_date: Record<string, {
    status: AttendanceStatus;
    justification?: string;
    attendance_id: string;
  }>;
  total_present: number;
  total_absent: number;
  total_recorded: number;
  attendance_percentage: number;
}

export interface AttendanceMatrix {
  students: StudentAttendanceRow[];
  dates: string[];
  loading: boolean;
  error: string | null;
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  enrollment_number: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  is_present: boolean;
  justification?: string;
}

export const useInstructorSubjectAttendance = (
  subjectId: string | null,
  classId: string | null
): AttendanceMatrix & { refetch: () => Promise<void> } => {
  const [students, setStudents] = useState<StudentAttendanceRow[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!subjectId || !classId) {
      setStudents([]);
      setDates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar alunos ATIVOS da turma
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, student_id, enrollment_number')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('name');

      if (studentsError) throw studentsError;

      // 2. Buscar attendance da disciplina
      const { data: attendancesData, error: attendancesError } = await supabase
        .from('attendance')
        .select('id, student_id, date, is_present, justification')
        .eq('subject_id', subjectId)
        .eq('class_id', classId)
        .order('date', { ascending: true });

      if (attendancesError) throw attendancesError;

      // 3. Transformar em matriz
      const transformedData = transformToMatrix(
        studentsData as Student[] || [],
        attendancesData as AttendanceRecord[] || []
      );

      // 4. Filtrar apenas alunos que tiveram ao menos uma presença "C" na disciplina
      const studentsWithPresence = transformedData.students.filter(student => 
        student.total_present > 0
      );

      setStudents(studentsWithPresence);
      setDates(transformedData.dates);
    } catch (err: any) {
      console.error('Error fetching attendance matrix:', err);
      setError(err.message);
      setStudents([]);
      setDates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectId, classId]);

  return {
    students,
    dates,
    loading,
    error,
    refetch: fetchData
  };
};

const transformToMatrix = (
  students: Student[],
  attendances: AttendanceRecord[]
): { students: StudentAttendanceRow[]; dates: string[] } => {
  // Extrair datas únicas e ordenar
  const dates = [...new Set(attendances.map(a => a.date))]
    .sort((a, b) => a.localeCompare(b));

  // Criar mapa de attendance por estudante e data
  const attendanceMap = new Map<string, Map<string, {
    status: AttendanceStatus;
    justification?: string;
    attendance_id: string;
  }>>();

  attendances.forEach(att => {
    if (!attendanceMap.has(att.student_id)) {
      attendanceMap.set(att.student_id, new Map());
    }
    attendanceMap.get(att.student_id)!.set(att.date, {
      status: att.is_present ? 'present' : 'absent',
      justification: att.justification,
      attendance_id: att.id
    });
  });

  // Criar linhas da matriz
  const studentRows = students.map(student => {
    const studentAttendance = attendanceMap.get(student.id) || new Map();
    const attendance_by_date: Record<string, {
      status: AttendanceStatus;
      justification?: string;
      attendance_id: string;
    }> = {};

    let total_present = 0;
    let total_absent = 0;

    dates.forEach(date => {
      const record = studentAttendance.get(date);
      if (record) {
        attendance_by_date[date] = record;
        if (record.status === 'present') total_present++;
        if (record.status === 'absent') total_absent++;
      } else {
        attendance_by_date[date] = {
          status: null,
          attendance_id: ''
        };
      }
    });

    const total_recorded = total_present + total_absent;
    const attendance_percentage = total_recorded > 0
      ? (total_present / total_recorded) * 100
      : 0;

    return {
      student_id: student.id,
      student_name: student.name,
      student_number: student.student_id || student.enrollment_number || '',
      attendance_by_date,
      total_present,
      total_absent,
      total_recorded,
      attendance_percentage
    };
  });

  return {
    students: studentRows,
    dates
  };
};
