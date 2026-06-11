import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';

import { AuthContext, type AuthState } from '@/components/auth-context';
import { supabase } from '@/lib/supabase';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Dostarcza stan sesji Supabase do drzewa.
 * Czyta sesję początkową (getSession) i nasłuchuje zmian (onAuthStateChange).
 * Subskrypcja jest sprzątana w cleanup useEffect (unsubscribe).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = { session, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
