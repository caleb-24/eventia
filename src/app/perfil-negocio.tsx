import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AppText, Button, IconBadge, Input, Notice, Screen } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { AuthError, authErrorMessage, createBusinessProfile } from '@/lib/auth';
import { normalizeColombianPhone } from '@/lib/validation';

type Field = 'businessName' | 'city' | 'phone';

/** Segundo paso del registro de proveedores: crea la fila en perfiles_proveedor. */
export default function BusinessProfileScreen() {
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const cityRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const clearError = (field: Field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    setFormError(null);
    const next: Partial<Record<Field, string>> = {};
    if (businessName.trim().length < 2) next.businessName = 'Escribe el nombre de tu negocio.';
    if (city.trim().length < 2) next.city = 'Escribe la ciudad donde ofreces tus servicios.';
    if (phone.trim() && !normalizeColombianPhone(phone)) next.phone = 'Escribe un celular de 10 dígitos, por ejemplo 300 123 4567.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createBusinessProfile({
        businessName: businessName.trim(),
        city: city.trim(),
        phone: phone.trim() ? normalizeColombianPhone(phone) : null,
        description: description.trim() || null,
      });
      router.replace({ pathname: '/proveedor', params: { aviso: 'Perfil de negocio creado' } });
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'unknown';
      setFormError(authErrorMessage[code]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button label="Guardar y continuar" loading={saving} onPress={handleSave} />}>
      <View style={styles.topBar}>
        <IconBadge icon="briefcase" />
      </View>

      <View style={styles.heading}>
        <AppText variant="h1" accessibilityRole="header">
          Cuéntanos de tu negocio
        </AppText>
        <AppText color={colors.niebla}>Así te verán los clientes en tus lugares y servicios.</AppText>
      </View>

      {formError ? <Notice message={formError} /> : null}

      <Input
        label="Nombre del negocio"
        value={businessName}
        onChangeText={(value) => {
          setBusinessName(value);
          clearError('businessName');
        }}
        error={errors.businessName}
        placeholder="Eventos Caribe"
        autoCapitalize="words"
        autoComplete="organization"
        textContentType="organizationName"
        autoFocus
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => cityRef.current?.focus()}
      />
      <Input
        ref={cityRef}
        label="Ciudad"
        value={city}
        onChangeText={(value) => {
          setCity(value);
          clearError('city');
        }}
        error={errors.city}
        placeholder="Riohacha"
        autoCapitalize="words"
        textContentType="addressCity"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <Input
        ref={phoneRef}
        label="Celular del negocio (opcional)"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          clearError('phone');
        }}
        error={errors.phone}
        placeholder="300 123 4567"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => descriptionRef.current?.focus()}
      />
      <Input
        ref={descriptionRef}
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Qué ofreces y para qué tipo de eventos"
        multiline
        numberOfLines={3}
        maxLength={400}
        style={styles.multiline}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: space.lg },
  heading: { gap: space.xs },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
});
