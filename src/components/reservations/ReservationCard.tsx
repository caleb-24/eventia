import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Ticket } from '@/components/ui/Ticket';
import { colors, fonts, space, type as typeScale } from '@/constants/theme';
import type { ReservationSummary } from '@/lib/api';
import { formatCOP, formatTime, monthShort } from '@/utils/format';

const STATUS_NOTE: Record<ReservationSummary['status'], string> = {
  PENDING: 'Esperando respuesta del lugar',
  CONFIRMED: 'El lugar confirmó tu reserva',
  REJECTED: 'El lugar no pudo aceptarla',
  CANCELLED: 'Reserva cancelada',
  COMPLETED: 'Evento realizado',
};

/** Talón de ticket: fecha grande, lugar, estado y total (docs/DISENO_UI.md §6.10). */
export function ReservationCard({ reservation, action }: { reservation: ReservationSummary; action?: ReactNode }) {
  const muted = reservation.status === 'CANCELLED' || reservation.status === 'REJECTED';
  const start = reservation.start;
  return (
    <Ticket style={muted ? styles.muted : undefined}>
      <View style={styles.head}>
        <View style={styles.date}>
          <AppText style={styles.day}>{start ? String(start.getDate()).padStart(2, '0') : '–'}</AppText>
          <AppText variant="caption" color={colors.niebla}>
            {start ? monthShort(start) : ''}
          </AppText>
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <AppText variant="small" style={styles.venue} numberOfLines={1}>
              {reservation.venueName}
            </AppText>
            <StatusBadge kind="reservation" status={reservation.status} />
          </View>
          <AppText variant="caption" color={colors.niebla} numberOfLines={1}>
            {reservation.eventName}
            {start && reservation.end ? `, ${formatTime(start)} a ${formatTime(reservation.end)}` : ''}
          </AppText>
        </View>
      </View>
      <View style={styles.foot}>
        <AppText variant="caption" color={colors.niebla} style={styles.note}>
          {STATUS_NOTE[reservation.status]}
        </AppText>
        <AppText style={typeScale.price}>{formatCOP(reservation.total)}</AppText>
      </View>
      {action ?? null}
    </Ticket>
  );
}

const styles = StyleSheet.create({
  muted: { opacity: 0.7 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  date: { width: 46, alignItems: 'center' },
  day: { fontFamily: fonts.display, fontSize: 24, lineHeight: 26, fontVariant: ['tabular-nums'] },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  venue: { flexShrink: 1, fontFamily: fonts.bodySemi },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  note: { flex: 1 },
});
