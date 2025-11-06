import { useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStudentSearch, StudentSearchResult } from '@/hooks/useStudentSearch';

interface StudentSearchComboboxProps {
  onStudentSelect: (student: StudentSearchResult) => void;
  selectedStudent: StudentSearchResult | null;
}

export const StudentSearchCombobox = ({
  onStudentSelect,
  selectedStudent
}: StudentSearchComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { students, loading } = useStudentSearch(searchValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedStudent
            ? `${selectedStudent.name} - ${selectedStudent.student_id}`
            : 'Buscar aluno...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Digite o nome do aluno..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Buscando...</span>
              </div>
            ) : students.length === 0 && searchValue.length >= 2 ? (
              <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
            ) : students.length === 0 ? (
              <CommandEmpty>Digite pelo menos 2 caracteres...</CommandEmpty>
            ) : (
              <CommandGroup>
                {students.map((student) => (
                  <CommandItem
                    key={student.id}
                    value={student.id}
                    onSelect={() => {
                      onStudentSelect(student);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedStudent?.id === student.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {student.student_id} | {student.class_name || 'Sem turma'} | {student.status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
