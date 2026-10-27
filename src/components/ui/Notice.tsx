import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/constants/theme';

import { AppText } from './AppText';

const tones = {
  error: { bg: colors.alertaSoft, fg: colors.alerta, icon: 'alert-circle' as const },
  success: { bg: colors.marSoft, fg: colors.mar, icon: 'check-circle' as const },
  info: { bg: colors.tintaSoft, fg: colors.tinta, icon: 'info' as const },
};

type Props = { message: string; tone?: keyof typeof tones };

/** Mensaje en línea: errores de formulario, confirmaciones y avisos. */
export function Notice({ message, tone = 'error' }: Props) {
  const t = tones[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg }]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Feather name={t.icon} size={18} color={t.fg} style={styles.icon} />
      <AppText variant="small" color={t.fg} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.input,
  },
  icon: { marginTop: 1 },
  text: { flex: 1 },
});
