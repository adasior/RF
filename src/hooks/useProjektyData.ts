import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { PROJEKT_KOLUMNY, queryKeys, type ProjektyFiltry } from '@/lib/queryKeys';
import { projektSchema } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';
import type { Projekt } from '@/lib/types';

/** Maksymalna długość frazy „Szukaj" — spójnie z limitem `nazwa` w schemas.ts (200). */
const SZUKAJ_MAX_DLUGOSC = 200;

/**
 * Escapuje metaznaki wzorca LIKE/ILIKE (`\`, `%`, `_`), by user input
 * był traktowany jako literał, a nie wzorzec (LIKE injection).
 */
function escapeLike(wartosc: string): string {
  return wartosc.replace(/[\\%_]/g, (znak) => `\\${znak}`);
}

async function pobierzProjekty(filtry: ProjektyFiltry): Promise<Projekt[]> {
  let query = supabase.from('projekty').select(PROJEKT_KOLUMNY);

  // Domyślnie tylko aktywne (archived_at is null); archiwum:true → tylko zarchiwizowane.
  query = filtry.archiwum
    ? query.not('archived_at', 'is', null)
    : query.is('archived_at', null);

  // Filtr flagi: pokaż projekty, w których ta flaga = false („do zrobienia").
  if (filtry.flaga) {
    query = query.eq(filtry.flaga, false);
  }

  // Szukaj po nazwie (ilike, case-insensitive) — input escapowany i przycięty na granicy.
  const szukaj = filtry.szukaj?.trim().slice(0, SZUKAJ_MAX_DLUGOSC);
  if (szukaj && szukaj.length > 0) {
    query = query.ilike('nazwa', `%${escapeLike(szukaj)}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Granica Zod: odpowiedź bazy walidowana, nie rzutowana (`as`).
  return projektSchema.array().parse(data ?? []);
}

/**
 * Lista projektów z filtrami.
 * Domyślnie: aktywne (`archived_at is null`), sortowane `created_at desc`.
 * Filtry flagi + szukaj łączą się przez AND.
 */
export function useProjektyData(filtry: ProjektyFiltry = {}): UseQueryResult<Projekt[], Error> {
  return useQuery({
    queryKey: queryKeys.lista(filtry),
    queryFn: () => pobierzProjekty(filtry),
  });
}
