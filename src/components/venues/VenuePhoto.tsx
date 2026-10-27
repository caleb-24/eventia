import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

// Atardecer, mar, arena, flamenco, monte: la paleta del Caribe guajiro.
const GRADIENTS: [string, string, string][] = [
  ['#F6B37E', '#E86E6E', '#3B2A6B'],
  ['#8FD3CF', '#2F8C9A', '#1C3D5A'],
  ['#F9D9A8', '#D99A5B', '#6B3E2E'],
  ['#FFC2D4', '#B9668F', '#3E2457'],
  ['#CFE7B8', '#6FA58B', '#234A46'],
];

function pick(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

type Props = { id: string; imageUrl: string | null; style?: ViewStyle };

/** Foto del lugar, o un degradado propio de Eventia mientras el proveedor no sube fotos. */
export function VenuePhoto({ id, imageUrl, style }: Props) {
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[styles.fill, style as object]} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.fill, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={pick(id)} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.mark}>
        <Feather name="image" size={14} color={colors.papel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { overflow: 'hidden', backgroundColor: colors.tintaSoft },
  mark: { position: 'absolute', left: 10, bottom: 10, opacity: 0.7 },
});
