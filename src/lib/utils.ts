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
  
  // Formatar a data no timezone de Brasília
  const brasiliaDateString = dateObj.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Converter de DD/MM/YYYY para YYYY-MM-DD
  const [day, month, year] = brasiliaDateString.split('/');
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
