import * as Linking from 'expo-linking';

import type { Database } from '@/types/database';

import { db } from './supabase';

export type AccountRole = 'client' | 'provider';
export type UserRole = Database['public']['Enums']['user_role'];

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_taken'
  | 'email_invalid'
  | 'code_invalid'
  | 'rate_limit'
  | 'email_quota'
  | 'weak_password'
  | 'same_password'
  | 'link_expired'
  | 'link_invalid'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

/** Mensajes para el usuario: qué pasó y qué hacer. */
export const authErrorMessage: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  email_taken: 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
  email_invalid: 'No podemos enviar correos a esa dirección. Revisa que esté bien escrita.',
  code_invalid: 'El código no es válido o ya venció. Revísalo o pide uno nuevo.',
  rate_limit: 'Ya enviamos un correo hace poco. Espera un minuto e intenta de nuevo.',
  email_quota: 'Eventia alcanzó el límite de correos por hora. Intenta de nuevo más tarde.',
  weak_password: 'Esa contraseña es muy fácil de adivinar. Usa una más larga o combina más caracteres.',
  same_password: 'La nueva contraseña debe ser distinta a la anterior.',
  link_expired: 'Este enlace ya venció. Pide uno nuevo.',
  link_invalid: 'Este enlace no es válido o ya se usó. Pide uno nuevo.',
  network: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
  unknown: 'No pudimos completar la acción. Intenta de nuevo en unos minutos.',
};

/** Debe coincidir con `auth.email.otp_length` del proyecto Supabase (supabase/config.toml). */
export const SIGNUP_CODE_LENGTH = 8;

/** Ruta que abre el enlace del correo. Expo Go: exp://…/--/recuperar-contrasena. Build: eventia://recuperar-contrasena */
export const recoveryRedirectUrl = () => Linking.createURL('recuperar-contrasena');

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const e = error as { code?: string; name?: string; status?: number; message?: string };
  switch (e?.code) {
    case 'invalid_credentials':
      return new AuthError('invalid_credentials');
    case 'email_not_confirmed':
      return new AuthError('email_not_confirmed');
    case 'user_already_exists':
    case 'email_exists':
      return new AuthError('email_taken');
    case 'email_address_invalid':
    case 'email_address_not_authorized':
      return new AuthError('email_invalid');
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      // "For security purposes, you can only request this after N seconds" = espera por usuario (60 s).
      // "email rate limit exceeded" = cupo de correos por hora del proyecto.
      return new AuthError(/after \d+ seconds/i.test(e.message ?? '') ? 'rate_limit' : 'email_quota');
    case 'weak_password':
      return new AuthError('weak_password');
    case 'same_password':
      return new AuthError('same_password');
    case 'otp_expired':
      return new AuthError('link_expired');
    case 'bad_code_verifier':
    case 'flow_state_not_found':
    case 'flow_state_expired':
      return new AuthError('link_invalid');
  }
  if (e?.name === 'AuthRetryableFetchError' || e?.message === 'Network request failed') {
    return new AuthError('network');
  }
  return new AuthError('unknown');
}

/** Lee parámetros de query y de fragmento (#) sin depender de URL, que en RN está incompleto. */
export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  for (const part of [query, hash]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [key, value = ''] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  }
  return params;
}

async function run(action: () => PromiseLike<{ error: unknown }>): Promise<void> {
  try {
    const { error } = await action();
    if (error) throw error;
  } catch (error) {
    throw toAuthError(error);
  }
}

// ---------- sesión ----------
export const signIn = (email: string, password: string) =>
  run(() => db().auth.signInWithPassword({ email, password }));

export async function signOut(): Promise<void> {
  await db().auth.signOut();
}

// ---------- registro ----------
export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  /** Celular en formato +57XXXXXXXXXX. */
  phone: string;
  role: AccountRole;
};

/**
 * Crea la cuenta. El trigger handle_new_user crea la fila de `usuarios` con nombre, teléfono y rol.
 * Con la confirmación de correo activa, Supabase envía el correo y no hay sesión todavía.
 */
