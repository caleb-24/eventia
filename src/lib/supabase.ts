import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Sin URL y clave pública la app muestra la pantalla de configuración (ver _layout.tsx). */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

const client: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Los enlaces del correo se procesan a mano en recuperar-contrasena.tsx.
        detectSessionInUrl: false,
      },
    })
  : null;

/** Cliente de Supabase. El layout raíz no monta la app si falta la configuración. */
export function db(): SupabaseClient<Database> {
  if (!client) throw new Error('Supabase no está configurado: revisa eventia-app/.env');
  return client;
}

// Refresca el token solo con la app en primer plano.
if (client && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      client.auth.startAutoRefresh();
    } else {
      client.auth.stopAutoRefresh();
    }
  });
}
