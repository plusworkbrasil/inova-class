import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é admin
    const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
    
    if (roleData !== 'admin') {
      console.error('Access denied: user is not admin');
      return new Response(JSON.stringify({ error: 'Access denied. Admin only.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { period, classId, analysisDate } = await req.json();
    
    console.log('Analyzing data for:', { period, classId, analysisDate });

    // Calcular data de início baseado no período
    const referenceDate = analysisDate ? new Date(analysisDate) : new Date();
    const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - periodDays);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = referenceDate.toISOString().split('T')[0];

    console.log('Date range:', startDateStr, 'to', endDateStr);

    // Buscar turmas para mapear nomes
    const { data: classesData } = await supabase
      .from('classes')
      .select('id, name');
    
    const classMap = new Map((classesData || []).map(c => [c.id, c.name]));

    // 1. Buscar frequência
    let attendanceQuery = supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(name, class_id),
        subject:subjects(name, class_id)
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (classId) {
      attendanceQuery = attendanceQuery.eq('class_id', classId);
    }

    const { data: attendanceData, error: attendanceError } = await attendanceQuery;
    
    if (attendanceError) {
      console.error('Attendance error:', attendanceError);
    }

    // 2. Buscar notas
    let gradesQuery = supabase
      .from('grades')
      .select(`
        *,
        student:profiles!grades_student_id_fkey(name, class_id),
        subject:subjects(name, class_id)
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    const { data: gradesData, error: gradesError } = await gradesQuery;
    
    if (gradesError) {
      console.error('Grades error:', gradesError);
    }

    // Filtrar por turma se necessário
    const filteredGrades = classId 
      ? gradesData?.filter(g => g.student?.class_id === classId)
      : gradesData;

    // 3. Buscar evasões
    let evasionsQuery = supabase
      .from('evasions')
      .select(`
        *,
        student:profiles(name, class_id)
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (classId) {
      evasionsQuery = evasionsQuery.eq('class_id', classId);
    }

    const { data: evasionsData, error: evasionsError } = await evasionsQuery;
    
    if (evasionsError) {
      console.error('Evasions error:', evasionsError);
    }

    // 4. Buscar disciplinas ativas sem lançamento nos últimos 5 dias
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

    let activeSubjectsQuery = supabase
      .from('subjects')
      .select(`
        *,
        instructor:profiles!subjects_teacher_id_fkey(name),
        class:classes(name)
      `)
      .lte('start_date', endDateStr)
      .gte('end_date', endDateStr);

    if (classId) {
      activeSubjectsQuery = activeSubjectsQuery.eq('class_id', classId);
    }

    const { data: activeSubjects } = await activeSubjectsQuery;

    // Buscar lançamentos recentes
    const { data: recentAttendance } = await supabase
      .from('attendance')
      .select('subject_id')
      .gte('created_at', fiveDaysAgoStr);

    const recentSubjectIds = new Set(recentAttendance?.map(a => a.subject_id) || []);
    const pendingSubjects = activeSubjects?.filter(s => !recentSubjectIds.has(s.id)) || [];

    // Processar dados de frequência
    const attendanceStats = {
      total: attendanceData?.length || 0,
      present: attendanceData?.filter(a => a.status === 'present')?.length || 0,
      absent: attendanceData?.filter(a => a.status === 'absent')?.length || 0,
      rate: 0
    };
    
    if (attendanceStats.total > 0) {
      attendanceStats.rate = (attendanceStats.present / attendanceStats.total) * 100;
    }

    // Identificar alunos com muitas faltas (incluindo turma)
    const studentAbsences: Record<string, { name: string; classId: string; className: string; absences: number; total: number }> = {};
    
    attendanceData?.forEach(record => {
      if (record.student) {
        const studentId = record.student_id;
        if (!studentAbsences[studentId]) {
          const studentClassId = record.student.class_id || '';
          studentAbsences[studentId] = { 
            name: record.student.name, 
            classId: studentClassId,
            className: classMap.get(studentClassId) || 'Sem Turma',
            absences: 0, 
            total: 0 
          };
        }
        studentAbsences[studentId].total++;
        if (!record.is_present) {
          studentAbsences[studentId].absences++;
        }
      }
    });

    const studentsAtRisk = Object.entries(studentAbsences)
      .filter(([_, data]) => data.total > 0 && (data.absences / data.total) > 0.25)
      .map(([id, data]) => ({
        name: data.name,
        className: data.className,
        absenceRate: ((data.absences / data.total) * 100).toFixed(1)
      }))
      .sort((a, b) => parseFloat(b.absenceRate) - parseFloat(a.absenceRate))
      .slice(0, 10); // Top 10 alunos em risco

    // Processar notas
    const studentGrades: Record<string, { name: string; grades: number[]; subjects: string[] }> = {};
    
    filteredGrades?.forEach(grade => {
      if (grade.student) {
        const studentId = grade.student_id;
        if (!studentGrades[studentId]) {
          studentGrades[studentId] = { 
            name: grade.student.name, 
            grades: [], 
            subjects: [] 
          };
        }
        const gradeValue = (grade.value / grade.max_value) * 10;
        studentGrades[studentId].grades.push(gradeValue);
        if (grade.subject) {
          studentGrades[studentId].subjects.push(grade.subject.name);
        }
      }
    });

    const studentsWithLowGrades = Object.entries(studentGrades)
      .filter(([_, data]) => {
        const avg = data.grades.reduce((a, b) => a + b, 0) / data.grades.length;
        return avg < 6.0;
      })
      .map(([id, data]) => ({
        name: data.name,
        average: (data.grades.reduce((a, b) => a + b, 0) / data.grades.length).toFixed(1)
      }));

    const overallAverage = Object.values(studentGrades).length > 0
      ? Object.values(studentGrades)
          .map(s => s.grades.reduce((a, b) => a + b, 0) / s.grades.length)
          .reduce((a, b) => a + b, 0) / Object.values(studentGrades).length
      : 0;

    // Processar evasões
    const evasionsByReason: Record<string, number> = {};
    evasionsData?.forEach(evasion => {
      const reason = evasion.reason || 'Não informado';
      evasionsByReason[reason] = (evasionsByReason[reason] || 0) + 1;
    });

    // Montar dados para a IA
    const analysisData = {
      period: period === 'day' ? 'Dia' : period === 'week' ? 'Semana' : 'Mês',
      dateRange: `${startDateStr} a ${endDateStr}`,
      scope: classId ? 'Turma específica' : 'Geral (todas as turmas)',
      attendance: {
        rate: attendanceStats.rate.toFixed(1),
        total: attendanceStats.total,
        present: attendanceStats.present,
        absent: attendanceStats.absent,
        studentsAtRisk: studentsAtRisk
      },
      grades: {
        average: overallAverage.toFixed(1),
        studentsWithLowGrades: studentsWithLowGrades,
        totalStudents: Object.keys(studentGrades).length
      },
      evasions: {
        total: evasionsData?.length || 0,
        byReason: evasionsByReason,
        students: evasionsData?.map(e => e.student?.name).filter(Boolean) || []
      },
      pendingInstructors: pendingSubjects.map(s => ({
        instructor: s.instructor?.name || 'N/A',
        subject: s.name,
        class: s.class?.name || 'N/A'
      }))
    };

    console.log('Analysis data prepared:', JSON.stringify(analysisData, null, 2));

    // Criar prompt para IA
    const systemPrompt = `Você é uma Coordenadora Pedagógica experiente analisando dados educacionais de um programa de formação profissional.

Use linguagem profissional, empática e objetiva da área educacional.
Organize o relatório em seções claras com emojis para melhor visualização.
Seja direta ao apontar problemas mas sugira soluções construtivas.
Use formatação Markdown para melhor legibilidade.`;

    const userPrompt = `PERÍODO ANALISADO: ${analysisData.period} (${analysisData.dateRange})
ESCOPO: ${analysisData.scope}

DADOS COLETADOS:

📊 FREQUÊNCIA:
- Taxa de presença: ${analysisData.attendance.rate}%
- Total de registros: ${analysisData.attendance.total}
- Presenças: ${analysisData.attendance.present}
- Faltas: ${analysisData.attendance.absent}

📈 DESEMPENHO ACADÊMICO:
- Média geral: ${analysisData.grades.average}
- Total de alunos com notas: ${analysisData.grades.totalStudents}
- Alunos com média <6.0: ${analysisData.grades.studentsWithLowGrades.length > 0
  ? analysisData.grades.studentsWithLowGrades.map(s => `${s.name} (média ${s.average})`).join(', ')
  : 'Nenhum'}

🚪 EVASÕES:
- Total de evasões: ${analysisData.evasions.total}
- Motivos: ${Object.entries(analysisData.evasions.byReason).map(([reason, count]) => `${reason} (${count})`).join(', ') || 'N/A'}
- Alunos evadidos: ${analysisData.evasions.students.join(', ') || 'Nenhum'}

👨‍🏫 PENDÊNCIAS ADMINISTRATIVAS:
- Instrutores com disciplinas sem lançamento de frequência há mais de 5 dias: ${analysisData.pendingInstructors.length}
${analysisData.pendingInstructors.length > 0 
  ? analysisData.pendingInstructors.map(p => `  • ${p.instructor} - ${p.subject} (${p.class})`).join('\n')
  : '  Nenhuma pendência'}

INSTRUÇÕES PARA O RELATÓRIO:

IMPORTANTE: Comece SEMPRE com um resumo rápido objetivo de 1-2 linhas destacando os números principais.
Em seguida, liste os alunos em risco de frequência em formato de TABELA markdown.

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

## 🚀 RESUMO RÁPIDO
[1-2 linhas objetivas: Frequência X% | Média X.X | Evasões X | Pendências X]

## ⚠️ ALUNOS EM RISCO DE FREQUÊNCIA
${analysisData.attendance.studentsAtRisk.length > 0 
  ? `| Aluno | Turma | % Faltas |
|-------|-------|----------|
${analysisData.attendance.studentsAtRisk.map(s => `| ${s.name} | ${s.className} | ${s.absenceRate}% |`).join('\n')}`
  : 'Nenhum aluno com frequência crítica no período.'}

## 📊 Resumo Executivo
[Visão geral da situação em 2-3 parágrafos]

## ⚠️ Pontos Críticos
[Liste problemas que necessitam atenção imediata]

## 📈 Análise de Desempenho
[Análise detalhada de frequência e notas]

## 🚪 Análise de Evasão
[Padrões de evasão e possíveis causas]

## 👨‍🏫 Gestão Pedagógica
[Pendências administrativas e sugestões]

## 💡 Recomendações Prioritárias
[Ações sugeridas em ordem de prioridade (máximo 5)]`;

    // Chamar Lovable AI
    console.log('Calling Lovable AI...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Muitas análises em pouco tempo. Por favor, aguarde alguns minutos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos de IA esgotados. Entre em contato com o suporte.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    console.log('Analysis generated successfully');

    return new Response(JSON.stringify({
      analysis,
      metadata: {
        period,
        classId,
        generatedAt: new Date().toISOString(),
        stats: {
          totalStudents: analysisData.grades.totalStudents,
          attendanceRate: parseFloat(analysisData.attendance.rate),
          averageGrade: parseFloat(analysisData.grades.average),
          evasions: analysisData.evasions.total,
          pendingInstructors: analysisData.pendingInstructors.length
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-educational-data:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar análise' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});