import Feather from '@expo/vector-icons/Feather';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, EmptyState, ErrorState, LoadingState, Notice, Screen, SectionHeader, TextLink } from '@/components/ui';
import { colors, fonts, radius, space, type as typeScale } from '@/constants/theme';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { getProviderDashboard, respondToRequest, type ProviderRequest } from '@/lib/api';
import { signOut } from '@/lib/auth';
import { firstName, formatCOP, formatDate, formatPhone, formatTime } from '@/utils/format';

const LIGHT = '#BDB6DE';

/** Panel del proveedor (§34): ingresos, indicadores y solicitudes por responder. */
export default function ProviderDashboardScreen() {
  const { user, profile } = useAuth();
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const dashboard = useAsync(() => (user ? getProviderDashboard(user.id) : Promise.resolve(null)), [user?.id]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    aviso ? { tone: 'success', text: aviso } : null,
  );

  if (!user) return <Redirect href="/login" />;
  if (profile && profile.role !== 'provider') return <Redirect href="/" />;
  // Proveedor que aún no creó su perfil de negocio.
  if (dashboard.data === null && !dashboard.loading && !dashboard.error) return <Redirect href="/perfil-negocio" />;

  const respond = async (request: ProviderRequest, accept: boolean) => {
    setBusy(request.id);
    setMessage(null);
    try {
      await respondToRequest(request, accept);
      setMessage({ tone: 'success', text: accept ? 'Solicitud aceptada' : 'Solicitud rechazada' });
      dashboard.reload();
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'No pudimos responder la solicitud.' });
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = (request: ProviderRequest) =>
    Alert.alert('¿Rechazar la solicitud?', `${request.clientName} tendrá que buscar otra opción para ${request.eventName}.`, [
      { text: 'Volver', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: () => respond(request, false) },
    ]);

  const confirmSignOut = () =>
    Alert.alert('¿Cerrar sesión?', 'Tendrás que volver a escribir tu correo y contraseña.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);

  const d = dashboard.data;

  return (
    <Screen refreshing={dashboard.refreshing} onRefresh={dashboard.refresh} contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="small" color={colors.niebla}>
            Hola, {firstName(profile?.fullName ?? '') || 'proveedor'}
          </AppText>
          <View style={styles.business}>
            <AppText variant="h2" accessibilityRole="header" numberOfLines={1} style={styles.businessName}>
              {d?.businessName ?? 'Tu negocio'}
            </AppText>
            {d?.verified ? <Feather name="shield" size={16} color={colors.mar} accessibilityLabel="Verificado" /> : null}
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={confirmSignOut} hitSlop={8} style={styles.iconBtn}>
          <Feather name="log-out" size={18} color={colors.tinta} />
        </Pressable>
      </View>

      {message ? <Notice tone={message.tone} message={message.text} /> : null}
      {dashboard.loading ? <LoadingState /> : null}
      {dashboard.error && !d ? <ErrorState message={dashboard.error} onRetry={dashboard.reload} /> : null}

      {d ? (
        <>
          <View style={styles.income} accessible accessibilityLabel={`Ingresos confirmados ${formatCOP(d.confirmedIncome)}`}>
            <AppText variant="caption" color={LIGHT}>
              Ingresos confirmados
            </AppText>
            <AppText style={styles.incomeValue} color={colors.papel}>
              {formatCOP(d.confirmedIncome)}
            </AppText>
            <AppText variant="caption" color={LIGHT}>
              {d.confirmed === 1 ? 'De 1 solicitud confirmada' : `De ${d.confirmed} solicitudes confirmadas`}
            </AppText>
          </View>

          <View style={styles.kpis}>
            <Kpi value={String(d.received)} label="Solicitudes recibidas" />
            <Kpi value={String(d.confirmed)} label="Confirmadas" />
            <Kpi value={String(d.activeListings)} label="Lugares y servicios activos" />
            <Kpi value={d.rating === null ? '–' : String(d.rating).replace('.', ',')} label="Valoración promedio" star={d.rating !== null} />
          </View>

          <SectionHeader title={d.pending.length ? `Por responder (${d.pending.length})` : 'Por responder'} />
          {d.pending.length ? (
            <View style={styles.list}>
              {d.pending.map((r) => (
                <View key={r.id} style={styles.request}>
                  <View style={styles.requestTop}>
                    <View style={styles.requestText}>
                      <AppText variant="small" style={styles.strong}>
                        {r.clientName}
                      </AppText>
                      <AppText variant="caption" color={colors.niebla}>
                        {r.itemName}, {r.eventName}
                      </AppText>
                      <AppText variant="caption" color={colors.niebla}>
                        {[
                          r.date ? formatDate(r.date, true) : null,
                          r.start ? formatTime(r.start) : null,
                          `${r.guests} invitados`,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </AppText>
                      {r.clientPhone ? (
                        <AppText variant="caption" color={colors.niebla} selectable>
                          {formatPhone(r.clientPhone)}
                        </AppText>
                      ) : null}
                    </View>
                    <AppText style={typeScale.price}>{formatCOP(r.amount)}</AppText>
                  </View>
                  <View style={styles.actions}>
                    <View style={styles.flex}>
                      <Button label="Rechazar" variant="secondary" size="sm" disabled={busy !== null} onPress={() => confirmReject(r)} />
                    </View>
                    <View style={styles.flex}>
                      <Button label="Aceptar" size="sm" loading={busy === r.id} disabled={busy !== null && busy !== r.id} onPress={() => respond(r, true)} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="inbox"
              title="Estás al día"
              body="Cuando un cliente reserve tu lugar o agregue tu servicio a su evento, la solicitud aparecerá aquí."
            />
          )}

          <AppText variant="caption" color={colors.niebla} style={styles.center}>
            Desliza hacia abajo para actualizar.
          </AppText>
          <View style={styles.center}>
            <TextLink label="Cerrar sesión" muted onPress={confirmSignOut} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function Kpi({ value, label, star = false }: { value: string; label: string; star?: boolean }) {
  return (
    <View style={styles.kpi} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.kpiValueRow}>
        <AppText style={styles.kpiValue}>{value}</AppText>
        {star ? <Feather name="star" size={15} color={colors.solBase} /> : null}
      </View>
      <AppText variant="caption" color={colors.niebla}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerText: { flex: 1, gap: 2 },
  business: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  businessName: { flexShrink: 1 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.papel,
    borderWidth: 1,
    borderColor: colors.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  income: { backgroundColor: colors.tinta, borderRadius: radius.ticket, padding: space.lg, gap: 4 },
  incomeValue: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.papel,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.linea,
    padding: space.md,
    gap: 2,
  },
  kpiValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kpiValue: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 26, fontVariant: ['tabular-nums'] },
  list: { gap: space.md },
  request: {
    backgroundColor: colors.papel,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.linea,
    padding: space.lg,
    gap: space.md,
  },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  requestText: { flex: 1, gap: 2 },
  strong: { fontFamily: fonts.bodySemi },
  actions: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  center: { textAlign: 'center', alignItems: 'center' },
});
