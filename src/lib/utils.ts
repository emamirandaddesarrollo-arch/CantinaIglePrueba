import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resta 3 horas a una fecha ISO string (ajuste de zona horaria del servidor)
 */
export function restar3Horas(fechaISO: string): Date {
  const fecha = new Date(fechaISO);
  fecha.setHours(fecha.getHours() - 3);
  return fecha;
}

/**
 * Formatea una fecha restando 3 horas con locale es-AR
 */
export function formatFechaAjustada(fechaISO: string): string {
  const fechaAjustada = restar3Horas(fechaISO);
  return fechaAjustada.toLocaleString('es-AR');
}
