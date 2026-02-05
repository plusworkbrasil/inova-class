

## Plano: Exportar Gráfico Gantt e Adicionar Filtro por Turma

### Objetivo

Adicionar duas funcionalidades ao gráfico Gantt de disciplinas:
1. **Exportar como PDF ou Imagem** - Permitir baixar o cronograma visualmente
2. **Filtro por Turma** - Permitir visualizar apenas disciplinas de uma turma específica

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar filtro por turma e botões de exportação |
| `src/lib/ganttExport.ts` | **CRIAR** | Funções de exportação para PDF e imagem |

---

### 1. Novo Arquivo: `ganttExport.ts`

Funções utilitárias para exportar o gráfico Gantt:

```typescript
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Exportar como PDF usando html2pdf.js (já instalado no projeto)
export const exportGanttToPdf = async (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const options = {
    margin: 10,
    filename: `Cronograma_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  await html2pdf().set(options).from(element).save();
};

// Exportar como PNG usando html2canvas
export const exportGanttToImage = async (elementId: string) => {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 2 });
  const link = document.createElement('a');
  link.download = `Cronograma_${format(new Date(), 'yyyy-MM-dd_HHmm')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
```

---

### 2. Modificação: `SubjectsGanttChart.tsx`

#### 2.1 Adicionar Estado para Filtro de Turma

```typescript
const [selectedClass, setSelectedClass] = useState<string>('all');
const [exporting, setExporting] = useState(false);
```

#### 2.2 Extrair Turmas Disponíveis

```typescript
// Já existe uniqueClasses no useMemo, usaremos isso
const availableClasses = useMemo(() => {
  if (subjects.length === 0) return [];
  const classes = new Map<string, string>();
  subjects.forEach(s => {
    if (s.class_id) {
      classes.set(s.class_id, s.class_name);
    }
  });
  return Array.from(classes.entries()).map(([id, name]) => ({ id, name }));
}, [subjects]);
```

#### 2.3 Filtrar por Turma (após filtro de ano)

```typescript
// Filtrar por ano primeiro, depois por turma
const filteredByYear = useMemo(() => {
  if (selectedYear === 'all') return subjects;
  const year = parseInt(selectedYear);
  return subjects.filter(s => {
    const startYear = getYear(parseISO(s.start_date));
    const endYear = getYear(parseISO(s.end_date));
    return startYear === year || endYear === year;
  });
}, [subjects, selectedYear]);

const filteredSubjects = useMemo(() => {
  if (selectedClass === 'all') return filteredByYear;
  return filteredByYear.filter(s => s.class_id === selectedClass);
}, [filteredByYear, selectedClass]);
```

#### 2.4 Adicionar UI dos Filtros e Botões de Exportação

```tsx
{/* Barra de Filtros e Ações */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
  {/* Filtros */}
  <div className="flex flex-wrap items-center gap-4">
    {/* Filtro por Ano (já existente) */}
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Ano:</span>
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Selecionar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {availableYears.map(year => (
            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Filtro por Turma (NOVO) */}
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Turma:</span>
      <Select value={selectedClass} onValueChange={setSelectedClass}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecionar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as turmas</SelectItem>
          {availableClasses.map(cls => (
            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Contador */}
    {(selectedYear !== 'all' || selectedClass !== 'all') && (
      <Badge variant="secondary">
        {filteredSubjects.length} disciplina(s)
      </Badge>
    )}
  </div>

  {/* Botões de Exportação (NOVO) */}
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportPdf}
      disabled={exporting || filteredSubjects.length === 0}
    >
      <FileDown className="h-4 w-4 mr-2" />
      PDF
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportImage}
      disabled={exporting || filteredSubjects.length === 0}
    >
      <ImageIcon className="h-4 w-4 mr-2" />
      Imagem
    </Button>
  </div>
</div>
```

#### 2.5 Funções de Exportação

```typescript
import { FileDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

const handleExportPdf = async () => {
  setExporting(true);
  try {
    const element = document.getElementById('gantt-chart-container');
    if (!element) throw new Error('Elemento não encontrado');

    const options = {
      margin: 10,
      filename: `Cronograma_Disciplinas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    await html2pdf().set(options).from(element).save();
    toast.success('PDF exportado com sucesso!');
  } catch (error) {
    toast.error('Erro ao exportar PDF');
  } finally {
    setExporting(false);
  }
};

const handleExportImage = async () => {
  setExporting(true);
  try {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById('gantt-chart-container');
    if (!element) throw new Error('Elemento não encontrado');

    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `Cronograma_Disciplinas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Imagem exportada com sucesso!');
  } catch (error) {
    toast.error('Erro ao exportar imagem');
  } finally {
    setExporting(false);
  }
};
```

#### 2.6 Adicionar ID ao Container do Gráfico

```tsx
{/* Gantt Chart - adicionar id para exportação */}
<div id="gantt-chart-container" className="overflow-x-auto bg-white dark:bg-background rounded-lg">
  {/* ... conteúdo existente do gráfico ... */}
</div>
```

---

### Fluxo de Dados Atualizado

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         useAllSubjectsTimeline                           │
│  (busca TODAS as disciplinas)                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SubjectsGanttChart                               │
│                                                                          │
│  1. Extrair anos únicos                                                  │
│  2. Extrair turmas únicas                                                │
│  3. Filtrar por ano selecionado                                          │
│  4. Filtrar por turma selecionada                                        │
│  5. Calcular período e renderizar gráfico                                │
│  6. Botões de exportação PDF/Imagem                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Interface Visual Esperada

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 Cronograma de Disciplinas                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Ano: [▼ 2025]   Turma: [▼ T02AB Tarde]   ⬤ 5 disciplinas       [PDF] [Imagem] │
│                                                                                 │
│                    JAN    FEV    MAR    ABR    MAI    JUN    JUL                │
│  ─────────────────────────────────────────────────────────────────              │
│  Banco de Dados    ▓▓▓▓▓▓▓▓▓                                                    │
│  T02AB Tarde       └──────────────┘                                             │
│                                                                                 │
│  React.js                 ▓▓▓▓▓▓▓▓▓▓▓                                           │
│  T02AB Tarde              └───────────────┘                                     │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Legenda: ▓ T02AB Tarde                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Dependências

O projeto já possui as bibliotecas necessárias:
- **html2pdf.js** - Já instalado (^0.10.3)
- **html2canvas** - Importado dinamicamente via html2pdf.js

---

### Comportamento dos Filtros

| Filtro | Comportamento |
|--------|---------------|
| **Ano: Todos** | Mostra disciplinas de todos os anos |
| **Ano: 2025** | Mostra apenas disciplinas que ocorrem em 2025 |
| **Turma: Todas** | Mostra disciplinas de todas as turmas |
| **Turma: T02AB** | Mostra apenas disciplinas da turma T02AB |
| **Combinação** | Ano + Turma filtram simultaneamente |

---

### Comportamento das Exportações

| Formato | Descrição |
|---------|-----------|
| **PDF** | Exporta em formato paisagem (A4), ideal para impressão |
| **Imagem** | Exporta como PNG de alta resolução (2x scale) |

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Apenas filtro por ano | Filtro por ano + filtro por turma |
| Sem opção de exportar | Botões PDF e Imagem |
| Difícil compartilhar cronograma | Fácil baixar e compartilhar |

