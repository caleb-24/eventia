import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ServiceCard } from '@/components/services/ServiceCard';
import { AppText, Chip, EmptyState, ErrorState, LoadingState, Screen, SearchBar } from '@/components/ui';
import { VenueCard } from '@/components/venues/VenueCard';
import { colors, fonts, space } from '@/constants/theme';
import { useAsync } from '@/hooks/useAsync';
import { listCategories, listServices, listVenues } from '@/lib/api';

type View_ = 'lugares' | 'servicios';

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/** Explorar lugares y servicios (§11) con búsqueda y filtro por categoría. */
export default function ExploreScreen() {
  const params = useLocalSearchParams<{ categoria?: string; vista?: View_ }>();
  const [view, setView] = useState<View_>(params.vista ?? 'lugares');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoria ?? null);
  const query = useDebounced(search);

  // Llegar desde Inicio con una categoría o vista nueva (ajuste durante el render, sin efecto).
  const incoming = `${params.vista ?? ''}|${params.categoria ?? ''}`;
  const [lastIncoming, setLastIncoming] = useState(incoming);
  if (incoming !== lastIncoming) {
    setLastIncoming(incoming);
    if (params.vista) setView(params.vista);
    if (params.categoria) setCategoryId(params.categoria);
  }

  const categories = useAsync(() => listCategories(view === 'lugares' ? 'venue' : 'service'), [view]);
  const results = useAsync(
    async () =>
      view === 'lugares'
        ? { kind: 'lugares' as const, items: await listVenues({ search: query, categoryId }) }
        : { kind: 'servicios' as const, items: await listServices({ categoryId }) },
    [view, query, categoryId],
  );

  const items = results.data?.kind === view ? results.data : null;
  const filtered =
    items?.kind === 'servicios' && query
      ? items.items.filter((s) => `${s.name} ${s.providerName ?? ''}`.toLowerCase().includes(query.toLowerCase()))
      : items?.items;
  const count = filtered?.length ?? 0;

  return (
    <Screen inTabs refreshing={results.refreshing} onRefresh={results.refresh} contentStyle={styles.content}>
      <AppText variant="h1" accessibilityRole="header">
        Explorar
      </AppText>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={view === 'lugares' ? 'Salón, finca, terraza o ciudad' : 'Buffet, DJ, fotografía…'}
      />

      <View style={styles.segment} accessibilityRole="tablist">
        {(['lugares', 'servicios'] as const).map((option) => (
          <Chip
            key={option}
            label={option === 'lugares' ? 'Lugares' : 'Servicios'}
            selected={view === option}
            onPress={() => {
              setView(option);
              setCategoryId(null);
            }}
          />
        ))}
      </View>

      {categories.data?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.hscroll}>
          <Chip label="Todos" selected={!categoryId} onPress={() => setCategoryId(null)} />
          {categories.data.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {results.loading || !items ? <LoadingState label="Buscando…" /> : null}
      {results.error && !results.data ? <ErrorState message={results.error} onRetry={results.reload} /> : null}

      {items ? (
        <>
          <AppText variant="small" color={colors.niebla} style={styles.count}>
            {count === 1 ? '1 resultado' : `${count} resultados`}
          </AppText>
          {count === 0 ? (
            <EmptyState
              icon="search"
              title="Sin resultados"
              body="No hay coincidencias con esa búsqueda o categoría. Prueba con otra palabra o quita el filtro."
            />
          ) : (
            <View style={styles.list}>
              {items.kind === 'lugares'
                ? items.items.map((v) => <VenueCard key={v.id} venue={v} />)
                : (filtered as typeof items.items).map((s) => <ServiceCard key={s.id} service={s} />)}
            </View>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg },
  segment: { flexDirection: 'row', gap: space.sm },
  bleed: { marginHorizontal: -space.gutter },
  hscroll: { gap: space.sm, paddingHorizontal: space.gutter },
  count: { fontFamily: fonts.bodyMedium },
  list: { gap: space.md },
});
