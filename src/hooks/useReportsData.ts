import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReportData {
  attendanceByMonth: Array<{ month: string; presente: number; falta: number }>;
  attendanceTotals: Array<{ name: string; value: number; count: number; color: string }>;
  gradesBySubject: Array<{ subject: string; average: number }>;
  classDistribution: Array<{ name: string; value: number; color: string }>;
  topAbsentStudents: Array<{ student_id: string; name: string; class: string; absences: number; percentage: number; studentId: string }>;
  topAbsentStudentsPeriod?: string;
  evasionData: Array<{ name: string; value: number; color: string }>;
  activeSubjects: Array<{ 
    subjectName: string; 
    className: string; 
    code: string;
    endDate: string; 
    teacherName: string;
    color: string;
  }>;
}

export const useReportsData = () => {
  const [data, setData] = useState<ReportData>({
    attendanceByMonth: [],
    attendanceTotals: [],
    gradesBySubject: [],
    classDistribution: [],
    topAbsentStudents: [],
    evasionData: [],
    activeSubjects: []
  });
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      console.log('🔍 [useReportsData] Iniciando busca de dados de relatórios...');

      // Verificar role do usuário
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        console.log('🔒 [useReportsData] User role:', roleData?.role);
      }

      // Calcular data de 7 dias atrás
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString().split('T')[0];
      console.log('📅 [useReportsData] Filtrando faltas desde:', sevenDaysAgoISO);

      // Fetch attendance data
      console.log('🔍 [useReportsData] Buscando dados de frequência...');
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*');
      
      if (attendanceError) {
        console.error('❌ [useReportsData] Erro ao buscar frequência:', attendanceError.message);
      } else {
        console.log(`✅ [useReportsData] Frequência carregada: ${attendance?.length || 0} registros`);
      }

      // Fetch attendance data for last 7 days (for top absent students)
      console.log('🔍 [useReportsData] Buscando frequência dos últimos 7 dias...');
      const { data: attendanceLast7Days, error: attendanceLast7DaysError } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', sevenDaysAgoISO);
      
      if (attendanceLast7DaysError) {
        console.error('❌ [useReportsData] Erro ao buscar frequência dos últimos 7 dias:', attendanceLast7DaysError.message);
      } else {
        console.log(`✅ [useReportsData] Frequência dos últimos 7 dias: ${attendanceLast7Days?.length || 0} registros`);
      }

      // Fetch grades data
      const { data: grades } = await supabase
        .from('grades')
        .select('*, subjects(name)');

      // Fetch classes data
      console.log('🔍 [useReportsData] Buscando turmas...');
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*');
      
      if (classesError) {
        console.error('❌ [useReportsData] Erro ao buscar turmas:', classesError.message);
      } else {
        console.log(`✅ [useReportsData] Turmas carregadas: ${classes?.length || 0}`);
      }

      // Fetch profiles (students) data com error handling robusto
      console.log('🔍 [useReportsData] Buscando profiles com classes...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          student_id,
          auto_student_id,
          class_id,
          status,
          classes!profiles_class_id_fkey(name)
        `);

      if (profilesError) {
        console.error('❌ [useReportsData] Erro ao buscar profiles:', {
          message: profilesError.message,
          code: profilesError.code,
          details: profilesError.details
        });
      }

      console.log(`✅ [useReportsData] Profiles carregados: ${profiles?.length || 0} registros`);
      console.log('📊 [useReportsData] Exemplo de profile com classes:', profiles?.[0]);

      // Fetch evasions data
      const { data: evasions } = await supabase
        .from('evasions')
        .select('*');

      // Fetch subjects data
      const { data: subjects } = await supabase
        .from('subjects')
        .select(`
          *,
          classes!subjects_class_id_fkey(name),
          profiles!subjects_teacher_id_fkey(name)
        `);

      // Process attendance by month
      const attendanceByMonth = attendance ? processAttendanceByMonth(attendance) : [];

      // Process attendance totals
      const attendanceTotals = attendance ? processAttendanceTotals(attendance) : [];

      // Process grades by subject
      const gradesBySubject = grades ? processGradesBySubject(grades) : [];

      // Process class distribution
      const classDistribution = classes && profiles ? processClassDistribution(classes, profiles) : [];
      console.log(`📊 [useReportsData] Class Distribution processado: ${classDistribution.length} turmas`);
      console.log('📊 [useReportsData] Amostra:', classDistribution.slice(0, 3));

      // Process top absent students
      const topAbsentStudents = attendanceLast7Days && profiles ? processTopAbsentStudents(attendanceLast7Days, profiles) : [];
      console.log(`📊 [useReportsData] Top Absent Students: ${topAbsentStudents.length} alunos`);
      console.log('📊 [useReportsData] Amostra:', topAbsentStudents.slice(0, 3));

      // Process evasion data
      const evasionData = evasions ? processEvasionData(evasions) : [];

      // Process active subjects
      const activeSubjects = subjects ? processActiveSubjects(subjects) : [];

      setData({
        attendanceByMonth,
        attendanceTotals,
        gradesBySubject,
        classDistribution,
        topAbsentStudents,
        topAbsentStudentsPeriod: 'Últimos 7 dias',
        evasionData,
        activeSubjects
      });
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendanceByMonth = (attendance: any[]) => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData: Record<string, { present: number; absent: number; total: number }> = {};

    attendance.forEach(record => {
      const date = new Date(record.date);
      const monthKey = monthNames[date.getMonth()];
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { present: 0, absent: 0, total: 0 };
      }
      
      monthlyData[monthKey].total++;
      if (record.is_present) {
        monthlyData[monthKey].present++;
      } else {
        monthlyData[monthKey].absent++;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      presente: Math.round((data.present / data.total) * 100) || 0,
      falta: Math.round((data.absent / data.total) * 100) || 0
    }));
  };

  const processAttendanceTotals = (attendance: any[]) => {
    const totals = attendance.reduce((acc, record) => {
      if (record.is_present) {
        acc.presente++;
      } else {
        acc.falta++;
      }
      return acc;
    }, { presente: 0, falta: 0 });

    const total = totals.presente + totals.falta;
    
    return total > 0 ? [
      {
        name: 'Presentes',
        value: Math.round((totals.presente / total) * 100),
        count: totals.presente,
        color: '#10B981'
      },
      {
        name: 'Faltas',
        value: Math.round((totals.falta / total) * 100),
        count: totals.falta,
        color: '#EF4444'
      }
    ] : [];
  };

  const processGradesBySubject = (grades: any[]) => {
    const subjectGrades: Record<string, number[]> = {};

    grades.forEach(grade => {
      const subjectName = grade.subjects?.name || 'Sem Disciplina';
      if (!subjectGrades[subjectName]) {
        subjectGrades[subjectName] = [];
      }
      subjectGrades[subjectName].push(parseFloat(grade.value));
    });

    return Object.entries(subjectGrades).map(([subject, gradesList]) => ({
      subject,
      average: parseFloat((gradesList.reduce((sum, grade) => sum + grade, 0) / gradesList.length).toFixed(1))
    }));
  };

  const processClassDistribution = (classes: any[], profiles: any[]) => {
    console.log('🔄 [processClassDistribution] Iniciando processamento...');
    console.log('📊 [processClassDistribution] Total profiles:', profiles.length);
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    const classCount: Record<string, number> = {};

    profiles.forEach(profile => {
      // Tentar múltiplos formatos de acesso ao nome da turma
      let className = 'Sem Turma';
      
      if (profile.classes && typeof profile.classes === 'object' && profile.classes.name) {
        className = profile.classes.name;
      } else if (profile.class_name) {
        className = profile.class_name;
      }
      
      classCount[className] = (classCount[className] || 0) + 1;
    });

    console.log('📊 [processClassDistribution] Contagem por turma:', classCount);

    const result = Object.entries(classCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
    
    console.log('✅ [processClassDistribution] Resultado final:', result.length, 'turmas');
    return result;
  };

  const processTopAbsentStudents = (attendance: any[], profiles: any[]) => {
    console.log('🔄 [processTopAbsentStudents] Iniciando processamento...');
    console.log('📊 [processTopAbsentStudents] Total attendance:', attendance.length);
    console.log('📊 [processTopAbsentStudents] Total profiles:', profiles.length);
    
    const studentAbsences: Record<string, { student_id: string; absences: number; total: number; name: string; class: string; studentId: string }> = {};

    attendance.forEach(record => {
      if (!studentAbsences[record.student_id]) {
        // Buscar dados do aluno no array profiles que TEM o JOIN com classes
        const studentData = profiles.find(p => p.id === record.student_id);
        
        if (!studentData) {
          console.warn(`⚠️ [processTopAbsentStudents] Aluno não encontrado: ${record.student_id}`);
          return; // Pular este registro
        }
        
        // Acesso correto ao nome da turma: classes retorna como objeto ou null do JOIN
        let className = 'Sem Turma';
        if (studentData?.classes && typeof studentData.classes === 'object') {
          className = studentData.classes.name || 'Sem Turma';
        }
        
        // ID amigável: prioriza student_id, depois auto_student_id formatado
        const studentId = studentData?.student_id || 
                         (studentData?.auto_student_id ? `#${studentData.auto_student_id}` : 'S/N');
        
        studentAbsences[record.student_id] = {
          student_id: record.student_id,
          absences: 0,
          total: 0,
          name: studentData?.name || 'Aluno Desconhecido',
          class: className,
          studentId: studentId
        };
      }
      
      studentAbsences[record.student_id].total++;
      if (!record.is_present) {
        studentAbsences[record.student_id].absences++;
      }
    });

    console.log('📊 [processTopAbsentStudents] Total alunos com registros:', Object.keys(studentAbsences).length);

    const result = Object.values(studentAbsences)
      .filter(student => student.absences > 0) // Apenas alunos com faltas
      .map(student => ({
        student_id: student.student_id,
        name: student.name,
        class: student.class,
        absences: student.absences,
        percentage: parseFloat(((student.absences / student.total) * 100).toFixed(1)),
        studentId: student.studentId
      }))
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 10);
    
    console.log('✅ [processTopAbsentStudents] Top alunos com faltas:', result.length);
    console.log('📊 [processTopAbsentStudents] Amostra:', result.slice(0, 3));
    
    return result;
  };

  const processEvasionData = (evasions: any[]) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#fd9644'];
    const reasonCount: Record<string, number> = {};

    evasions.forEach(evasion => {
      reasonCount[evasion.reason] = (reasonCount[evasion.reason] || 0) + 1;
    });

    const total = evasions.length;
    return Object.entries(reasonCount).map(([name, count], index) => ({
      name,
      value: Math.round((count / total) * 100),
      color: colors[index % colors.length]
    }));
  };

  const processActiveSubjects = (subjects: any[]) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    const today = new Date();
    
    return subjects
      .filter(subject => {
        if (!subject.start_date || !subject.end_date) return false;
        const startDate = new Date(subject.start_date);
        const endDate = new Date(subject.end_date);
        return subject.status === 'ativo' && startDate <= today && endDate >= today;
      })
      .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
      .map((subject, index) => ({
        subjectName: subject.name,
        className: subject.classes?.name || 'Sem Turma',
        code: subject.code || '-',
        endDate: new Date(subject.end_date).toLocaleDateString('pt-BR'),
        teacherName: subject.profiles?.name || 'Sem Instrutor',
        color: colors[index % colors.length]
      }));
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  return {
    data,
    loading,
    refetch: fetchReportsData
  };
};