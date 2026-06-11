import { useEffect, useMemo, useState } from 'react';

import type { ProjektyFiltry } from '@/lib/queryKeys';
import type { FlagaKey } from '@/lib/types';

/** Opóźnienie debounce dla pola „Szukaj" (ms). */
const SZUKAJ_DEBOUNCE_MS = 300;

export interface UseFiltryResult {
  /** Filtry gotowe do przekazania do `useProjektyData` (szukaj debounce’owany). */
  filtry: ProjektyFiltry;
  /** Surowa wartość pola tekstowego (kontrolowany input, bez debounce). */
  szukajInput: string;
  setFlaga: (flaga: FlagaKey | undefined) => void;
  setSzukaj: (szukaj: string) => void;
  /** „Pokaż wszystkie" — flaga undefined + czyści szukaj. */
  reset: () => void;
}

/**
 * Stan belki filtrów (U6): aktywna flaga + debounce’owane pole „Szukaj".
 * „Wszystkie" = `flaga: undefined`. `archiwum` zawsze false (widok listy aktywnych).
 */
export function useFiltry(): UseFiltryResult {
  const [flaga, setFlaga] = useState<FlagaKey | undefined>(undefined);
  const [szukajInput, setSzukajInput] = useState<string>('');
  const [szukajDebounced, setSzukajDebounced] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSzukajDebounced(szukajInput);
    }, SZUKAJ_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [szukajInput]);

  const reset = (): void => {
    setFlaga(undefined);
    setSzukajInput('');
    setSzukajDebounced('');
  };

  const filtry = useMemo<ProjektyFiltry>(
    () => ({ flaga, szukaj: szukajDebounced, archiwum: false }),
    [flaga, szukajDebounced],
  );

  return {
    filtry,
    szukajInput,
    setFlaga,
    setSzukaj: setSzukajInput,
    reset,
  };
}
