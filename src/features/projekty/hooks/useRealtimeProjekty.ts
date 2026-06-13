import { useIsMutating, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import type { Projekt } from '@/lib/types';

/** Nazwa kanału Realtime dla tabeli `projekty` (jeden kanał na całą aplikację). */
const CHANNEL_NAME = 'projekty';

type ProjektChangePayload = RealtimePostgresChangesPayload<Projekt>;

/**
 * Wyciąga `id` rekordu z payloadu Realtime.
 * INSERT/UPDATE niosą `new`, DELETE niesie tylko `old` (zwykle z PK).
 * Zwraca `undefined`, gdy payload nie zawiera użytecznego `id` (nie ufamy kształtowi z sieci).
 */
function odczytajId(payload: ProjektChangePayload): string | undefined {
  const nowy = 'new' in payload ? (payload.new as Partial<Projekt>) : undefined;
  if (nowy && typeof nowy.id === 'string') {
    return nowy.id;
  }
  const stary = 'old' in payload ? (payload.old as Partial<Projekt>) : undefined;
  if (stary && typeof stary.id === 'string') {
    return stary.id;
  }
  return undefined;
}

/**
 * Reconcile cache React Query po zdarzeniu Realtime.
 * Strategia: INVALIDACJA (nie chirurgiczny patch) — przy 50–150 wierszach refetch jest tani
 * i eliminuje ryzyko rozjazdu między payloadem a stanem listy (filtry flagi/szukaj/archiwum,
 * sortowanie, granica Zod liczone serwerowo w `useProjektyData`). Patch wymagałby replikacji
 * całej tej logiki po stronie klienta (źródło bugów). Invaliduje wszystkie wpisy listy
 * (`useProjektyData` wołane z różnymi filtrami: liczniki `{}` + tabela `(filtry)`) oraz detal.
 */
function reconcileCache(queryClient: QueryClient, payload: ProjektChangePayload): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });

  const id = odczytajId(payload);
  if (id) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.projekt(id) });
  }
}

/**
 * Synchronizacja na żywo listy projektów (Supabase Realtime → cache React Query).
 *
 * Cały zespół (wspólne konto, 4 osoby) widzi zmiany bez ręcznego odświeżania. Subskrypcja
 * `postgres_changes` (event `*`) na tabeli `projekty` reconciluje cache po każdej zmianie.
 *
 * **Dedup echa własnej mutacji (bez couplingu z `useProjektMutations`):** gdy trwa którakolwiek
 * mutacja (`useIsMutating > 0`), zdarzenie Realtime będące echem tej mutacji jest pomijane.
 * Optimistic update trzyma już prawdę w cache, a `onSettled` mutacji sam zinwaliduje listę po
 * zakończeniu — invalidacja z echa w trakcie trwania mutacji ściągnęłaby stan sprzed commitu
 * (migotanie: optimistic → stara wartość → finalna). Obce zmiany (brak pending mutacji) patchują
 * cache normalnie.
 *
 * Kanał sprzątany w cleanup (`removeChannel`) przy odmontowaniu.
 */
export function useRealtimeProjekty(): void {
  const queryClient = useQueryClient();
  const liczbaMutacji = useIsMutating();

  // Ref z aktualną liczbą trwających mutacji — callback subskrypcji powstaje raz (useEffect []),
  // więc nie może domykać przestarzałej wartości. Ref aktualizowany przy każdym renderze.
  const liczbaMutacjiRef = useRef(liczbaMutacji);
  liczbaMutacjiRef.current = liczbaMutacji;

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL_NAME)
      .on<Projekt>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projekty' },
        (payload) => {
          // Dedup: trwa własna mutacja → to (najpewniej) echo; pomiń, onSettled zreconciluje.
          if (liczbaMutacjiRef.current > 0) {
            return;
          }
          reconcileCache(queryClient, payload);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
