import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';

/**
 * Nagłówek aplikacji: logo + CTA „+ Nowy projekt" + wylogowanie.
 * CTA na mobile zastępowany przez FAB (U8) — tu zawsze widoczny (desktop-first scope U5).
 */
export function Header() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Nie udało się wylogować — spróbuj ponownie');
      setIsSigningOut(false);
      return;
    }
    // Po sukcesie onAuthStateChange wyczyści sesję i ProtectedRoute przekieruje na /login.
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface px-5">
      <span className="font-serif text-lg italic text-text-primary">
        Pracownia <span className="text-accent">·</span> projekty
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/nowy')}
          className="rounded-pill bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          + Nowy projekt
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="rounded-flag border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-60"
        >
          Wyloguj
        </button>
      </div>
    </header>
  );
}

export default Header;
