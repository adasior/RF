import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PROJEKT_KOLUMNY, queryKeys } from '@/lib/queryKeys';
import { edycjaProjektuInput, nowyProjektInput, projektSchema } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';
import type { EdycjaProjektuInput, FlagaKey, NowyProjektInput, Projekt } from '@/lib/types';

const TOAST_BLAD = 'Błąd — spróbuj ponownie';

interface ToggleFlagaArgs {
  id: string;
  key: FlagaKey;
  nowaWartosc: boolean;
}

interface ToggleFlagaContext {
  poprzednieListy: Array<[readonly unknown[], Projekt[] | undefined]>;
  poprzedniProjekt: Projekt | undefined;
}

interface UseProjektMutationsResult {
  create: UseMutationResult<Projekt, Error, NowyProjektInput>;
  update: UseMutationResult<Projekt, Error, { id: string; input: EdycjaProjektuInput }>;
  toggleFlaga: UseMutationResult<void, Error, ToggleFlagaArgs, ToggleFlagaContext>;
  archive: UseMutationResult<void, Error, string>;
  restore: UseMutationResult<void, Error, string>;
  hardDelete: UseMutationResult<void, Error, string>;
}

function patchFlaga(projekt: Projekt, key: FlagaKey, nowaWartosc: boolean): Projekt {
  return { ...projekt, [key]: nowaWartosc };
}

async function createProjekt(input: NowyProjektInput): Promise<Projekt> {
  // Walidacja Zod PRZED wysłaniem (granica systemu). Rzuca ZodError przy złym input.
  const dane = nowyProjektInput.parse(input);

  // Nowy projekt zawsze startuje z 4 flagami false (formularz ich nie zawiera).
  const { data, error } = await supabase
    .from('projekty')
    .insert({
      nazwa: dane.nazwa,
      kategoria: dane.kategoria,
      dodal: dane.dodal,
      kontakt: dane.kontakt ?? null,
      uwagi: dane.uwagi ?? null,
      rozpisane: false,
      przeslany: false,
      sprawdzony: false,
      wydrukowany: false,
    })
    .select(PROJEKT_KOLUMNY)
    .single();

  if (error) {
    throw error;
  }

  // Granica Zod: odpowiedź bazy walidowana, nie rzutowana (`as`).
  return projektSchema.parse(data);
}

async function updateProjekt(id: string, input: EdycjaProjektuInput): Promise<Projekt> {
  const dane = edycjaProjektuInput.parse(input);

  const { data, error } = await supabase
    .from('projekty')
    .update({
      nazwa: dane.nazwa,
      kategoria: dane.kategoria,
      dodal: dane.dodal,
      kontakt: dane.kontakt ?? null,
      uwagi: dane.uwagi ?? null,
      ...(dane.rozpisane !== undefined ? { rozpisane: dane.rozpisane } : {}),
      ...(dane.przeslany !== undefined ? { przeslany: dane.przeslany } : {}),
      ...(dane.sprawdzony !== undefined ? { sprawdzony: dane.sprawdzony } : {}),
      ...(dane.wydrukowany !== undefined ? { wydrukowany: dane.wydrukowany } : {}),
    })
    .eq('id', id)
    .select(PROJEKT_KOLUMNY)
    .single();

  if (error) {
    throw error;
  }

  return projektSchema.parse(data);
}

async function setArchivedAt(id: string, archivedAt: string | null): Promise<void> {
  const { error } = await supabase
    .from('projekty')
    .update({ archived_at: archivedAt })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

async function deleteProjekt(id: string): Promise<void> {
  const { error } = await supabase.from('projekty').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Mutacje warstwy danych dla projektów.
 * - `create` / `update` — walidacja Zod przed wysłaniem.
 * - `toggleFlaga` — optimistic update cache + rollback przy błędzie.
 * - `archive` / `restore` — soft delete przez `archived_at` (D6).
 * - `hardDelete` — realny DELETE (tylko z widoku archiwum).
 *
 * Każda mutacja w `onError` pokazuje toast — BEZ re-throw (re-throw produkowałby
 * unhandled rejection przy `mutate` bez własnego onError). UI reaguje przez `isError`.
 */
export function useProjektMutations(): UseProjektMutationsResult {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createProjekt,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: () => {
      toast.error(TOAST_BLAD);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EdycjaProjektuInput }) =>
      updateProjekt(id, input),
    onSuccess: (projekt) => {
      queryClient.setQueryData(queryKeys.projekt(projekt.id), projekt);
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: () => {
      toast.error(TOAST_BLAD);
    },
  });

  const toggleFlaga = useMutation<void, Error, ToggleFlagaArgs, ToggleFlagaContext>({
    mutationFn: ({ id, key, nowaWartosc }) => toggleFlagaRequest(id, key, nowaWartosc),
    onMutate: async ({ id, key, nowaWartosc }) => {
      // Wstrzymaj trwające refetche, by nie nadpisały optimistic update.
      await queryClient.cancelQueries({ queryKey: queryKeys.all });

      // Zapamiętaj stan do rollbacku.
      const poprzednieListy = queryClient.getQueriesData<Projekt[]>({
        queryKey: queryKeys.listy(),
      });
      const poprzedniProjekt = queryClient.getQueryData<Projekt>(queryKeys.projekt(id));

      // Optimistic: natychmiast ustaw nową wartość flagi we wszystkich listach + w detalu.
      queryClient.setQueriesData<Projekt[]>({ queryKey: queryKeys.listy() }, (stare) =>
        stare?.map((p) => (p.id === id ? patchFlaga(p, key, nowaWartosc) : p)),
      );
      if (poprzedniProjekt) {
        queryClient.setQueryData<Projekt>(
          queryKeys.projekt(id),
          patchFlaga(poprzedniProjekt, key, nowaWartosc),
        );
      }

      return { poprzednieListy, poprzedniProjekt };
    },
    onError: (_error, { id }, context) => {
      // Rollback do zapamiętanego stanu.
      context?.poprzednieListy.forEach(([klucz, dane]) => {
        queryClient.setQueryData(klucz, dane);
      });
      if (context?.poprzedniProjekt) {
        queryClient.setQueryData(queryKeys.projekt(id), context.poprzedniProjekt);
      }
      toast.error(TOAST_BLAD);
    },
    onSettled: (_data, _error, { id }) => {
      // onMutate patchuje listy ORAZ detal — invaliduj oba, by reconcile objął całość.
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projekt(id) });
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) => setArchivedAt(id, new Date().toISOString()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: () => {
      toast.error(TOAST_BLAD);
    },
  });

  const restore = useMutation({
    mutationFn: (id: string) => setArchivedAt(id, null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: () => {
      toast.error(TOAST_BLAD);
    },
  });

  const hardDelete = useMutation({
    mutationFn: deleteProjekt,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: () => {
      toast.error(TOAST_BLAD);
    },
  });

  return { create, update, toggleFlaga, archive, restore, hardDelete };
}

async function toggleFlagaRequest(
  id: string,
  key: FlagaKey,
  nowaWartosc: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('projekty')
    .update({ [key]: nowaWartosc })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
