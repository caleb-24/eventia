import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Ticket } from '@/components/ui/Ticket';
import { colors } from '@/constants/theme';
import type { EventSummary } from '@/lib/api';
import { formatCOP, formatDate, formatTime, relativeDays } from '@/utils/format';

const LIGHT = '#BDB6DE';

/** Próximo evento en Inicio: ticket oscuro (docs/DISENO_UI.md §5). */
export function EventCardDark({ event }: { event: EventSummary }) {
  return (
    <Ticket tone="dark" accessibilityLabel={`Tu próximo evento: ${event.name}`}>
      <View style={styles.section}>
        <View style={styles.row}>
          <AppText variant="caption" color={LIGHT}>
            Tu próximo evento{event.date ? `, ${relativeDays(event.date)}` : ''}
          </AppText>
          <StatusBadge kind="event" status={event.status} tone="dark" />
        </View>
        <AppText variant="h2" color={colors.papel}>
          {event.name}
        </AppText>
        <AppText variant="caption" color={LIGHT}>
          {[
            event.date ? formatDate(event.date) : null,
            event.startTime ? formatTime(event.startTime) : null,
            `${event.guests} invitados`,
          ]
            .filter(Boolean)
            .join(', ')}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="caption" color={LIGHT}>
          {event.venueName ?? 'Sin lugar todavía'}
        </AppText>
        <AppText variant="small" color={colors.papel} style={styles.total}>
          {formatCOP(event.total)}
        </AppText>
      </View>
    </Ticket>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  total: { fontVariant: ['tabular-nums'] },
});
