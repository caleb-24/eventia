import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EventCardDark } from '@/components/events/NextEventTicket';
import { ServiceCard } from '@/components/services/ServiceCard';
import {
  AppText,
  Chip,
  ErrorState,
  LoadingState,
  Notice,
  Screen,
  SearchBar,
  SectionHeader,
} from '@/components/ui';
import { VenueCard } from '@/components/venues/VenueCard';
import { colors, fonts, radius, space } from '@/constants/theme';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { listCategories, listMyEvents, listServices, listVenues } from '@/lib/api';
import { daysUntil, firstName } from '@/utils/format';

/** Inicio del cliente (§10): saludo, buscador, próximo evento, categorías, lugares y servicios. */
export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const [showNotice, setShowNotice] = useState(true);

  const home = useAsync(async () => {
    const [events, categories, venues, services] = await Promise.all([
      user ? listMyEvents(user.id) : Promise.resolve([]),
      listCategories('venue'),
      listVenues({ limit: 6 }),
      listServices({ limit: 4 }),
    ]);
    const next = events.find(
      (e) => e.date && daysUntil(e.date) >= 0 && e.status !== 'CANCELLED' && e.status !== 'COMPLETED',
    );
    return { next, categories, venues, services };
  }, [user?.id]);

  const name = firstName(profile?.fullName ?? '');

  return (
    <Screen inTabs refreshing={home.refreshing} onRefresh={home.refresh} contentStyle={styles.content}>
      {aviso && showNotice ? (
        <Pressable onPress={() => setShowNotice(false)} accessibilityHint="Toca para cerrar el aviso">
          <Notice tone="success" message={aviso} />
        </Pressable>
      ) : null}

      <View style={styles.heading}>
        <AppText color={colors.niebla}>{name ? `Hola, ${name}` : 'Hola'}</AppText>
        <AppText variant="h1" accessibilityRole="header">
          ¿Qué evento quieres organizar?
        </AppText>
      </View>

      <SearchBar
        value=""
        onChangeText={() => undefined}
        placeholder="Buscar lugares o servicios"
        onPressBar={() => router.push('/explorar')}
      />

      {home.loading ? <LoadingState /> : null}
      {home.error && !home.data ? <ErrorState message={home.error} onRetry={home.reload} /> : null}

      {home.data ? (
        <>
          {home.data.next ? (
            <Pressable onPress={() => router.push('/eventos')} accessibilityRole="button">
              <EventCardDark event={home.data.next} />
            </Pressable>
          ) : null}

          {home.data.categories.length ? (
            <View style={styles.section}>
              <SectionHeader title="Tipos de lugar" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll} style={styles.bleed}>
                {home.data.categories.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    onPress={() => router.push({ pathname: '/explorar', params: { categoria: c.id } })}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="Lugares destacados" actionLabel="Ver todos" onAction={() => router.push('/explorar')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll} style={styles.bleed}>
              {home.data.venues.map((v) => (
                <VenueCard key={v.id} venue={v} variant="mini" />
              ))}
            </ScrollView>
          </View>

          <View style={styles.ai}>
            <View style={styles.aiIcon}>
              <Feather name="zap" size={20} color={colors.papel} />
            </View>
            <View style={styles.aiText}>
              <AppText variant="small" style={styles.aiTitle}>
                Planear con IA
              </AppText>
              <AppText variant="caption" color={colors.niebla}>
                Cuéntale qué evento quieres y te arma una propuesta con lugares y precios reales.
              </AppText>
            </View>
            <View style={styles.soon}>
              <AppText variant="caption" color={colors.flamenco} style={styles.aiTitle}>
                Pronto
              </AppText>
            </View>
          </View>

          {home.data.services.length ? (
            <View style={styles.section}>
              <SectionHeader
                title="Servicios recomendados"
                actionLabel="Ver todos"
                onAction={() => router.push({ pathname: '/explorar', params: { vista: 'servicios' } })}
              />
              <View style={styles.list}>
                {home.data.services.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.xl, paddingTop: space.lg },
  heading: { gap: space.xs },
  section: { gap: space.md },
  bleed: { marginHorizontal: -space.gutter },
  hscroll: { gap: space.sm + 2, paddingHorizontal: space.gutter },
  list: { gap: space.sm },
  ai: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.flamencoSoft,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.flamenco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { flex: 1, gap: 2 },
  aiTitle: { fontFamily: fonts.bodySemi },
  soon: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.papel },
});
