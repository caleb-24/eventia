import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, space } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { initializing } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  const ready = (fontsLoaded || !!fontError) && !initializing;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.salina } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="proveedor" options={{ gestureEnabled: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="olvide-contrasena" />
        <Stack.Screen name="recuperar-contrasena" options={{ gestureEnabled: false }} />
        <Stack.Screen name="register" />
        <Stack.Screen name="verificar-correo" options={{ gestureEnabled: false }} />
        <Stack.Screen name="perfil-negocio" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

/** Sin eventia-app/.env la app no puede funcionar: lo dice en vez de fallar en silencio. */
function MissingConfig() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <View style={styles.missing}>
      <AppText variant="h2">Falta conectar Supabase</AppText>
      <AppText color={colors.niebla}>
        Crea el archivo eventia-app/.env con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY (ver
        supabase/README.md) y reinicia con npx expo start --clear.
      </AppText>
    </View>
  );
}

export default function RootLayout() {
  if (!isSupabaseConfigured) return <MissingConfig />;
  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, justifyContent: 'center', gap: space.md, padding: space.xl, backgroundColor: colors.salina },
});
