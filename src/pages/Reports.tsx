import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, Users, AlertTriangle, File, FileSpreadsheet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const { toast } = useToast();
  
  const attendanceData = [
    { month: 'Jan', presente: 85, falta: 15 },
    { month: 'Fev', presente: 88, falta: 12 },
    { month: 'Mar', presente: 82, falta: 18 },
    { month: 'Abr', presente: 90, falta: 10 },
    { month: 'Mai', presente: 87, falta: 13 },
    { month: 'Jun', presente: 89, falta: 11 },
  ];

  const gradeData = [
    { subject: 'Matemática', average: 7.5 },
    { subject: 'Português', average: 8.2 },
    { subject: 'História', average: 7.8 },
    { subject: 'Geografia', average: 8.0 },
    { subject: 'Ciências', average: 7.3 },
  ];

  const classDistribution = [
    { name: '1º Ano A', value: 28, color: '#8884d8' },
    { name: '2º Ano B', value: 32, color: '#82ca9d' },
    { name: '3º Ano A', value: 25, color: '#ffc658' },
    { name: '1º Ano C', value: 20, color: '#ff7c7c' },
  ];

  const topAbsentStudents = [
    { name: 'João Silva', class: '1º Ano A', absences: 8, percentage: 20 },
    { name: 'Maria Santos', class: '2º Ano B', absences: 7, percentage: 17.5 },
    { name: 'Pedro Costa', class: '1º Ano A', absences: 6, percentage: 15 },
    { name: 'Ana Oliveira', class: '3º Ano A', absences: 5, percentage: 12.5 },
  ];

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
    // Gerar conteúdo HTML estruturado para impressão/PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório Escolar</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-card { text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
        .generated-at { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório Acadêmico</h1>
        <p>Sistema Escolar - Inova Class</p>
        <p>Data de Geração: ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>

    <div class="section">
        <h2>Resumo Estatístico</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>Frequência Média</h3>
                <p><strong>87%</strong></p>
            </div>
            <div class="stat-card">
                <h3>Média Geral</h3>
                <p><strong>7.8</strong></p>
            </div>
            <div class="stat-card">
                <h3>Alunos em Risco</h3>
                <p><strong>12</strong></p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Frequência Mensal</h2>
        <table>
            <thead>
                <tr><th>Mês</th><th>Presentes (%)</th><th>Faltas (%)</th></tr>
            </thead>
            <tbody>
                ${attendanceData.map(item => `
                    <tr>
                        <td>${item.month}</td>
                        <td>${item.presente}%</td>
                        <td>${item.falta}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Médias por Disciplina</h2>
        <table>
            <thead>
                <tr><th>Disciplina</th><th>Média</th></tr>
            </thead>
            <tbody>
                ${gradeData.map(item => `
                    <tr>
                        <td>${item.subject}</td>
                        <td>${item.average}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Alunos com Maior Número de Faltas</h2>
        <table>
            <thead>
                <tr><th>Aluno</th><th>Turma</th><th>Faltas</th><th>Percentual</th></tr>
            </thead>
            <tbody>
                ${topAbsentStudents.map(student => `
                    <tr>
                        <td>${student.name}</td>
                        <td>${student.class}</td>
                        <td>${student.absences}</td>
                        <td>${student.percentage}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="generated-at">
        <p>Relatório gerado automaticamente pelo sistema em ${new Date().toLocaleString('pt-BR')}</p>
        <p>Sistema desenvolvido por: PlusWork.com.br</p>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Abrir em nova janela para impressão como PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
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
          description: "Arquivo HTML baixado e janela de impressão aberta para gerar PDF.",
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

  return (
    <Layout userRole="admin" userName="Admin" userAvatar="">
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
                  <p className="text-sm font-medium text-muted-foreground">Total de Relatórios</p>
                  <p className="text-3xl font-bold text-primary">24</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Frequência Média</p>
                  <p className="text-3xl font-bold text-success">87%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                  <p className="text-3xl font-bold text-info">7.8</p>
                </div>
                <TrendingUp className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alunos em Risco</p>
                  <p className="text-3xl font-bold text-warning">12</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Média de Notas por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Alunos por Turma</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
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
                  {topAbsentStudents.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{student.absences}</Badge>
                      </TableCell>
                      <TableCell>{student.percentage}%</TableCell>
                    </TableRow>
                  ))}
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