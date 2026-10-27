import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { colors, space } from '@/constants/theme';
import { passwordRules } from '@/lib/validation';

import { AppText } from './AppText';

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <View style={styles.list}>
      {passwordRules(password).map((rule) => (
        <View
          key={rule.id}
          style={styles.row}
          accessible
          accessibilityLabel={`${rule.label}: ${rule.ok ? 'cumple' : 'falta'}`}
        >
          <Feather
            name={rule.ok ? 'check' : 'circle'}
            size={rule.ok ? 16 : 12}
            color={rule.ok ? colors.mar : colors.nieblaClara}
            style={styles.icon}
          />
          <AppText variant="small" color={rule.ok ? colors.mar : colors.niebla}>
            {rule.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  icon: { width: 16, textAlign: 'center' },
});
