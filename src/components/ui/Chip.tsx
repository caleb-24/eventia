import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet } from 'react-native';

import { colors, fonts, radius, space } from '@/constants/theme';

import { AppText } from './AppText';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Muestra una x para quitar el filtro. */
  removable?: boolean;
};

export function Chip({ label, selected = false, onPress, removable = false }: Props) {
  const fg = selected ? colors.papel : colors.tinta;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={removable ? `Quitar filtro ${label}` : label}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <AppText variant="small" color={fg} style={styles.label}>
        {label}
      </AppText>
      {removable ? <Feather name="x" size={14} color={fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: space.md + 2,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.linea,
    backgroundColor: colors.papel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
  },
  selected: { backgroundColor: colors.tinta, borderColor: colors.tinta },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.bodyMedium },
});
