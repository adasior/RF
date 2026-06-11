import { useQuery } from '@tanstack/react-query';

import { queryKeys, type ProjektyFiltry } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import type { Projekt } from '@/lib/types';

/** Konkretne kolumny — nie `select('*')` (data exposure / nadmiarowy transfer). */
const KOLUMNY =
  'id, nazwa, kategoria, rozpisane, przeslany, sprawdzony, wydrukowany, kontakt, uwagi, dodal, archived_at, created_at, updated_at';

async function pobierzProjekty(filtry: ProjektyFiltry): Promise<Projekt[]> {
  let query = supabase.from('projekty').select(KOLUMNY);

  // Domyślnie tylko aktywne (archived_at is null); archiwum:true → tylko zarchiwizowane.
  query = filtry.archiwum
    ? query.not('archived_at', 'is', null)
    : query.is('archived_at', null);

  // Filtr flagi: pokaż projekty, w których ta flaga = false („do zrobienia").
  if (filtry.flaga) {
    query = query.eq(filtry.flaga, false);
  }

  // Szukaj po nazwie (ilike, case-insensitive).
  if (filtry.szukaj && filtry.szukaj.trim().length > 0) {
    query = query.ilike('nazwa', `%${filtry.szukaj.trim()}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Projekt[];
}

/**
 * Lista projektów z filtrami.
 * Domyślnie: aktywne (`archived_at is null`), sortowane `created_at desc`.
 * Filtry flagi + szukaj łączą się przez AND.
 */
export function useProjektyData(filtry: ProjektyFiltry = {}) {
  return useQuery({
    queryKey: queryKeys.lista(filtry),
    queryFn: () => pobierzProjekty(filtry),
  });
}
