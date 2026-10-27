import Feather from '@expo/vector-icons/Feather';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

function TabIcon({ name, focused, color }: { name: keyof typeof Feather.glyphMap; focused: boolean; color: ColorValue }) {
  return (
    <View style={[styles.pill, focused && styles.pillOn]}>
      <Feather name={name} size={19} color={focused ? colors.papel : (color as string)} />
    </View>
  );
}

function icon(name: keyof typeof Feather.glyphMap) {
  return function TabBarIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <TabIcon name={name} focused={focused} color={color} />;
  };
}

/** Pestañas del cliente (docs/DISENO_UI.md §3). */
export default function ClientTabsLayout() {
  const { user, profile } = useAuth();
  if (!user) return <Redirect href="/login" />;
  if (profile?.role === 'provider') return <Redirect href="/proveedor" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tinta,
        tabBarInactiveTintColor: colors.nieblaClara,
        tabBarStyle: { backgroundColor: colors.papel, borderTopColor: colors.linea },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.salina },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: icon('search') }} />
      <Tabs.Screen name="eventos" options={{ title: 'Mis eventos', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas', tabBarIcon: icon('bookmark') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icon('user') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 46, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.tinta },
});
