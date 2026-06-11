import type { Flaga } from './config';

/**
 * Klucz pojedynczej flagi boolean (rozpisane / przeslany / sprawdzony / wydrukowany).
 * Wyprowadzony z config.FLAGI, by typ pozostał spójny z konfiguracją.
 */
export type FlagaKey = Flaga['key'];

/**
 * Rekord projektu — odzwierciedla tabelę `projekty` (SPEC_projekty.md + decyzja D6: archived_at).
 * Pełny schemat Zod + typy Insert/Update powstają w U4 (warstwa danych).
 */
export interface Projekt {
  id: string;
  nazwa: string;
  kategoria: string;
  rozpisane: boolean;
  przeslany: boolean;
  sprawdzony: boolean;
  wydrukowany: boolean;
  kontakt: string | null;
  uwagi: string | null;
  dodal: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
