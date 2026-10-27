import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventCard } from '@/components/events/EventCard';
import { AppText, Chip, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { space } from '@/constants/theme';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { listMyEvents, type EventSummary } from '@/lib/api';

type Filter = 'activos' | 'borradores' | 'finalizados';

const FILTERS: { id: Filter; label: string; match: (e: EventSummary) => boolean }[] = [
  { id: 'activos', label: 'Activos', match: (e) => e.status === 'PLANNED' || e.status === 'BOOKED' },
  { id: 'borradores', label: 'Borradores', match: (e) => e.status === 'DRAFT' },
  { id: 'finalizados', label: 'Finalizados', match: (e) => e.status === 'COMPLETED' || e.status === 'CANCELLED' },
];

const EMPTY: Record<Filter, string> = {
  activos: 'Cuando reserves un lugar para un evento, aparecerá aquí con su fecha y su presupuesto.',
  borradores: 'Los eventos que aún no tienen reserva aparecen aquí.',
  finalizados: 'Los eventos que ya pasaron o cancelaste aparecen aquí.',
};

/** Mis eventos (§11 del diseño): estado, datos clave, presupuesto y siguiente paso. */
export default function EventsScreen() {
  const { user } = useAuth();
  const events = useAsync(() => (user ? listMyEvents(user.id) : Promise.resolve([])), [user?.id]);
  const [filter, setFilter] = useState<Filter | null>(null);

  // Abre en el primer filtro con eventos.
  const active = filter ?? FILTERS.find((f) => events.data?.some(f.match))?.id ?? 'activos';
  const shown = events.data?.filter(FILTERS.find((f) => f.id === active)!.match) ?? [];

  return (
    <Screen inTabs refreshing={events.refreshing} onRefresh={events.refresh} contentStyle={styles.content}>
      <AppText variant="h1" accessibilityRole="header">
        Mis eventos
      </AppText>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} selected={active === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </View>

      {events.loading ? <LoadingState /> : null}
      {events.error && !events.data ? <ErrorState message={events.error} onRetry={events.reload} /> : null}

      {events.data ? (
        shown.length ? (
          <View style={styles.list}>
            {shown.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </View>
        ) : (
          <EmptyState icon="calendar" title="Nada por aquí todavía" body={EMPTY[active]} />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  list: { gap: space.md },
});
