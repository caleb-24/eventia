import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, space } from '@/constants/theme';
import { formatCOP } from '@/utils/format';

/** Gasto contra presupuesto: mar < 90 %, sol 90–100 %, alerta si se pasa. */
export function BudgetMeter({ spent, budget }: { spent: number; budget: number }) {
  const ratio = budget > 0 ? spent / budget : 0;
  const tone = ratio > 1 ? colors.alerta : ratio >= 0.9 ? colors.solBase : colors.mar;
  const diff = budget - spent;
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`${formatCOP(spent)} de ${formatCOP(budget)} de presupuesto`}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(ratio, 1) * 100}%`, backgroundColor: tone }]} />
      </View>
      <View style={styles.row}>
        <AppText variant="caption" color={colors.niebla}>
          {formatCOP(spent)} de {formatCOP(budget)}
        </AppText>
        <AppText variant="caption" color={ratio > 1 ? colors.alerta : colors.mar} style={styles.strong}>
          {diff >= 0 ? `Te sobran ${formatCOP(diff)}` : `Te pasas por ${formatCOP(-diff)}`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.tintaSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  strong: { fontFamily: fonts.bodySemi },
});
