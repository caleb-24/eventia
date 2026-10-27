/**
 * Eventia — tokens de diseño.
 * Fuente de verdad visual. Diseño: ../../docs/DISENO_UI.md
 *
 * Fuentes (expo-google-fonts):
 *   @expo-google-fonts/bricolage-grotesque  → títulos y precios
 *   @expo-google-fonts/figtree              → texto e interfaz
 */

import type { TextStyle } from 'react-native';

export const colors = {
  // Marca
  tinta: '#1C1442', // primario: texto fuerte, botón principal, tab activo
  tintaSoft: '#EAE7F4',
  flamenco: '#FF4F8B', // acento: IA, favoritos, momentos destacados
  flamencoSoft: '#FFE3EC',

  // Superficies
  salina: '#F6F4FA', // fondo de pantalla
  papel: '#FFFFFF', // tarjetas, hojas, inputs
  linea: '#E4E0EE', // bordes y divisores
  niebla: '#6B6585', // texto secundario
  nieblaClara: '#9C97B3', // placeholders, deshabilitado

  // Semánticos (no son acento)
  mar: '#0E9E9A', // disponible, confirmada, éxito
  marSoft: '#DDF4F2',
  sol: '#B87500', // pendiente (texto)
  solBase: '#F5A524', // pendiente (punto/barra)
  solSoft: '#FEF1D9',
  alerta: '#D2372F', // cancelada, rechazada, error
  alertaSoft: '#FBE2E0',
  bloqueado: '#9C97B3',
  bloqueadoSoft: '#EFEDF4',
} as const;

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

/** Escala tipográfica (pt). lineHeight explícito para Android. */
export const type = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  price: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 22, fontVariant: ['tabular-nums'] },
  priceLarge: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

/** Base 4. `gutter` = margen lateral de toda pantalla. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  gutter: 20,
} as const;

/** El radio sube con la jerarquía del objeto. */
export const radius = {
  chip: 999,
  button: 999,
  input: 12,
  card: 16,
  ticket: 18,
  sheet: 24,
} as const;

export const shadow = {
  // Solo para elementos flotantes: tab bar, FAB, barra inferior fija, hojas.
  float: {
    shadowColor: '#1C1442',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

export const hitSlop = 44; // tamaño mínimo táctil

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
export type AvailabilityStatus = 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'BLOCKED' | 'CANCELLED';

export const reservationStatus: Record<ReservationStatus, { label: string; fg: string; bg: string }> = {
  PENDING: { label: 'Pendiente', fg: colors.sol, bg: colors.solSoft },
  CONFIRMED: { label: 'Confirmada', fg: colors.mar, bg: colors.marSoft },
  REJECTED: { label: 'Rechazada', fg: colors.alerta, bg: colors.alertaSoft },
  CANCELLED: { label: 'Cancelada', fg: colors.alerta, bg: colors.alertaSoft },
  COMPLETED: { label: 'Finalizada', fg: colors.tinta, bg: colors.tintaSoft },
};

export const availabilityStatus: Record<AvailabilityStatus, { label: string; dot: string }> = {
  AVAILABLE: { label: 'Disponible', dot: colors.mar },
  PENDING: { label: 'En espera', dot: colors.solBase },
  RESERVED: { label: 'Reservado', dot: colors.tinta },
  BLOCKED: { label: 'No disponible', dot: colors.bloqueado },
  CANCELLED: { label: 'Liberado', dot: colors.mar },
};

export const theme = { colors, fonts, type, space, radius, shadow, hitSlop };
export default theme;
