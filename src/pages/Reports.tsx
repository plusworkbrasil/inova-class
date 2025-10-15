import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, Users, AlertTriangle, File, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import html2pdf from 'html2pdf.js';
import { useReportsData } from '@/hooks/useReportsData';
import { useReportsMetrics } from '@/hooks/useReportsMetrics';

const Reports = () => {
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [userName, setUserName] = useState('Usuário');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: reportsData, loading: reportsLoading } = useReportsData();
  const { metrics, loading: metricsLoading } = useReportsMetrics();

  // Removed localStorage role storage for security
  
  // Use dados reais do banco de dados
  const attendanceData = reportsData.attendanceByMonth;
  const gradeData = reportsData.gradesBySubject;
  const classDistribution = reportsData.classDistribution;
  const topAbsentStudents = reportsData.topAbsentStudents;
  const evasionData = reportsData.evasionData;

  const generateCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async (filename: string) => {
    try {
      // Criar um container temporário para o conteúdo do PDF
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Relatório Acadêmico</h1>
            <p style="margin: 5px 0;">Sistema Escolar - Inova Class</p>
            <p style="margin: 5px 0;">Data de Geração: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Resumo Estatístico</h2>
            <div style="display: flex; justify-content: space-around; margin: 20px 0;">
              <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
                <h3>Frequência Média</h3>
                <p><strong>87%</strong></p>
              </div>
              <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
                <h3>Média Geral</h3>
                <p><strong>7.8</strong></p>
              </div>
              <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
                <h3>Alunos em Risco</h3>
                <p><strong>12</strong></p>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Frequência Mensal</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Mês</th>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Presentes (%)</th>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Faltas (%)</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceData.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.month}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.presente}%</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.falta}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Médias por Disciplina</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Disciplina</th>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Média</th>
                </tr>
              </thead>
              <tbody>
                ${gradeData.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.subject}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.average}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Alunos com Maior Número de Faltas</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Aluno</th>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Turma</th>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Faltas</th>
                  <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${topAbsentStudents.map(student => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${student.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${student.class}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${student.absences}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${student.percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            <p>Relatório gerado automaticamente pelo sistema em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Sistema desenvolvido por: PlusWork.com.br</p>
          </div>
        </div>
      `;

      // Configurações do html2pdf
      const options = {
        margin: 1,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Gerar e baixar o PDF
      await html2pdf().set(options).from(element).save();

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'csv':
        generateCSV(topAbsentStudents, `relatorio-faltas-${timestamp}`);
        toast({
          title: "Relatório exportado!",
          description: "Arquivo CSV baixado com sucesso.",
        });
        break;
      case 'pdf':
        generatePDF(`relatorio-completo-${timestamp}`);
        toast({
          title: "Relatório exportado!",
          description: "Arquivo PDF gerado e baixado com sucesso.",
        });
        break;
      case 'excel':
        generateCSV(gradeData, `relatorio-notas-${timestamp}`);
        toast({
          title: "Relatório exportado!",
          description: "Arquivo Excel compatível baixado com sucesso.",
        });
        break;
    }
  };

  const handleStudentClick = (studentName: string) => {
    // Simular ID do aluno baseado no nome para navegação
    const studentId = studentName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/student-dashboard/${studentId}`, { 
      state: { studentName, returnTo: '/reports' } 
    });
  };

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Download size={16} />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText size={16} className="mr-2" />
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet size={16} className="mr-2" />
                  Exportar como Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <File size={16} className="mr-2" />
                  Exportar como CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alunos Matriculados</p>
                  <p className="text-3xl font-bold text-primary">{metricsLoading ? '...' : metrics.studentsEnrolled}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alunos Frequentando</p>
                  <p className="text-3xl font-bold text-success">{metricsLoading ? '...' : metrics.studentsAttending}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alunos Evadidos</p>
                  <p className="text-3xl font-bold text-destructive">{metricsLoading ? '...' : metrics.studentsEvaded}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média de Frequência</p>
                  <p className="text-3xl font-bold text-info">{metricsLoading ? '...' : `${metrics.averageAttendanceRate}%`}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média Geral das Turmas</p>
                  <p className="text-3xl font-bold text-primary">{metricsLoading ? '...' : metrics.generalGradeAverage}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média de Alunos por Turma</p>
                  <p className="text-3xl font-bold text-success">{metricsLoading ? '...' : metrics.averageStudentsPerClass}</p>
                </div>
                <Users className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turma com Menos Alunos</p>
                  <p className="text-2xl font-bold text-warning">{metricsLoading ? '...' : metrics.classWithFewerStudents.name}</p>
                  <p className="text-sm text-muted-foreground">({metricsLoading ? '...' : metrics.classWithFewerStudents.count} alunos)</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turma com Mais Alunos</p>
                  <p className="text-2xl font-bold text-info">{metricsLoading ? '...' : metrics.classWithMoreStudents.name}</p>
                  <p className="text-sm text-muted-foreground">({metricsLoading ? '...' : metrics.classWithMoreStudents.count} alunos)</p>
                </div>
                <TrendingUp className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequência por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando dados...</span>
                </div>
              ) : attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="presente" fill="hsl(var(--success))" />
                    <Bar dataKey="falta" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Nenhum dado de frequência encontrado
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Média de Notas por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando dados...</span>
                </div>
              ) : gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Nenhum dado de notas encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Alunos por Turma</CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando dados...</span>
                </div>
              ) : classDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={classDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Nenhum dado de distribuição de turmas encontrado
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/evasions')}
                className="w-full"
              >
                <ExternalLink size={14} className="mr-2" />
                Ver Lista Completa de Alunos por Turma
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Evasão</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={evasionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {evasionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/evasions')}
                className="w-full"
              >
                <ExternalLink size={14} className="mr-2" />
                Ver Lista Completa de Evasões
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alunos com Maior Número de Faltas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Lista dos alunos com maior número de ausências
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-1"
                >
                  <Download size={14} />
                  Exportar Lista
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Faltas</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                 <TableBody>
                   {reportsLoading ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-6">
                         <div className="flex items-center justify-center">
                           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                           <span className="ml-2">Carregando dados...</span>
                         </div>
                       </TableCell>
                     </TableRow>
                   ) : topAbsentStudents.length > 0 ? (
                     topAbsentStudents.map((student, index) => (
                       <TableRow key={index}>
                         <TableCell className="font-medium">
                           <button
                             onClick={() => handleStudentClick(student.name)}
                             className="text-primary hover:text-primary/80 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                           >
                             {student.name}
                             <ExternalLink size={12} />
                           </button>
                         </TableCell>
                         <TableCell>{student.class}</TableCell>
                         <TableCell>
                           <Badge variant="destructive">{student.absences}</Badge>
                         </TableCell>
                         <TableCell>{student.percentage}%</TableCell>
                       </TableRow>
                     ))
                   ) : (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                         Nenhum dado de faltas encontrado no sistema
                       </TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;