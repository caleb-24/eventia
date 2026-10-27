import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { colors, fonts, radius, space } from '@/constants/theme';

import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'ai';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
};

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.tinta, fg: colors.papel, border: colors.tinta },
  secondary: { bg: colors.papel, fg: colors.tinta, border: colors.tinta },
  ghost: { bg: 'transparent', fg: colors.tinta, border: 'transparent' },
  ai: { bg: colors.flamenco, fg: colors.papel, border: colors.flamenco },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}: Props) {
  const p = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: p.bg, borderColor: p.border },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && !loading && styles.disabled,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Feather name={icon} size={size === 'sm' ? 14 : 18} color={p.fg} /> : null}
          <AppText style={[styles.label, size === 'sm' && styles.labelSm]} color={p.fg}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  md: { height: 52 },
  sm: { height: 38, paddingHorizontal: space.lg },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 20 },
  labelSm: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
});
