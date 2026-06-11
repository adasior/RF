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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = { session, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
