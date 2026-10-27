import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  IconBadge,
  IconButton,
  Input,
  Notice,
  Screen,
  TextLink,
} from '@/components/ui';
import { colors, fonts, space } from '@/constants/theme';
import { formatSeconds, useCountdown } from '@/hooks/useCountdown';
import {
  AuthError,
  authErrorMessage,
  recoverFromPastedLink,
  recoveryRedirectUrl,
  requestPasswordReset,
} from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';

/**
 * Solo en desarrollo: Expo Go en la red local usa exp://<IP privada>, que Supabase no acepta
 * como redirección. El enlace del correo no podrá abrir la app (usar --tunnel o pegar el enlace).
 */
const redirectUrl = recoveryRedirectUrl();
const linkCannotOpenApp = __DEV__ && /^exp:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|localhost)/.test(redirectUrl);

/** Supabase permite un correo de recuperación cada 60 s por usuario. */
const RESEND_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const countdown = useCountdown(RESEND_SECONDS);
  const [showPaste, setShowPaste] = useState(false);
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState<string>();
  const [checkingLink, setCheckingLink] = useState(false);

  const submitPastedLink = async () => {
    if (!pasted.trim()) return setPasteError('Pega el enlace completo del correo.');
    setPasteError(undefined);
    setCheckingLink(true);
    try {
      await recoverFromPastedLink(pasted);
      router.replace('/recuperar-contrasena');
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'unknown';
      setPasteError(authErrorMessage[code === 'unknown' ? 'link_invalid' : code]);
    } finally {
      setCheckingLink(false);
    }
  };

  const send = async (target: string) => {
    setFormError(null);
    setLoading(true);
    try {
      await requestPasswordReset(target);
      setSentTo(target);
      countdown.restart();
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'unknown';
      setFormError(authErrorMessage[code]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return setEmailError('Escribe el correo de tu cuenta.');
    if (!isValidEmail(clean)) return setEmailError('Revisa el correo, parece incompleto.');
    send(clean);
  };

  const openMailApp = async () => {
    // iOS abre la bandeja de Mail; en Android `mailto:` abre el cliente de correo.
    const url = Platform.OS === 'ios' ? 'message:' : 'mailto:';
    try {
      await Linking.openURL(url);
    } catch {
      setFormError('No encontramos una app de correo. Abre tu correo manualmente.');
    }
  };

  if (sentTo) {
    return (
      <Screen contentStyle={styles.sent}>
        <IconBadge icon="mail" tone="mar" />
        <AppText variant="h1" accessibilityRole="header" style={styles.center}>
          Revisa tu correo
        </AppText>
        <AppText color={colors.niebla} style={styles.center}>
          Si hay una cuenta con <AppText style={styles.strong}>{sentTo}</AppText>, te llegó un enlace. Ábrelo
          desde este teléfono para crear tu nueva contraseña.
        </AppText>
        <AppText variant="caption" color={colors.niebla} style={styles.center}>
          El enlace vence en 1 hora. Si no lo ves, revisa la carpeta de spam.
        </AppText>

        {formError ? <Notice message={formError} /> : null}
        {linkCannotOpenApp ? (
          <Notice
            tone="info"
            message={`Desarrollo: Expo Go está en la red local (${redirectUrl}). El enlace del correo no abrirá la app. Arranca con "npx expo start --tunnel" y vuelve a escanear el QR, o pega el enlace abajo.`}
          />
        ) : null}

        <View style={styles.sentActions}>
          <Button label="Abrir app de correo" icon="mail" onPress={openMailApp} />
        </View>

        <View style={styles.resend}>
          {countdown.done ? (
            <TextLink label="Reenviar enlace" disabled={loading} onPress={() => send(sentTo)} />
          ) : (
            <AppText variant="small" color={colors.niebla} accessibilityLiveRegion="polite">
              Reenviar enlace en{' '}
              <AppText variant="small" style={styles.strong}>
                {formatSeconds(countdown.remaining)}
              </AppText>
            </AppText>
          )}
          <TextLink
            label="Usar otro correo"
            onPress={() => {
              setSentTo(null);
              setFormError(null);
            }}
          />
          {!showPaste ? <TextLink label="¿El enlace no abre la app?" muted onPress={() => setShowPaste(true)} /> : null}
        </View>

        {showPaste ? (
          <View style={styles.paste}>
            <AppText variant="small" style={styles.strong}>
              Pega el enlace aquí
            </AppText>
            <AppText variant="caption" color={colors.niebla}>
              En el correo, mantén presionado el botón o enlace para restablecer la contraseña, elige &quot;Copiar
              dirección del enlace&quot; y pégalo abajo.
            </AppText>
            <Input
              label="Enlace del correo"
              value={pasted}
              onChangeText={(value) => {
                setPasted(value);
                if (pasteError) setPasteError(undefined);
              }}
              error={pasteError}
              placeholder="https://…supabase.co/auth/v1/verify?…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={submitPastedLink}
            />
            <Button label="Continuar" loading={checkingLink} onPress={submitPastedLink} />
          </View>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" accessibilityLabel="Volver" onPress={() => router.back()} />
      </View>

      <IconBadge icon="lock" />

      <View style={styles.heading}>
        <AppText variant="h1" accessibilityRole="header">
          ¿Olvidaste tu contraseña?
        </AppText>
        <AppText color={colors.niebla}>
          Escribe el correo de tu cuenta y te enviamos un enlace para crear una nueva.
        </AppText>
      </View>

      {formError ? <Notice message={formError} /> : null}

      <Input
        label="Correo"
        leftIcon="mail"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (emailError) setEmailError(undefined);
        }}
        error={emailError}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        autoFocus={!params.email}
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
      />

      <Button label="Enviar enlace" loading={loading} onPress={handleSubmit} />

      <View style={styles.footer}>
        <AppText variant="small" color={colors.niebla}>
          ¿La recordaste?
        </AppText>
        <TextLink label="Inicia sesión" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { gap: space.sm },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xs,
    paddingTop: space.lg,
  },
  sent: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: space.xl, gap: space.lg },
  sentActions: { alignSelf: 'stretch', gap: space.md, marginTop: space.sm },
  resend: { alignItems: 'center', gap: space.md },
  paste: { alignSelf: 'stretch', gap: space.sm, marginTop: space.sm },
  center: { textAlign: 'center' },
  strong: { fontFamily: fonts.bodySemi, color: colors.tinta },
});
