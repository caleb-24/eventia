import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type TextInput } from 'react-native';

import {
  AppText,
  Button,
  IconBadge,
  Input,
  Notice,
  PasswordRequirements,
  Screen,
} from '@/components/ui';
import { colors, space } from '@/constants/theme';
import {
  AuthError,
  authErrorMessage,
  routeAfterAuth,
  signOut,
  startRecoveryFromUrl,
  updatePassword,
  type AuthErrorCode,
} from '@/lib/auth';
import { isStrongPassword } from '@/lib/validation';

type Status =
  | { kind: 'verifying' }
  | { kind: 'ready'; email: string }
  | { kind: 'link-error'; code: AuthErrorCode };

export default function ResetPasswordScreen() {
  // URL completa con la que se abrió la app (incluye #access_token o ?code del correo).
  const url = Linking.useLinkingURL();
  const [status, setStatus] = useState<Status>({ kind: 'verifying' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const confirmRef = useRef<TextInput>(null);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const process = (link: string | null) =>
      startRecoveryFromUrl(link)
        .then((email) => setStatus({ kind: 'ready', email }))
        .catch((error) => {
          const code = error instanceof AuthError ? error.code : 'unknown';
          setStatus({ kind: 'link-error', code: code === 'unknown' ? 'link_invalid' : code });
        });

    // El enlace del correo trae los datos en la URL. Con la app ya abierta, la URL puede
    // llegar un instante después de montar la pantalla: se procesa cuando llegue.
    const hasAuthData = !!url && /[#?&](access_token|code|error_code)=/.test(url);
    if (hasAuthData) {
      if (handled.current === url) return;
      handled.current = url;
      process(url);
      return;
    }
    // Sin datos en la URL (por ejemplo, enlace pegado): usa la sesión de recuperación ya abierta.
    const id = setTimeout(() => {
      if (handled.current) return;
      handled.current = 'session';
      process(null);
    }, 600);
    return () => clearTimeout(id);
  }, [url]);

  const strong = isStrongPassword(password);
  const matches = confirm.length > 0 && confirm === password;

  const handleSave = async () => {
    setSubmitted(true);
    setFormError(null);
    if (!strong || !matches) return;
    setSaving(true);
    try {
      await updatePassword(password);
      const next = await routeAfterAuth();
      router.replace(next === '/perfil-negocio' ? next : { pathname: next, params: { aviso: 'Contraseña actualizada' } });
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'unknown';
      setFormError(authErrorMessage[code]);
    } finally {
      setSaving(false);
    }
  };

  if (status.kind === 'verifying') {
    return (
      <Screen contentStyle={styles.centered}>
        <ActivityIndicator color={colors.tinta} size="large" />
        <AppText color={colors.niebla}>Verificando el enlace…</AppText>
      </Screen>
    );
  }

  if (status.kind === 'link-error') {
    const requestNew = async () => {
      await signOut();
      router.replace('/olvide-contrasena');
    };
    return (
      <Screen contentStyle={styles.centered}>
        <IconBadge icon="link-2" tone="alerta" />
        <AppText variant="h1" accessibilityRole="header" style={styles.center}>
          {status.code === 'link_expired' ? 'El enlace venció' : 'No pudimos abrir el enlace'}
        </AppText>
        <AppText color={colors.niebla} style={styles.center}>
          {authErrorMessage[status.code]}
        </AppText>
        <View style={styles.stretch}>
          <Button label="Enviar otro enlace" onPress={requestNew} />
          <Button label="Volver a iniciar sesión" variant="ghost" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    );
  }

  const passwordError = submitted && !strong ? 'La contraseña aún no cumple los requisitos.' : undefined;
  const confirmError =
    submitted && !matches ? (confirm ? 'Las contraseñas no coinciden.' : 'Repite la contraseña.') : undefined;

  return (
    <Screen
      footer={<Button label="Guardar contraseña" loading={saving} onPress={handleSave} />}
      contentStyle={styles.content}
    >
      <View style={styles.topBar}>
        <IconBadge icon="lock" />
      </View>

      <View style={styles.heading}>
        <AppText variant="h1" accessibilityRole="header">
          Crea una nueva contraseña
        </AppText>
        <AppText color={colors.niebla}>Para {status.email}</AppText>
      </View>

      {formError ? <Notice message={formError} /> : null}

      <View style={styles.group}>
        <Input
          label="Nueva contraseña"
          password
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          textContentType="newPassword"
          autoFocus
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <PasswordRequirements password={password} />
      </View>

      <Input
        ref={confirmRef}
        label="Confirmar contraseña"
        password
        value={confirm}
        onChangeText={setConfirm}
        error={confirmError}
        hint={matches ? 'Las contraseñas coinciden' : undefined}
        hintTone="success"
        placeholder="Repite la contraseña"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.xl, gap: space.xl },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heading: { gap: space.xs },
  group: { gap: space.md },
  centered: { justifyContent: 'center', alignItems: 'center', gap: space.lg, paddingHorizontal: space.xl },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', gap: space.sm, marginTop: space.sm },
});
