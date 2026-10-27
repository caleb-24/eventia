import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ReservationCard } from '@/components/reservations/ReservationCard';
import { AppText, Button, Chip, EmptyState, ErrorState, LoadingState, Notice, Screen } from '@/components/ui';
import { space } from '@/constants/theme';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { cancelReservation, listMyReservations, type ReservationSummary } from '@/lib/api';

const isUpcoming = (r: ReservationSummary) =>
  (r.status === 'PENDING' || r.status === 'CONFIRMED') && (!r.start || r.start.getTime() > Date.now());

/** Reservas del cliente: próximas (con opción de cancelar) e historial. */
export default function ReservationsScreen() {
  const { user } = useAuth();
  const reservations = useAsync(() => (user ? listMyReservations(user.id) : Promise.resolve([])), [user?.id]);
  const [tab, setTab] = useState<'proximas' | 'historial'>('proximas');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const list = reservations.data?.filter((r) => (tab === 'proximas' ? isUpcoming(r) : !isUpcoming(r))) ?? [];

  const confirmCancel = (r: ReservationSummary) =>
    Alert.alert('¿Cancelar la reserva?', `${r.venueName} quedará libre para otras personas en esa fecha.`, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar reserva',
        style: 'destructive',
        onPress: async () => {
          setCancelling(r.id);
          setMessage(null);
          try {
            await cancelReservation(r.id);
            setMessage({ tone: 'success', text: 'Reserva cancelada' });
            reservations.reload();
          } catch (error) {
            setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'No pudimos cancelar la reserva.' });
          } finally {
            setCancelling(null);
          }
        },
      },
    ]);

  return (
    <Screen inTabs refreshing={reservations.refreshing} onRefresh={reservations.refresh} contentStyle={styles.content}>
      <AppText variant="h1" accessibilityRole="header">
        Reservas
      </AppText>

      <View style={styles.tabs} accessibilityRole="tablist">
        <Chip label="Próximas" selected={tab === 'proximas'} onPress={() => setTab('proximas')} />
        <Chip label="Historial" selected={tab === 'historial'} onPress={() => setTab('historial')} />
      </View>

      {message ? <Notice tone={message.tone} message={message.text} /> : null}
      {reservations.loading ? <LoadingState /> : null}
      {reservations.error && !reservations.data ? (
        <ErrorState message={reservations.error} onRetry={reservations.reload} />
      ) : null}

      {reservations.data ? (
        list.length ? (
          <View style={styles.list}>
            {list.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                action={
                  isUpcoming(r) ? (
                    <Button
                      label="Cancelar reserva"
                      variant="ghost"
                      size="sm"
                      loading={cancelling === r.id}
                      onPress={() => confirmCancel(r)}
                    />
                  ) : null
                }
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="bookmark"
            title={tab === 'proximas' ? 'Aún no tienes reservas' : 'Sin historial'}
            body={
              tab === 'proximas'
                ? 'Cuando reserves un lugar aparecerá aquí con su fecha, su estado y el total.'
                : 'Las reservas que ya pasaron, se cancelaron o fueron rechazadas aparecen aquí.'
            }
            action={
              tab === 'proximas' ? (
                <Button label="Explorar lugares" size="sm" fullWidth={false} onPress={() => router.push('/explorar')} />
              ) : undefined
            }
          />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg },
  tabs: { flexDirection: 'row', gap: space.sm },
  list: { gap: space.md },
});
