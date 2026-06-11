import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast w runtime — brak konfiguracji uniemożliwia połączenie z bazą.
  // Build/test nie wymagają realnego .env (zmienne mogą być puste).
  throw new Error(
    'Brak konfiguracji Supabase: ustaw VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w .env',
  );
}

/**
 * Klient Supabase (anon key) — typy Database zostaną wygenerowane w U2/U4.
 * Service role key NIGDY nie trafia do frontu (tylko anon key).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