export async function signUp(input: SignUpInput): Promise<{ needsVerification: boolean }> {
  try {
    const { data, error } = await db().auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName, phone: input.phone, role: input.role } },
    });
    if (error) throw error;
    // Si el correo ya está confirmado, Supabase responde sin error pero sin identidades.
    if (data.user && data.user.identities?.length === 0) throw new AuthError('email_taken');
    return { needsVerification: !data.session };
  } catch (error) {
    throw toAuthError(error);
  }
}

/** Confirma el correo con el código del mensaje. Deja la sesión iniciada. */
export async function verifySignupCode(email: string, code: string): Promise<void> {
  try {
    await run(() => db().auth.verifyOtp({ email, token: code, type: 'email' }));
  } catch (error) {
    // En este contexto "otp_expired" significa código equivocado o vencido.
    if (error instanceof AuthError && error.code === 'link_expired') throw new AuthError('code_invalid');
    throw error;
  }
}

export const resendSignupCode = (email: string) => run(() => db().auth.resend({ type: 'signup', email }));

// ---------- a dónde va cada cuenta ----------
export type HomeRoute = '/' | '/proveedor' | '/perfil-negocio';

/** Cliente → Inicio. Proveedor → su panel, o primero el perfil de negocio si no lo ha creado. */
export async function routeAfterAuth(): Promise<HomeRoute> {
  try {
    const { data: auth } = await db().auth.getUser();
    if (!auth.user) return '/';
    const { data: usuario } = await db().from('usuarios').select('role').eq('id', auth.user.id).maybeSingle();
    if (usuario?.role !== 'provider') return '/';
    const { count } = await db()
      .from('perfiles_proveedor')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.user.id);
    return count ? '/proveedor' : '/perfil-negocio';
  } catch {
    return '/';
  }
}

export type BusinessProfileInput = {
  businessName: string;
  city: string;
  phone: string | null;
  description: string | null;
};

export async function createBusinessProfile(input: BusinessProfileInput): Promise<void> {
  const { data: auth } = await db().auth.getUser();
  const user = auth.user;
  if (!user) throw new AuthError('invalid_credentials');
  await run(() =>
    db().from('perfiles_proveedor').insert({
      user_id: user.id,
      business_name: input.businessName,
      city: input.city,
      phone: input.phone,
      description: input.description,
      email: user.email ?? null,
    }),
  );
}

// ---------- recuperar contraseña ----------
/** Siempre resuelve igual exista o no la cuenta, para no revelar correos registrados. */
export const requestPasswordReset = (email: string) =>
  run(() => db().auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirectUrl() }));

/**
 * Abre la sesión temporal de recuperación a partir del enlace del correo.
 * Soporta flujo implícito (#access_token=…) y PKCE (?code=…). Devuelve el correo de la cuenta.
 */
export async function startRecoveryFromUrl(url: string | null): Promise<string> {
  const params = parseUrlParams(url ?? '');
  try {
    if (params.error_code || params.error) {
      throw { code: params.error_code ?? params.error };
    }
    if (params.code) {
      await run(() => db().auth.exchangeCodeForSession(params.code));
    } else if (params.access_token && params.refresh_token) {
      await run(() =>
        db().auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token }),
      );
    }
    const { data } = await db().auth.getSession();
    const email = data.session?.user.email;
    if (!email) throw new AuthError('link_invalid');
    return email;
  } catch (error) {
    throw toAuthError(error);
  }
}

/**
 * Plan B cuando el enlace del correo no abre la app (por ejemplo, Expo Go en la red local):
 * la persona copia el enlace y lo pega. El enlace trae `token` (hash de un solo uso) y
 * `type=recovery`; se canjea directo con Supabase y queda la sesión de recuperación.
 * También acepta la URL ya redirigida (con #access_token o ?code).
 */
export async function recoverFromPastedLink(text: string): Promise<string> {
  const link = text.trim();
  const params = parseUrlParams(link);
  if (params.access_token || params.code || params.error_code) return startRecoveryFromUrl(link);

  const tokenHash = params.token_hash ?? params.token;
  if (!tokenHash || (params.type && params.type !== 'recovery')) throw new AuthError('link_invalid');
  try {
    await run(() => db().auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }));
    const { data } = await db().auth.getSession();
    const email = data.session?.user.email;
    if (!email) throw new AuthError('link_invalid');
    return email;
  } catch (error) {
    throw toAuthError(error);
  }
}

export const updatePassword = (password: string) => run(() => db().auth.updateUser({ password }));
