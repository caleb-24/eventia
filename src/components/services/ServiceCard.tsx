import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, space, type as typeScale } from '@/constants/theme';
import { unitLabel, type ServiceSummary } from '@/lib/api';
import { formatCOP } from '@/utils/format';

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Alimentación: 'coffee',
  Decoración: 'feather',
  Música: 'music',
  Fotografía: 'camera',
  Video: 'video',
  Animación: 'smile',
  Meseros: 'users',
  Seguridad: 'shield',
  Transporte: 'truck',
  Sonido: 'speaker',
  Iluminación: 'sun',
  'Equipos audiovisuales': 'monitor',
};

/** Servicio con su precio y unidad (por evento, por persona o por hora). */
export function ServiceCard({ service }: { service: ServiceSummary }) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${service.name}, ${formatCOP(service.price)} ${unitLabel[service.unit]}`}
    >
      <View style={styles.icon}>
        <Feather name={ICONS[service.categoryName ?? ''] ?? 'star'} size={20} color={colors.tinta} />
      </View>
      <View style={styles.body}>
        <AppText variant="small" style={styles.name} numberOfLines={1}>
          {service.name}
        </AppText>
        <AppText variant="caption" color={colors.niebla} numberOfLines={1}>
          {service.categoryName}
          {service.providerName ? `, ${service.providerName}` : ''}
        </AppText>
      </View>
      <View style={styles.price}>
        <AppText style={typeScale.price}>{formatCOP(service.price)}</AppText>
        <AppText variant="caption" color={colors.niebla}>
          {unitLabel[service.unit]}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.papel,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.linea,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.tintaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodySemi },
  price: { alignItems: 'flex-end' },
});
