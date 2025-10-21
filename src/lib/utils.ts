import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte uma data para o timezone de Brasília (America/Sao_Paulo)
 * e retorna no formato YYYY-MM-DD para armazenamento no banco
 */
export function toBrasiliaDate(date: Date | string): string {
  // Se já for string no formato YYYY-MM-DD (de input date), retornar diretamente
  // para evitar problemas com interpretação UTC
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Usar diretamente ano/mês/dia do objeto Date local
  // sem conversão de timezone para manter a data selecionada
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a data atual no timezone de Brasília no formato YYYY-MM-DD
 */
export function getTodayInBrasilia(): string {
  const now = new Date();
  const brasiliaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const year = brasiliaDate.getFullYear();
  const month = String(brasiliaDate.getMonth() + 1).padStart(2, '0');
  const day = String(brasiliaDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY
 * Evita problemas de timezone ao formatar datas YYYY-MM-DD
 */
export function formatDateBR(date: Date | string): string {
  // Se for string no formato YYYY-MM-DD, formatar diretamente
  // sem criar objeto Date para evitar interpretação UTC
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Para outros formatos, usar toLocaleDateString com timezone de Brasília
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
}
