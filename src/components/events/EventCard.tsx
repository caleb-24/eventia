import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors, fonts, radius, space } from '@/constants/theme';
import type { EventSummary } from '@/lib/api';
import { formatCOP, formatDate, relativeDays } from '@/utils/format';

import { BudgetMeter } from './BudgetMeter';

/** Siguiente paso que le falta al evento, en vez de un menú genérico. */
function nextStep(event: EventSummary): string | null {
  if (event.status === 'COMPLETED' || event.status === 'CANCELLED') return null;
  if (!event.date) return 'Falta elegir la fecha';
  if (!event.venueName) return 'Falta elegir el lugar';
  if (event.status === 'PLANNED') return 'Esperando respuesta de los proveedores';
  return null;
}

export function EventCard({ event }: { event: EventSummary }) {
  const step = nextStep(event);
  return (
    <View style={styles.card} accessible accessibilityLabel={`Evento ${event.name}`}>
      <View style={styles.top}>
        <StatusBadge kind="event" status={event.status} />
        {event.date ? (
          <AppText variant="caption" color={colors.niebla}>
            {relativeDays(event.date)}
          </AppText>
        ) : null}
      </View>

      <AppText variant="h2">{event.name}</AppText>

      <View style={styles.meta}>
        {event.date ? <Meta icon="calendar" text={formatDate(event.date, true)} /> : null}
        <Meta icon="users" text={`${event.guests} invitados`} />
        {event.venueName ? <Meta icon="map-pin" text={event.venueName} /> : event.city ? <Meta icon="map-pin" text={event.city} /> : null}
      </View>

      {event.budget ? (
        <BudgetMeter spent={event.total} budget={event.budget} />
      ) : event.total ? (
        <AppText variant="small" style={styles.total}>
          {formatCOP(event.total)}
        </AppText>
      ) : null}

      {step ? (
        <View style={styles.step}>
          <Feather name="arrow-right-circle" size={15} color={colors.tinta} />
          <AppText variant="small">{step}</AppText>
        </View>
      ) : null}
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Feather name={icon} size={13} color={colors.niebla} />
      <AppText variant="caption" color={colors.niebla}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.papel,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.linea,
    padding: space.lg,
    gap: space.sm + 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  total: { fontFamily: fonts.bodySemi },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.linea,
  },
});
