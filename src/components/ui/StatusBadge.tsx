import { StyleSheet, View } from 'react-native';

import { colors, fonts, reservationStatus, space } from '@/constants/theme';
import type { EventStatus, ReservationStatus } from '@/lib/api';

import { AppText } from './AppText';

const eventStatus: Record<EventStatus, { label: string; fg: string; bg: string }> = {
  DRAFT: { label: 'Borrador', fg: colors.niebla, bg: colors.salina },
  PLANNED: { label: 'Reserva pendiente', fg: colors.sol, bg: colors.solSoft },
  BOOKED: { label: 'Confirmado', fg: colors.mar, bg: colors.marSoft },
  COMPLETED: { label: 'Finalizado', fg: colors.tinta, bg: colors.tintaSoft },
  CANCELLED: { label: 'Cancelado', fg: colors.alerta, bg: colors.alertaSoft },
};

type Props =
  | { kind: 'event'; status: EventStatus; tone?: 'light' | 'dark' }
  | { kind: 'reservation'; status: ReservationStatus; tone?: 'light' | 'dark' };

/** Estado siempre con texto, nunca solo color. */
export function StatusBadge(props: Props) {
  const style = props.kind === 'event' ? eventStatus[props.status] : reservationStatus[props.status];
  const dark = props.tone === 'dark';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : style.bg },
        props.kind === 'event' && props.status === 'DRAFT' && !dark && styles.outlined,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dark ? colors.solBase : style.fg }]} />
      <AppText variant="caption" color={dark ? colors.papel : style.fg} style={styles.label}>
        {style.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs + 1,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    borderRadius: 999,
  },
  outlined: { borderWidth: 1, borderColor: colors.linea },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.bodySemi },
});
