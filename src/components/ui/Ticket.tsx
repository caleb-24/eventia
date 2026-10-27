import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/constants/theme';

type Tone = 'light' | 'dark' | 'ai';

type Props = {
  /** Cada hijo es una sección; entre secciones va una perforación. */
  children: ReactNode;
  tone?: Tone;
  /** Color del fondo detrás del ticket, para dibujar las muescas. */
  notchColor?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const tones: Record<Tone, { bg: string; border: string; perforation: string }> = {
  light: { bg: colors.papel, border: colors.linea, perforation: colors.linea },
  dark: { bg: colors.tinta, border: colors.tinta, perforation: 'rgba(255,255,255,0.22)' },
  ai: { bg: colors.papel, border: colors.flamenco, perforation: colors.linea },
};

const NOTCH = 22;

/**
 * Ticket perforado: el elemento firma de Eventia (docs/DISENO_UI.md §5).
 * Solo donde hay fecha y dinero comprometidos: resumen, reservas, propuesta IA, próximo evento.
 */
export function Ticket({ children, tone = 'light', notchColor = colors.salina, style, accessibilityLabel }: Props) {
  const t = tones[tone];
  const sections = Children.toArray(children).filter(Boolean);
  return (
    <View
      style={[styles.ticket, { backgroundColor: t.bg, borderColor: t.border }, style]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      {sections.map((section, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <View style={styles.perforationRow}>
              <View style={[styles.notch, styles.notchLeft, { backgroundColor: notchColor, borderColor: t.border }]} />
              <View style={[styles.perforation, { borderColor: t.perforation }]} />
              <View style={[styles.notch, styles.notchRight, { backgroundColor: notchColor, borderColor: t.border }]} />
            </View>
          ) : null}
          <View style={styles.section}>{section}</View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: { borderRadius: radius.ticket, borderWidth: 1, overflow: 'hidden' },
  section: { padding: space.lg, gap: space.sm },
  perforationRow: { height: NOTCH, justifyContent: 'center' },
  perforation: { marginHorizontal: NOTCH, borderTopWidth: 2, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, borderWidth: 1, top: 0 },
  notchLeft: { left: -NOTCH / 2 - 1 },
  notchRight: { right: -NOTCH / 2 - 1 },
});
