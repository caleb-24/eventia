import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

const tones = {
  tinta: { bg: colors.tintaSoft, fg: colors.tinta },
  mar: { bg: colors.marSoft, fg: colors.mar },
  alerta: { bg: colors.alertaSoft, fg: colors.alerta },
};

type Props = { icon: keyof typeof Feather.glyphMap; tone?: keyof typeof tones };

/** Icono grande de encabezado en pantallas de un solo propósito. */
export function IconBadge({ icon, tone = 'tinta' }: Props) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]} accessibilityElementsHidden importantForAccessibility="no">
      <Feather name={icon} size={28} color={t.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
