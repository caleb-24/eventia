import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Notice, Screen } from '@/components/ui';
import { colors, fonts, radius, space } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { formatPhone, initials } from '@/utils/format';

const ROLE_LABEL = { client: 'Cliente', provider: 'Proveedor', admin: 'Administrador' } as const;

/** Perfil del cliente: datos de la cuenta, volverse proveedor y cerrar sesión. */
export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const confirmSignOut = () =>
    Alert.alert('¿Cerrar sesión?', 'Tendrás que volver a escribir tu correo y contraseña.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);

  const becomeProvider = () =>
    Alert.alert(
      'Ofrecer lugares o servicios',
      'Tu cuenta pasará a ser de proveedor y verás el panel para recibir reservas. Seguirás usando el mismo correo.',
      [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            setError(null);
            const { error: updateError } = await db().from('usuarios').update({ role: 'provider' }).eq('id', user!.id);
            if (updateError) {
              setError('No pudimos cambiar tu cuenta. Intenta de nuevo en unos minutos.');
              return;
            }
            await refreshProfile();
            router.replace('/perfil-negocio');
          },
        },
      ],
    );

  const name = profile?.fullName || 'Tu cuenta';

  return (
    <Screen inTabs contentStyle={styles.content}>
      <AppText variant="h1" accessibilityRole="header">
        Perfil
      </AppText>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText} color={colors.flamenco}>
            {initials(name).toUpperCase() || '?'}
          </AppText>
        </View>
        <View style={styles.headerText}>
          <AppText variant="h3">{name}</AppText>
          <AppText variant="small" color={colors.niebla}>
            {user?.email}
          </AppText>
          {profile ? (
            <View style={styles.role}>
              <AppText variant="caption" style={styles.strong}>
                {ROLE_LABEL[profile.role]}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      {error ? <Notice message={error} /> : null}

      <View style={styles.list}>
        <Row icon="mail" label="Correo" value={user?.email ?? ''} />
        <Row icon="phone" label="Celular" value={formatPhone(profile?.phone ?? null) || 'Sin celular'} last />
      </View>

      <View style={styles.list}>
        {profile?.role === 'client' ? (
          <Row icon="briefcase" label="Ofrecer lugares o servicios" onPress={becomeProvider} />
        ) : null}
        <Row icon="bell" label="Notificaciones" value="Pronto" />
        <Row icon="log-out" label="Cerrar sesión" danger onPress={confirmSignOut} last />
      </View>
    </Screen>
  );
}

type RowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
};

function Row({ icon, label, value, onPress, danger = false, last = false }: RowProps) {
  const fg = danger ? colors.alerta : colors.tinta;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={value ? `${label}: ${value}` : label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Feather name={icon} size={16} color={fg} />
      </View>
      <AppText variant="small" color={fg} style={styles.rowLabel}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="small" color={colors.niebla} numberOfLines={1} style={styles.rowValue}>
          {value}
        </AppText>
      ) : null}
      {onPress && !danger ? <Feather name="chevron-right" size={18} color={colors.nieblaClara} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.flamencoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  headerText: { flex: 1, gap: 2 },
  role: {
    alignSelf: 'flex-start',
    marginTop: space.xs,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.tintaSoft,
  },
  strong: { fontFamily: fonts.bodySemi },
  list: { backgroundColor: colors.papel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.linea },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, minHeight: 56 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.linea },
  pressed: { backgroundColor: colors.salina },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.tintaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: colors.alertaSoft },
  rowLabel: { flex: 1, fontFamily: fonts.bodyMedium },
  rowValue: { maxWidth: '55%' },
});
