// Twardy dowód RLS: weryfikuje że anon key NIE widzi danych z tabeli `projekty`,
// a zalogowana sesja (opcjonalnie) widzi. Uruchom PO aplikacji migracji 0001-0003.
//
// Uruchomienie (Node 20+, wbudowane --env-file; brak dodatkowych zależności):
//   node --env-file=.env scripts/verify-rls.mjs
//
// Wymagane zmienne env:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  (te same co używa frontend)
// Opcjonalne (włączają test pozytywny zalogowanej sesji):
//   VERIFY_RLS_EMAIL, VERIFY_RLS_PASSWORD       (wspólne konto zespołu)
//
// Kody wyjścia: 0 = wszystkie asercje przeszły, 1 = którakolwiek nie przeszła.
// UWAGA: skrypt NIGDY nie loguje kluczy ani hasła.

import { createClient } from '@supabase/supabase-js';

const TABLE = 'projekty';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    // Fail fast — brak konfiguracji uniemożliwia weryfikację.
    throw new Error(`Brak wymaganej zmiennej środowiskowej: ${name}`);
  }
  return value;
}

// Test 1: anon key bez sesji NIE może odczytać żadnego wiersza (deny-all D3).
// Sukces RLS = pusta tablica LUB błąd uprawnień. Porażka = zwrócone wiersze.
async function assertAnonDenied(url, anonKey) {
  const anon = createClient(url, anonKey);
  const { data, error } = await anon.from(TABLE).select('id').limit(1);

  if (error) {
    console.log(`[OK] anon SELECT odrzucony przez RLS (błąd: ${error.code ?? error.message})`);
    return true;
  }
  if (Array.isArray(data) && data.length === 0) {
    console.log('[OK] anon SELECT zwrócił 0 wierszy (deny-all przez brak polityki dla anon)');
    return true;
  }
  console.error(
    `[FAIL] anon SELECT zwrócił ${data?.length ?? '?'} wiersz(y) — RLS NIE blokuje anon!`,
  );
  return false;
}

// Test 2 (opcjonalny): zalogowana sesja MOŻE odczytać tabelę.
// Brak credentiali => test pomijany (nie jest porażką).
async function assertAuthenticatedAllowed(url, anonKey) {
  const email = process.env.VERIFY_RLS_EMAIL;
  const password = process.env.VERIFY_RLS_PASSWORD;
  if (!email || !password) {
    console.log('[SKIP] test zalogowanej sesji — brak VERIFY_RLS_EMAIL / VERIFY_RLS_PASSWORD');
    return true;
  }

  const client = createClient(url, anonKey);
  const { error: authError } = await client.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error(`[FAIL] logowanie nie powiodło się: ${authError.message}`);
    return false;
  }

  const { error } = await client.from(TABLE).select('id').limit(1);
  await client.auth.signOut();

  if (error) {
    console.error(`[FAIL] zalogowany SELECT zwrócił błąd RLS: ${error.code ?? error.message}`);
    return false;
  }
  console.log('[OK] zalogowany SELECT dozwolony (brak błędu RLS)');
  return true;
}

async function main() {
  const url = requireEnv('VITE_SUPABASE_URL');
  const anonKey = requireEnv('VITE_SUPABASE_ANON_KEY');

  const results = [
    await assertAnonDenied(url, anonKey),
    await assertAuthenticatedAllowed(url, anonKey),
  ];

  if (results.includes(false)) {
    console.error('\nWeryfikacja RLS NIE przeszła.');
    process.exit(1);
  }
  console.log('\nWeryfikacja RLS przeszła.');
}

main().catch((error) => {
  // Structured fail — nie połykamy błędu, zwracamy niezerowy kod.
  console.error(`Błąd weryfikacji RLS: ${error.message}`);
  process.exit(1);
});
