import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { PROJEKT_KOLUMNY, queryKeys } from '@/lib/queryKeys';
import { projektSchema } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';
import type { Projekt } from '@/lib/types';

async function pobierzProjekt(id: string): Promise<Projekt> {
  const { data, error } = await supabase
    .from('projekty')
    .select(PROJEKT_KOLUMNY)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  // Granica Zod: odpowiedź bazy walidowana, nie rzutowana (`as`).
  return projektSchema.parse(data);
}

/**
 * Pojedynczy projekt po id (widok szczegółów / edycja).
 * Query uruchamia się tylko gdy `id` jest podane (enabled).
 */
export function useProjektData(id: string | undefined): UseQueryResult<Projekt, Error> {
  return useQuery({
    queryKey: queryKeys.projekt(id ?? ''),
    queryFn: () => {
      // Guard zamiast `id as string` — queryFn nie odpali się bez id (enabled),
      // ale typ wymusza jawną obsługę undefined.
      if (!id) {
        throw new Error('Brak id projektu');
      }
      return pobierzProjekt(id);
    },
    enabled: Boolean(id),
  });
}
