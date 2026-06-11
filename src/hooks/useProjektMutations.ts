import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { edycjaProjektuInput, nowyProjektInput } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';
import type { EdycjaProjektuInput, FlagaKey, NowyProjektInput, Projekt } from '@/lib/types';

/** Konkretne kolumny — nie `select('*')`. */
const KOLUMNY =
  'id, nazwa, kategoria, rozpisane, przeslany, sprawdzony, wydrukowany, kontakt, uwagi, dodal, archived_at, created_at, updated_at';

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
    .select(KOLUMNY)
    .single();

  if (error) {
    throw error;
  }

  return data as Projekt;
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
    .select(KOLUMNY)
    .single();

  if (error) {
    throw error;
  }

  return data as Projekt;
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
 * - `toggleFlaga` — optimistic update cache + rollback przy błędzie; onError → toast + re-throw.
 * - `archive` / `restore` — soft delete przez `archived_at` (D6).
 * - `hardDelete` — realny DELETE (tylko z widoku archiwum).
 *
 * Każda mutacja w `onError` pokazuje toast i RE-THROW, by UI mógł zareagować.
 */
export function useProjektMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createProjekt,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: (error) => {
      toast.error(TOAST_BLAD);
      throw error;
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EdycjaProjektuInput }) =>
      updateProjekt(id, input),
    onSuccess: (projekt) => {
      queryClient.setQueryData(queryKeys.projekt(projekt.id), projekt);
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: (error) => {
      toast.error(TOAST_BLAD);
      throw error;
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
    onError: (error, { id }, context) => {
      // Rollback do zapamiętanego stanu.
      context?.poprzednieListy.forEach(([klucz, dane]) => {
        queryClient.setQueryData(klucz, dane);
      });
      if (context?.poprzedniProjekt) {
        queryClient.setQueryData(queryKeys.projekt(id), context.poprzedniProjekt);
      }
      toast.error(TOAST_BLAD);
      throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) => setArchivedAt(id, new Date().toISOString()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: (error) => {
      toast.error(TOAST_BLAD);
      throw error;
    },
  });

  const restore = useMutation({
    mutationFn: (id: string) => setArchivedAt(id, null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: (error) => {
      toast.error(TOAST_BLAD);
      throw error;
    },
  });

  const hardDelete = useMutation({
    mutationFn: deleteProjekt,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listy() });
    },
    onError: (error) => {
      toast.error(TOAST_BLAD);
      throw error;
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
