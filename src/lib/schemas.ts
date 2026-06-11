import { z } from 'zod';

/**
 * Schematy Zod — granica walidacji warstwy danych (front → Supabase).
 * Komunikaty po polsku. Źródło prawdy schematu: SPEC_projekty.md (v5) + decyzja D6 (archived_at).
 */

/**
 * Pełny rekord projektu zwracany z bazy (tabela `projekty`).
 * Odpowiada interfejsowi `Projekt` z types.ts — z którego wyprowadzamy typ przez z.infer.
 */
export const projektSchema = z.object({
  id: z.string().uuid(),
  nazwa: z.string(),
  kategoria: z.string(),
  rozpisane: z.boolean(),
  przeslany: z.boolean(),
  sprawdzony: z.boolean(),
  wydrukowany: z.boolean(),
  kontakt: z.string().nullable(),
  uwagi: z.string().nullable(),
  dodal: z.string(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Input nowego projektu (formularz).
 * Flagi NIE są częścią inputu — nowy projekt zawsze startuje z 4 flagami false,
 * które ustawia mutacja `create` (a nie użytkownik).
 * Wymagane: nazwa, kategoria, dodal. Opcjonalne: kontakt, uwagi.
 */
export const nowyProjektInput = z.object({
  nazwa: z
    .string({ required_error: 'Nazwa jest wymagana' })
    .trim()
    .min(1, 'Nazwa jest wymagana')
    .max(200, 'Nazwa jest za długa'),
  kategoria: z
    .string({ required_error: 'Kategoria jest wymagana' })
    .trim()
    .min(1, 'Kategoria jest wymagana'),
  dodal: z
    .string({ required_error: 'Pole „Dodał" jest wymagane' })
    .trim()
    .min(1, 'Pole „Dodał" jest wymagane'),
  kontakt: z.string().trim().max(200, 'Kontakt jest za długi').nullish(),
  uwagi: z.string().trim().max(2000, 'Uwagi są za długie').nullish(),
});

/**
 * Input edycji projektu — jak nowy projekt, ale z możliwością zmiany 4 flag.
 */
export const edycjaProjektuInput = nowyProjektInput.extend({
  rozpisane: z.boolean().optional(),
  przeslany: z.boolean().optional(),
  sprawdzony: z.boolean().optional(),
  wydrukowany: z.boolean().optional(),
});
