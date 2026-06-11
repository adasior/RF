import type { z } from 'zod';

import type { Flaga } from './config';
import type { edycjaProjektuInput, nowyProjektInput } from './schemas';

/**
 * Klucz pojedynczej flagi boolean (rozpisane / przeslany / sprawdzony / wydrukowany).
 * Wyprowadzony z config.FLAGI, by typ pozostał spójny z konfiguracją.
 */
export type FlagaKey = Flaga['key'];

/** Input nowego projektu (z.infer ze schemas.nowyProjektInput) — bez flag. */
export type NowyProjektInput = z.infer<typeof nowyProjektInput>;

/** Input edycji projektu (z.infer ze schemas.edycjaProjektuInput) — z opcjonalnymi flagami. */
export type EdycjaProjektuInput = z.infer<typeof edycjaProjektuInput>;

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
