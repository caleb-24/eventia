import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, space, type as typeScale } from '@/constants/theme';
import type { VenueSummary } from '@/lib/api';
import { formatCOP } from '@/utils/format';

import { VenuePhoto } from './VenuePhoto';

type Props = { venue: VenueSummary; variant?: 'list' | 'mini' };

export function Rating({ value, count }: { value: number | null; count?: number }) {
  if (value === null) {
    return (
      <AppText variant="caption" color={colors.niebla}>
        Nuevo
      </AppText>
    );
  }
  return (
    <View style={styles.rating} accessibilityLabel={`Valoración ${value} de 5`}>
      <Feather name="star" size={13} color={colors.solBase} />
      <AppText variant="caption" style={styles.ratingValue}>
        {String(value).replace('.', ',')}
      </AppText>
      {count ? (
        <AppText variant="caption" color={colors.niebla}>
          ({count})
        </AppText>
      ) : null}
    </View>
  );
}

/** Tarjeta de lugar: foto, nombre, ubicación, capacidad, precio y valoración (§11). */
export function VenueCard({ venue, variant = 'list' }: Props) {
  const mini = variant === 'mini';
  return (
    <View
      style={[styles.card, mini && styles.mini]}
      accessible
      accessibilityLabel={`${venue.name}, ${venue.city}, hasta ${venue.capacity} invitados, ${formatCOP(venue.price)} por evento`}
    >
      <VenuePhoto id={venue.id} imageUrl={venue.imageUrl} style={mini ? styles.photoMini : styles.photo} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant={mini ? 'small' : 'h3'} style={styles.name} numberOfLines={1}>
            {venue.name}
          </AppText>
          {!mini ? <Rating value={venue.rating} count={venue.reviews} /> : null}
        </View>
        {!mini ? (
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={13} color={colors.niebla} />
              <AppText variant="caption" color={colors.niebla}>
                {venue.city}
                {venue.categoryName ? `, ${venue.categoryName.toLowerCase()}` : ''}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="users" size={13} color={colors.niebla} />
              <AppText variant="caption" color={colors.niebla}>
                Hasta {venue.capacity}
              </AppText>
            </View>
          </View>
        ) : null}
        <View style={styles.priceRow}>
          <AppText style={mini ? styles.priceMini : typeScale.price}>{formatCOP(venue.price)}</AppText>
          {mini ? <Rating value={venue.rating} /> : (
            <AppText variant="caption" color={colors.niebla}>
              por evento
            </AppText>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.papel,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.linea,
    overflow: 'hidden',
  },
  mini: { width: 190 },
  photo: { height: 140 },
  photoMini: { height: 104 },
  body: { padding: space.md, gap: space.xs + 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  name: { flexShrink: 1, fontFamily: fonts.bodySemi },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm, marginTop: 2 },
  priceMini: { fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'] },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingValue: { fontFamily: fonts.bodySemi },
});
