import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AppText, Button, Input, Notice, Screen, TextLink, Wordmark } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import {
  AuthError,
  authErrorMessage,
  routeAfterAuth,
  signIn,
} from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';

type FieldErrors = { email?: string; password?: string };

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = 'Escribe tu correo.';
    else if (!isValidEmail(email)) next.email = 'Revisa el correo, parece incompleto.';
    if (!password) next.password = 'Escribe tu contraseña.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace(await routeAfterAuth());
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'unknown';
      if (code === 'email_not_confirmed') {
        // Cuenta creada sin confirmar: reenvía el código y lleva a verificarlo.
        router.push({ pathname: '/verificar-correo', params: { email: email.trim().toLowerCase(), reenviar: '1' } });
        return;
      }
      setFormError(authErrorMessage[code]);
    } finally {
      setLoading(false);
    }
  };

  const goToForgot = () =>
    router.push({ pathname: '/olvide-contrasena', params: email.trim() ? { email: email.trim() } : {} });

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.brand}>
        <Wordmark size={34} />
      </View>

      <View style={styles.heading}>
        <AppText variant="h1" accessibilityRole="header">
          Inicia sesión
        </AppText>
        <AppText color={colors.niebla}>Retoma tus eventos y reservas.</AppText>
      </View>

      {formError ? <Notice message={formError} /> : null}

      <View style={styles.form}>
        <Input
          label="Correo"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={fieldErrors.email}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <Input
          ref={passwordRef}
          label="Contraseña"
          password
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={fieldErrors.password}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <View style={styles.forgot}>
          <TextLink label="¿Olvidaste tu contraseña?" onPress={goToForgot} />
        </View>
      </View>

      <Button label="Iniciar sesión" loading={loading} onPress={handleSubmit} />

      <View style={styles.footer}>
        <AppText variant="small" color={colors.niebla}>
          ¿No tienes cuenta?
        </AppText>
        <TextLink label="Crear cuenta" onPress={() => router.push('/register')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.xxl, gap: space.xl },
  brand: { gap: space.sm },
  heading: { gap: space.xs },
  form: { gap: space.lg },
  forgot: { alignItems: 'flex-end' },
  center: { textAlign: 'center' },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xs,
    paddingTop: space.lg,
  },
});
