import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, shadow, space } from '@/constants/theme';

type Props = {
  children: ReactNode;
  /** Acción principal fija abajo (BottomActionBar). */
  footer?: ReactNode;
  contentStyle?: ViewStyle;
  /** Pantalla dentro de las pestañas: la barra inferior ya cubre el área segura de abajo. */
  inTabs?: boolean;
  /** Deslizar hacia abajo para actualizar. */
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Pantalla base: área segura, teclado, scroll y barra inferior opcional. */
export function Screen({ children, footer, contentStyle, inTabs = false, refreshing = false, onRefresh }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={footer || inTabs ? ['top'] : ['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tinta} colors={[colors.tinta]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
        {footer ? (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.footerInner}>{footer}</View>
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.salina },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  footer: {
    backgroundColor: colors.papel,
    borderTopWidth: 1,
    borderTopColor: colors.linea,
    ...shadow.float,
  },
  footerInner: { paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: space.md },
});
