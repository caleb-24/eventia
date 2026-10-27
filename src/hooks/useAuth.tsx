import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { UserRole } from '@/lib/auth';
import { db } from '@/lib/supabase';

export type SessionUser = { id: string; email: string };
export type Profile = { fullName: string; phone: string | null; role: UserRole };

type AuthState = {
  user: SessionUser | null;
  profile: Profile | null;
  /** true mientras se restaura la sesión al abrir la app. */
  initializing: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  initializing: true,
  refreshProfile: async () => undefined,
});

const toUser = (session: Session | null): SessionUser | null =>
  session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await db().from('usuarios').select('full_name, phone, role').eq('id', userId).maybeSingle();
  return data ? { fullName: data.full_name, phone: data.phone, role: data.role } : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const load = useCallback(async (session: Session | null) => {
    const next = toUser(session);
    setUser(next);
    setProfile(next ? await fetchProfile(next.id).catch(() => null) : null);
    setInitializing(false);
  }, []);

  useEffect(() => {
    db()
      .auth.getSession()
      .then(({ data }) => load(data.session))
      .catch(() => setInitializing(false));
    const { data } = db().auth.onAuthStateChange((_event, session) => {
      // Fuera del callback: Supabase recomienda no llamar a la base dentro de él.
      setTimeout(() => load(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const refreshProfile = useCallback(async () => {
    if (user) setProfile(await fetchProfile(user.id).catch(() => null));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, initializing, refreshProfile }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
