import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  icon: keyof typeof Feather.glyphMap;
  accessibilityLabel: string;
};

export function IconButton({ icon, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
      {...rest}
    >
      <Feather name={icon} size={20} color={colors.tinta} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.papel,
    borderWidth: 1,
    borderColor: colors.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.tintaSoft },
});
