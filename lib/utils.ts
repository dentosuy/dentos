import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma inteligente
 * Evita conflictos entre clases duplicadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
