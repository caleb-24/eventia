import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, fonts } from '@/constants/theme';

import { AppText } from './AppText';

type Props = Omit<PressableProps, 'children'> & { label: string; muted?: boolean };

export function TextLink({ label, muted = false, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={12}
      disabled={disabled}
      {...rest}
    >
      {({ pressed }) => (
        <AppText
          variant="small"
          color={disabled || muted ? colors.niebla : colors.tinta}
          style={[styles.label, !disabled && styles.underline, pressed && styles.pressed]}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodySemi },
  underline: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
});
