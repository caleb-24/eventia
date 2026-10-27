import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius, space } from '@/constants/theme';

import { AppText } from './AppText';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

/** Tarjeta seleccionable para elegir cómo se usará la cuenta (cliente o proveedor). */
export function RoleOption({ icon, title, description, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <Feather name={icon} size={20} color={colors.tinta} />
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <Feather name="check" size={12} color={colors.papel} /> : null}
        </View>
      </View>
      <AppText variant="small" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="caption" color={colors.niebla}>
        {description}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: space.xs + 2,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.linea,
    backgroundColor: colors.papel,
  },
  selected: { borderColor: colors.tinta, borderWidth: 2 },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.tinta, borderColor: colors.tinta },
  title: { fontFamily: fonts.bodySemi },
});
