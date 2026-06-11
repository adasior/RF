import type { Session } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

/**
 * Stan sesji współdzielony przez aplikację.
 * `isLoading` = trwa początkowe odczytanie sesji (getSession); dopóki true,
 * guard tras nie podejmuje decyzji o przekierowaniu.
 */
export interface AuthState {
  session: Session | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth musi być użyty wewnątrz <AuthProvider>');
  }
  return context;
}
