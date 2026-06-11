import { useState } from 'react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';

/**
 * Nagłówek aplikacji: logo + wylogowanie.
 * Pełna nawigacja/CTA „+ Nowy projekt" dochodzi w późniejszych IU (U5/U8).
 */
export function Header() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Nie udało się wylogować — spróbuj ponownie');
      setSigningOut(false);
      return;
    }
    // Po sukcesie onAuthStateChange wyczyści sesję i ProtectedRoute przekieruje na /login.
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface px-5">
      <span className="font-serif text-lg italic text-text-primary">
        Pracownia <span className="text-accent">·</span> projekty
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-flag border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-60"
      >
        Wyloguj
      </button>
    </header>
  );
}

export default Header;
