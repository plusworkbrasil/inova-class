import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReportData {
  attendanceByMonth: Array<{ month: string; presente: number; falta: number }>;
  gradesBySubject: Array<{ subject: string; average: number }>;
  classDistribution: Array<{ name: string; value: number; color: string }>;
  topAbsentStudents: Array<{ name: string; class: string; absences: number; percentage: number }>;
  evasionData: Array<{ name: string; value: number; color: string }>;
}

export const useReportsData = () => {
  const [data, setData] = useState<ReportData>({
    attendanceByMonth: [],
    gradesBySubject: [],
    classDistribution: [],
    topAbsentStudents: [],
    evasionData: []
  });
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Fetch attendance data
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*');

      // Fetch grades data
      const { data: grades } = await supabase
        .from('grades')
        .select('*, subjects(name)');

      // Fetch classes data
      const { data: classes } = await supabase
        .from('classes')
        .select('*');

      // Fetch profiles (students) data
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          classes(name),
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'student');

      // Fetch evasions data
      const { data: evasions } = await supabase
        .from('evasions')
        .select('*');

      // Process attendance by month
      const attendanceByMonth = attendance ? processAttendanceByMonth(attendance) : [];

      // Process grades by subject
      const gradesBySubject = grades ? processGradesBySubject(grades) : [];

      // Process class distribution
      const classDistribution = classes && profiles ? processClassDistribution(classes, profiles) : [];

      // Process top absent students
      const topAbsentStudents = attendance && profiles ? processTopAbsentStudents(attendance, profiles) : [];

      // Process evasion data
      const evasionData = evasions ? processEvasionData(evasions) : [];

      setData({
        attendanceByMonth,
        gradesBySubject,
        classDistribution,
        topAbsentStudents,
        evasionData
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
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    const classCount: Record<string, number> = {};

    profiles.forEach(profile => {
      const className = profile.classes?.name || 'Sem Turma';
      classCount[className] = (classCount[className] || 0) + 1;
    });

    return Object.entries(classCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const processTopAbsentStudents = (attendance: any[], profiles: any[]) => {
    const studentAbsences: Record<string, { absences: number; total: number; name: string; class: string }> = {};

    attendance.forEach(record => {
      if (!studentAbsences[record.student_id]) {
        const student = profiles.find(p => p.id === record.student_id);
        studentAbsences[record.student_id] = {
          absences: 0,
          total: 0,
          name: student?.name || 'Aluno Desconhecido',
          class: student?.classes?.name || 'Sem Turma'
        };
      }
      
      studentAbsences[record.student_id].total++;
      if (!record.is_present) {
        studentAbsences[record.student_id].absences++;
      }
    });

    return Object.values(studentAbsences)
      .map(student => ({
        name: student.name,
        class: student.class,
        absences: student.absences,
        percentage: parseFloat(((student.absences / student.total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 10);
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

  useEffect(() => {
    fetchReportsData();
  }, []);

  return {
    data,
    loading,
    refetch: fetchReportsData
  };
};