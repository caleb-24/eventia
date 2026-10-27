const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim());

export type PasswordRule = { id: 'length' | 'mix'; label: string; ok: boolean };

export function passwordRules(password: string): PasswordRule[] {
  return [
    { id: 'length', label: '8 caracteres o más', ok: password.length >= 8 },
    { id: 'mix', label: 'Letras y números', ok: /[A-Za-z]/.test(password) && /\d/.test(password) },
  ];
}

export const isStrongPassword = (password: string) => passwordRules(password).every((rule) => rule.ok);

/**
 * Celular colombiano → formato internacional (+573001234567).
 * Acepta "300 123 4567", "3001234567", "+57 300 123 4567". Devuelve null si no es válido.
 */
export function normalizeColombianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local) ? `+57${local}` : null;
}
