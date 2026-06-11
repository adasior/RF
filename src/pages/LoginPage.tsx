import { Loader2 } from 'lucide-react';
import { useActionState } from 'react';

import { supabase } from '@/lib/supabase';

const BLAD_LOGOWANIA = 'Nieprawidłowy email lub hasło';

interface LoginState {
  error: string | null;
}

const initialState: LoginState = { error: null };

async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Podaj email i hasło' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Nie ujawniamy szczegółów błędu auth (enumeracja) — komunikat ogólny PL.
    return { error: BLAD_LOGOWANIA };
  }

  // Sukces: onAuthStateChange zaktualizuje sesję, ProtectedRoute wpuści na /.
  return { error: null };
}

/**
 * Ekran logowania wspólnym kontem zespołu (Supabase Auth, email+hasło).
 * Brak rejestracji/resetu — tylko logowanie (decyzja D3).
 */
export function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6">
        <span className="font-serif text-lg italic text-text-primary">
          Pracownia <span className="text-accent">·</span> projekty
        </span>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? 'login-error' : undefined}
              className="min-h-12 w-full rounded-input border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(181,84,45,0.10)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-text-primary">
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? 'login-error' : undefined}
              className="min-h-12 w-full rounded-input border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(181,84,45,0.10)]"
            />
          </div>

          {state.error && (
            <p id="login-error" role="alert" className="text-xs text-danger">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-input bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-70"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Zaloguj
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
