# Eventia — app móvil

React Native + Expo (SDK 57) + TypeScript + Expo Router. Diseño en [`../docs/DISENO_UI.md`](../docs/DISENO_UI.md).

## Estado

Implementado:

- **Login**, **Olvidé mi contraseña** (con "Revisa tu correo") y **Recuperar contraseña**.
- **Registro** con elección de rol → **Verifica tu correo** (código de 8 dígitos o enlace) → para proveedores, **Perfil del negocio**.

- **Cliente** (pestañas): Inicio, Explorar (lugares y servicios con búsqueda y categorías), Mis eventos, Reservas (con cancelar) y Perfil.
- **Proveedor**: panel con ingresos confirmados, indicadores y solicitudes por responder (aceptar o rechazar).

Todo lee y escribe en Supabase; no hay modo demo. Sin `.env` la app muestra cómo configurarlo.

Pendiente: detalle del lugar, crear evento, agregar servicios, resumen y reservar, asistente IA y la gestión de lugares y servicios del proveedor.

## Ejecutar

```bash
npm install
npx expo start          # escanea el QR con Expo Go
```

Sin `.env` la app arranca en **modo demo**: no hay backend, cualquier correo entra con la contraseña `eventia123`, y tras "Enviar enlace" aparece "Abrir enlace de prueba" para probar la pantalla de nueva contraseña.

## Conectar Supabase

1. Copia `.env.example` a `.env` y completa `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. En Supabase → Authentication → URL Configuration → Redirect URLs agrega:
   - `eventia://recuperar-contrasena` (builds)
   - `exp://**` (Expo Go durante desarrollo)
3. Reinicia `npx expo start` para que lea el `.env`.

El enlace del correo abre `recuperar-contrasena`, que crea la sesión temporal (flujo implícito `#access_token` o PKCE `?code`) y guarda la nueva clave con `updateUser`.

## Base de datos

Migraciones, reglas de reserva, RLS y datos de prueba en [`supabase/`](supabase/README.md). Pruébalas sin proyecto con `npm run test:db`.

## Estructura

```text
src/
├── app/                    rutas (Expo Router)
│   ├── _layout.tsx         fuentes, splash, AuthProvider
│   ├── index.tsx           redirige según sesión
│   ├── login.tsx
│   ├── olvide-contrasena.tsx
│   └── recuperar-contrasena.tsx
├── components/ui/          Button, Input, TextLink, IconButton, IconBadge, Notice,
│                           PasswordRequirements, Screen, Wordmark, MockBadge, AppText
├── constants/theme.ts      tokens de diseño
├── hooks/                  useAuth, useCountdown
└── lib/                    supabase, auth (con modo demo), validation
```

## Verificar

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
