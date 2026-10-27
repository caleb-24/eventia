import Feather from '@expo/vector-icons/Feather';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, space } from '@/constants/theme';

type Props = Omit<TextInputProps, 'style'> & {
  value: string;
  onChangeText: (value: string) => void;
  /** Si se pasa, la barra funciona como botón (abre la búsqueda en otra pantalla). */
  onPressBar?: () => void;
};

export function SearchBar({ value, onChangeText, onPressBar, placeholder = 'Buscar', ...rest }: Props) {
  const content = (
    <View style={styles.bar}>
      <Feather name="search" size={18} color={colors.niebla} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.nieblaClara}
        selectionColor={colors.tinta}
        returnKeyType="search"
        autoCorrect={false}
        editable={!onPressBar}
        pointerEvents={onPressBar ? 'none' : 'auto'}
        accessibilityLabel={placeholder}
        style={styles.input}
        {...rest}
      />
      {value && !onPressBar ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10} onPress={() => onChangeText('')}>
          <Feather name="x-circle" size={18} color={colors.niebla} />
        </Pressable>
      ) : null}
    </View>
  );
  if (!onPressBar) return content;
  return (
    <Pressable accessibilityRole="search" accessibilityLabel={placeholder} onPress={onPressBar}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 50,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.linea,
    backgroundColor: colors.papel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.tinta,
    ...Platform.select({ web: { outlineWidth: 0 }, default: {} }),
  },
});
