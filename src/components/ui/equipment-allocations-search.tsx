import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Search } from 'lucide-react';

interface EquipmentAllocationsSearchProps {
  onSearch: (term: string) => void;
  onStatusFilter: (status: string) => void;
}

export const EquipmentAllocationsSearch = ({ 
  onSearch, 
  onStatusFilter 
}: EquipmentAllocationsSearchProps) => {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por aluno, equipamento ou patrimônio..."
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      <Select onValueChange={onStatusFilter} defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="ativo">Ativos</SelectItem>
          <SelectItem value="finalizado">Finalizados</SelectItem>
          <SelectItem value="cancelado">Cancelados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
