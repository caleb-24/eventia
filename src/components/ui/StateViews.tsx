import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/constants/theme';

import { AppText } from './AppText';
import { Button } from './Button';

/** Cargando: indicador con texto, nunca una pantalla en blanco. */
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.tinta} />
      <AppText variant="small" color={colors.niebla}>
        {label}
      </AppText>
    </View>
  );
}

type EmptyProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
  action?: ReactNode;
};

/** Vacío: dice qué aparecerá aquí y cómo empezar. */
export function EmptyState({ icon, title, body, action }: EmptyProps) {
  return (
    <View style={[styles.box, styles.card]}>
      <View style={styles.icon}>
        <Feather name={icon} size={22} color={colors.tinta} />
      </View>
      <AppText variant="h3" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="small" color={colors.niebla} style={styles.center}>
        {body}
      </AppText>
      {action}
    </View>
  );
}

/** Error: qué pasó y un botón para reintentar. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={[styles.box, styles.card]} accessibilityRole="alert">
      <View style={[styles.icon, styles.iconError]}>
        <Feather name="wifi-off" size={22} color={colors.alerta} />
      </View>
      <AppText variant="small" color={colors.niebla} style={styles.center}>
        {message}
      </AppText>
      <Button label="Reintentar" variant="secondary" size="sm" fullWidth={false} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xl },
  card: {
    backgroundColor: colors.papel,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.linea,
    paddingHorizontal: space.xl,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.tintaSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  iconError: { backgroundColor: colors.alertaSoft },
  center: { textAlign: 'center' },
});
