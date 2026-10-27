const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** $2.000.000 (pesos colombianos, sin decimales). Sin Intl para no depender del motor JS. */
export function formatCOP(value: number | null | undefined): string {
  const amount = Math.round(value ?? 0);
  const digits = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${amount < 0 ? '−' : ''}$${digits}`;
}

/** "2026-12-15" → Date local (sin desfase de zona horaria). */
export function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "15 dic", o "15 dic 2026" con `withYear`. */
export function formatDate(value: string | Date, withYear = false): string {
  const date = typeof value === 'string' ? parseDate(value) : value;
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return withYear ? `${base} ${date.getFullYear()}` : base;
}

export const monthShort = (date: Date) => MONTHS[date.getMonth()];

/** "18:00:00" → "6:00 p. m." */
export function formatTime(value: string | Date): string {
  const [h, m] =
    typeof value === 'string' ? value.split(':').map(Number) : [value.getHours(), value.getMinutes()];
  const suffix = h < 12 ? 'a. m.' : 'p. m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Días completos desde hoy hasta la fecha (negativo si ya pasó). */
export function daysUntil(value: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(value).getTime() - today.getTime()) / 86_400_000);
}

export function relativeDays(value: string): string {
  const days = daysUntil(value);
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days > 1) return `en ${days} días`;
  return `hace ${Math.abs(days)} días`;
}

/** Rango tstzrange de Postgres → fechas. Ej: ["2026-12-15 23:00:00+00","2026-12-16 05:00:00+00") */
export function parsePeriod(value: string): { start: Date; end: Date } | null {
  const match = value.match(/^[[(]"?([^",]+)"?,"?([^",]+)"?[\])]$/);
  if (!match) return null;
  const toDate = (s: string) => new Date(s.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
  return { start: toDate(match[1]), end: toDate(match[2]) };
}

export function initials(name: string): string {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

/** "Caleb Pérez (prueba)" → "Caleb" */
export const firstName = (name: string) => name.replace(/\(.*?\)/g, '').trim().split(/\s+/)[0] ?? '';

/** "+573001234567" o "3001234567" → "300 123 4567" */
export function formatPhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/^\+?57(?=3\d{9}$)/, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
}
