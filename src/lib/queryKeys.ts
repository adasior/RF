import type { FlagaKey } from './types';

/**
 * Filtry listy projektów (kształt współdzielony przez hooki i komponenty).
 * - `flaga`  — pokaż projekty, w których ta flaga = false („do zrobienia").
 * - `szukaj` — filtr `ilike` po kolumnie `nazwa`.
 * - `archiwum` — true → tylko zarchiwizowane (`archived_at is not null`);
 *                domyślnie/false → tylko aktywne (`archived_at is null`).
 */
export interface ProjektyFiltry {
  flaga?: FlagaKey;
  szukaj?: string;
  archiwum?: boolean;
}

/**
 * Typowany factory kluczy React Query dla domeny `projekty`.
 * Spójna hierarchia ułatwia invalidację (np. `queryKeys.listy()` unieważnia wszystkie listy).
 */
export const queryKeys = {
  all: ['projekty'] as const,
  listy: () => [...queryKeys.all, 'lista'] as const,
  lista: (filtry: ProjektyFiltry) => [...queryKeys.listy(), filtry] as const,
  projekty: () => [...queryKeys.all, 'projekt'] as const,
  projekt: (id: string) => [...queryKeys.projekty(), id] as const,
} as const;
