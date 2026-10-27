import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, CodeInput, IconBadge, Notice, Screen, TextLink } from '@/components/ui';
import { colors, fonts, space } from '@/constants/theme';
import { formatSeconds, useCountdown } from '@/hooks/useCountdown';
import {
  AuthError,
  authErrorMessage,
  resendSignupCode,
  routeAfterAuth,
  SIGNUP_CODE_LENGTH,
  verifySignupCode,
} from '@/lib/auth';

/** Supabase permite un correo cada 60 s por usuario. */
const RESEND_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { email = '', reenviar } = useLocalSearchParams<{ email?: string; reenviar?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const countdown = useCountdown(RESEND_SECONDS);
  const { restart } = countdown;

  // El código se envió al registrarse (o se reenvía al venir desde Login).
  useEffect(() => {
    restart();
    if (reenviar === '1' && email) resendSignupCode(email).catch(() => undefined);
  }, [restart, reenviar, email]);

  const verify = async (value: string) => {
    if (value.length !== SIGNUP_CODE_LENGTH) {
      setError(`Escribe los ${SIGNUP_CODE_LENGTH} dígitos del código.`);
      return;
    }
    setError(null);
    setInfo(null);
    setVerifying(true);
    try {
      await verifySignupCode(email, value);
      const next = await routeAfterAuth();
      router.replace(next === '/perfil-negocio' ? next : { pathname: next, params: { aviso: 'Cuenta creada' } });
    } catch (e) {
      const code = e instanceof AuthError ? e.code : 'unknown';
      setError(authErrorMessage[code]);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await resendSignupCode(email);
      countdown.restart();
      setInfo('Te enviamos un código nuevo.');
    } catch (e) {
      const code = e instanceof AuthError ? e.code : 'unknown';
      setError(authErrorMessage[code]);
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen footer={<Button label="Verificar" loading={verifying} onPress={() => verify(code)} />}>
      <View style={styles.topBar}>
        <IconBadge icon="mail" tone="mar" />
      </View>

      <View style={styles.heading}>
        <AppText variant="h1" accessibilityRole="header">
          Verifica tu correo
        </AppText>
        <AppText color={colors.niebla}>
          Enviamos un mensaje a <AppText style={styles.strong}>{email}</AppText>. Escribe el código de{' '}
          {SIGNUP_CODE_LENGTH} dígitos que trae, o abre su enlace de confirmación y vuelve para iniciar sesión.
        </AppText>
      </View>

      {error ? <Notice message={error} /> : null}
      {info ? <Notice tone="success" message={info} /> : null}

      <CodeInput
        value={code}
        onChange={(value) => {
          setCode(value);
          if (error) setError(null);
        }}
        length={SIGNUP_CODE_LENGTH}
        onComplete={verify}
        error={!!error}
        autoFocus
      />

      <AppText variant="caption" color={colors.niebla}>
        El código vence en 1 hora. Si no lo ves, revisa la carpeta de spam.
      </AppText>

      <View style={styles.links}>
        {countdown.done ? (
          <TextLink label="Reenviar código" disabled={resending} onPress={resend} />
        ) : (
          <AppText variant="small" color={colors.niebla} accessibilityLiveRegion="polite">
            Reenviar código en{' '}
            <AppText variant="small" style={styles.strong}>
              {formatSeconds(countdown.remaining)}
            </AppText>
          </AppText>
        )}
        <TextLink
          label="Ya abrí el enlace: iniciar sesión"
          onPress={() => router.replace({ pathname: '/login', params: { email } })}
        />
        <TextLink label="Usar otro correo" muted onPress={() => router.replace('/register')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: space.lg },
  heading: { gap: space.sm },
  strong: { fontFamily: fonts.bodySemi, color: colors.tinta },
  links: { alignItems: 'center', gap: space.md, marginTop: space.sm },
});
