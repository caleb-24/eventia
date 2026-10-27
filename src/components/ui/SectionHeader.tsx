import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { TextLink } from './TextLink';

type Props = { title: string; actionLabel?: string; onAction?: () => void };

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="h2" accessibilityRole="header">
        {title}
      </AppText>
      {actionLabel && onAction ? <TextLink label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
