import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import {
  AppText,
  Button,
  IconButton,
  Input,
  Notice,
  PasswordRequirements,
  RoleOption,
  Screen,
  TextLink,
} from '@/components/ui';
import { colors, fonts, space } from '@/constants/theme';
import { AuthError, authErrorMessage, signUp, type AccountRole } from '@/lib/auth';
import { isStrongPassword, isValidEmail, normalizeColombianPhone } from '@/lib/validation';

type Field = 'role' | 'fullName' | 'email' | 'phone' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

export default function RegisterScreen() {
  const [role, setRole] = useState<AccountRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const clearError = (field: Field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!role) next.role = 'Elige cómo vas a usar Eventia.';
    if (fullName.trim().length < 3) next.fullName = 'Escribe tu nombre y apellido.';
    if (!email.trim()) next.email = 'Escribe tu correo.';
    else if (!isValidEmail(email)) next.email = 'Revisa el correo, parece incompleto.';
    if (!phone.trim()) next.phone = 'Escribe tu celular.';
    else if (!normalizeColombianPhone(phone)) next.phone = 'Escribe un celular de 10 dígitos, por ejemplo 300 123 4567.';
    if (!isStrongPassword(password)) next.password = 'La contraseña aún no cumple los requisitos.';
    return next;
  };

  const handleSubmit = async () => {
    setFormError(null);
    setEmailTaken(false);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0 || !role) return;

    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const { needsVerification } = await signUp({
        fullName: fullName.trim(),
        email: cleanEmail,
        password,
        phone: normalizeColombianPhone(phone) ?? '',
        role,
      });
      if (needsVerification) {
        router.replace({ pathname: '/verificar-correo', params: { email: cleanEmail } });
      } else {
        router.replace(role === 'provider' ? '/perfil-negocio' : { pathname: '/', params: { aviso: 'Cuenta creada' } });
      }
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'unknown';
      setEmailTaken(code === 'email_taken');
      setFormError(authErrorMessage[code]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen footer={<Button label="Crear cuenta" loading={loading} onPress={handleSubmit} />}>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" accessibilityLabel="Volver" onPress={() => router.back()} />
      </View>

      <View style={styles.heading}>
        <AppText variant="h1" accessibilityRole="header">
          Crea tu cuenta
        </AppText>
        <AppText color={colors.niebla}>Te enviaremos un correo para confirmar que es tuyo.</AppText>
      </View>

      {formError ? (
        <View style={styles.notice}>
          <Notice message={formError} />
          {emailTaken ? (
            <View style={styles.row}>
              <TextLink label="Iniciar sesión" onPress={() => router.replace('/login')} />
              <TextLink
                label="Recuperar contraseña"
                onPress={() => router.push({ pathname: '/olvide-contrasena', params: { email: email.trim() } })}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.group} accessibilityRole="radiogroup">
        <AppText variant="small" style={styles.label}>
          ¿Cómo vas a usar Eventia?
        </AppText>
        <View style={styles.roles}>
          <RoleOption
            icon="calendar"
            title="Organizo un evento"
            description="Busco lugares y servicios"
            selected={role === 'client'}
            onPress={() => {
              setRole('client');
              clearError('role');
            }}
          />
          <RoleOption
            icon="briefcase"
            title="Ofrezco lugares o servicios"
            description="Recibo reservas"
            selected={role === 'provider'}
            onPress={() => {
              setRole('provider');
              clearError('role');
            }}
          />
        </View>
        {errors.role ? (
          <AppText variant="caption" color={colors.alerta}>
            {errors.role}
          </AppText>
        ) : null}
      </View>

      <Input
        label="Nombre completo"
        value={fullName}
        onChangeText={(value) => {
          setFullName(value);
          clearError('fullName');
        }}
        error={errors.fullName}
        placeholder="Nombre y apellido"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <Input
        ref={emailRef}
        label="Correo"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearError('email');
        }}
        error={errors.email}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <Input
        ref={phoneRef}
        label="Celular"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          clearError('phone');
        }}
        error={errors.phone}
        hint={errors.phone ? undefined : 'Para que el proveedor o el cliente te contacte sobre una reserva.'}
        placeholder="300 123 4567"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <View style={styles.group}>
        <Input
          ref={passwordRef}
          label="Contraseña"
          password
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearError('password');
          }}
          error={errors.password}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        <PasswordRequirements password={password} />
      </View>

      <AppText variant="caption" color={colors.niebla} style={styles.center}>
        Al crear la cuenta aceptas los términos y la política de datos de Eventia.
      </AppText>

      <View style={styles.footerLink}>
        <AppText variant="small" color={colors.niebla}>
          ¿Ya tienes cuenta?
        </AppText>
        <TextLink label="Inicia sesión" onPress={() => router.replace('/login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { gap: space.xs },
  notice: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.lg, paddingHorizontal: space.xs },
  group: { gap: space.sm },
  label: { fontFamily: fonts.bodySemi },
  roles: { flexDirection: 'row', gap: space.sm },
  center: { textAlign: 'center' },
  footerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.xs },
});
