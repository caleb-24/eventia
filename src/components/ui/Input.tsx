import Feather from '@expo/vector-icons/Feather';
import { useState, type Ref } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { colors, fonts, radius, space } from '@/constants/theme';

import { AppText } from './AppText';

type Props = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  hintTone?: 'neutral' | 'success';
  leftIcon?: keyof typeof Feather.glyphMap;
  /** Campo de contraseña con botón mostrar/ocultar. */
  password?: boolean;
  ref?: Ref<TextInputInstance>;
};

export function Input({
  label,
  error,
  hint,
  hintTone = 'neutral',
  leftIcon,
  password = false,
  onFocus,
  onBlur,
  ref,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? colors.alerta : focused ? colors.tinta : colors.linea;
  const message = error ?? hint;
  const messageColor = error ? colors.alerta : hintTone === 'success' ? colors.mar : colors.niebla;

  return (
    <View style={styles.field}>
      <AppText variant="small" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.box, { borderColor }]}>
        {leftIcon ? <Feather name={leftIcon} size={18} color={colors.niebla} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.nieblaClara}
          selectionColor={colors.tinta}
          secureTextEntry={password && hidden}
          autoCapitalize={password ? 'none' : rest.autoCapitalize}
          autoCorrect={password ? false : rest.autoCorrect}
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            hitSlop={12}
            onPress={() => setHidden((value) => !value)}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={colors.niebla} />
          </Pressable>
        ) : null}
      </View>
      {message ? (
        <AppText variant="caption" color={messageColor} style={hintTone === 'success' && !error && styles.strong}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: fonts.bodySemi },
  box: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.input,
    backgroundColor: colors.papel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md + 2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.tinta,
    paddingVertical: space.md,
    // En web la caja ya marca el foco; se quita el contorno del navegador.
    ...Platform.select({ web: { outlineWidth: 0 }, default: {} }),
  },
  strong: { fontFamily: fonts.bodySemi },
});
