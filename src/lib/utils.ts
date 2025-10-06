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
  return toBrasiliaDate(new Date());
}
