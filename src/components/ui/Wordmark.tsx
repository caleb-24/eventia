import { colors, fonts } from '@/constants/theme';

import { AppText } from './AppText';

export function Wordmark({ size = 30, color = colors.tinta }: { size?: number; color?: string }) {
  return (
    <AppText
      accessibilityRole="header"
      accessibilityLabel="Eventia"
      color={color}
      style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.05, letterSpacing: -size * 0.045 }}
    >
      eventia
    </AppText>
  );
}
