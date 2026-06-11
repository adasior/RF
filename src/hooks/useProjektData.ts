import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import type { Projekt } from '@/lib/types';

/** Konkretne kolumny — nie `select('*')` (data exposure / nadmiarowy transfer). */
const KOLUMNY =
  'id, nazwa, kategoria, rozpisane, przeslany, sprawdzony, wydrukowany, kontakt, uwagi, dodal, archived_at, created_at, updated_at';

async function pobierzProjekt(id: string): Promise<Projekt> {
  const { data, error } = await supabase
    .from('projekty')
    .select(KOLUMNY)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as Projekt;
}

/**
 * Pojedynczy projekt po id (widok szczegółów / edycja).
 * Query uruchamia się tylko gdy `id` jest podane (enabled).
 */
export function useProjektData(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projekt(id ?? ''),
    queryFn: () => pobierzProjekt(id as string),
    enabled: Boolean(id),
  });
}
