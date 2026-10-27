import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { colors, fonts, radius, space } from '@/constants/theme';

import { AppText } from './AppText';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length: number;
  /** Se llama al escribir el último dígito. */
  onComplete?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
};

/**
 * Código de verificación: casillas visibles sobre un único TextInput invisible,
 * así funcionan pegar, el autocompletado del teclado y borrar.
 */
export function CodeInput({ value, onChange, length, onComplete, error = false, autoFocus = false }: Props) {
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(autoFocus);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessible={false}>
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length }, (_, index) => {
          const active = focused && index === Math.min(value.length, length - 1);
          return (
            <View
              key={index}
              style={[
                styles.box,
                value[index] ? styles.filled : null,
                active && styles.active,
                error && styles.error,
              ]}
            >
              <AppText style={styles.digit}>{value[index] ?? ''}</AppText>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        accessibilityLabel={`Código de verificación de ${length} dígitos`}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.xs + 2 },
  box: {
    flex: 1,
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.linea,
    backgroundColor: colors.papel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { borderColor: colors.nieblaClara },
  active: { borderColor: colors.tinta, borderWidth: 2 },
  error: { borderColor: colors.alerta },
  digit: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, fontVariant: ['tabular-nums'] },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.01, color: 'transparent' },
});
