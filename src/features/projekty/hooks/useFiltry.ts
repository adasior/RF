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
  /** Przełącz wymiar archiwum (aktywne ↔ tylko zarchiwizowane); czyści filtr flagi. */
  setArchiwum: (archiwum: boolean) => void;
  /** „Pokaż wszystkie" — flaga undefined + czyści szukaj. */
  reset: () => void;
}

/**
 * Stan belki filtrów (U6 + U10): wymiar archiwum + aktywna flaga + debounce’owane „Szukaj".
 * „Wszystkie" = `flaga: undefined`. `archiwum: false` = aktywne, `true` = tylko zarchiwizowane.
 * Przełączenie wymiaru archiwum czyści filtr flagi (inny kontekst akcji).
 */
export function useFiltry(): UseFiltryResult {
  const [flaga, setFlaga] = useState<FlagaKey | undefined>(undefined);
  const [archiwum, setArchiwumState] = useState<boolean>(false);
  const [szukajInput, setSzukajInput] = useState<string>('');
  const [szukajDebounced, setSzukajDebounced] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSzukajDebounced(szukajInput);
    }, SZUKAJ_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [szukajInput]);

  const setArchiwum = (nowyArchiwum: boolean): void => {
    setArchiwumState(nowyArchiwum);
    setFlaga(undefined);
  };

  const reset = (): void => {
    setFlaga(undefined);
    setSzukajInput('');
    setSzukajDebounced('');
  };

  const filtry = useMemo<ProjektyFiltry>(
    () => ({ flaga, szukaj: szukajDebounced, archiwum }),
    [flaga, szukajDebounced, archiwum],
  );

  return {
    filtry,
    szukajInput,
    setFlaga,
    setSzukaj: setSzukajInput,
    setArchiwum,
    reset,
  };
}
