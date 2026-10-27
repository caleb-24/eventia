import { Text, type TextProps } from 'react-native';

import { colors, type as typeScale } from '@/constants/theme';

type Variant = keyof typeof typeScale;

type Props = TextProps & { variant?: Variant; color?: string };

export function AppText({ variant = 'body', color = colors.tinta, style, ...rest }: Props) {
  return <Text {...rest} style={[typeScale[variant], { color }, style]} />;
}
