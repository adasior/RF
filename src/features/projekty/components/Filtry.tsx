import { Archive, Search } from 'lucide-react';
import { useMemo } from 'react';

import { FLAGI } from '@/lib/config';
import type { FlagaKey, Projekt } from '@/lib/types';

interface FiltryProps {
  /** Pełny zbiór aktywnych projektów — źródło liczników (D10, client-side). */
  projekty: Projekt[];
  flagaAktywna: FlagaKey | undefined;
  szukaj: string;
  /** Wymiar archiwum: false = aktywne, true = tylko zarchiwizowane (D6). */
  archiwum: boolean;
  onFlagaChange: (flaga: FlagaKey | undefined) => void;
  onSzukajChange: (szukaj: string) => void;
  onArchiwumChange: (archiwum: boolean) => void;
}

interface FiltrPozycja {
  key: FlagaKey | undefined;
  label: string;
  licznik: number;
}

const LINK_BASE =
  'flex items-center gap-1 whitespace-nowrap border-b-2 pb-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus';
const LINK_AKTYWNY = 'border-accent font-medium text-text-primary';
const LINK_NIEAKTYWNY = 'border-transparent text-text-meta hover:text-text-secondary';

const PILL_BASE =
  'inline-flex min-w-4 items-center justify-center rounded-pill px-1.5 py-px text-[9px] font-medium tabular-nums';
const PILL_AKTYWNY = 'bg-accent-light text-accent';
const PILL_NIEAKTYWNY = 'bg-border-row text-text-secondary';

/**
 * Belka filtrów (DESIGN.md „Belka filtrów"): 5 linków z pillem-licznikiem + pole Szukaj.
 * Aktywny filtr podkreślony terakotą. Liczniki liczone client-side z `projekty` (D10).
 * Czysto prezentacyjny — stan trzyma `useFiltry`, dane dostarcza `ListaPage`.
 */
export function Filtry({
  projekty,
  flagaAktywna,
  szukaj,
  archiwum,
  onFlagaChange,
  onSzukajChange,
  onArchiwumChange,
}: FiltryProps) {
  const pozycje = useMemo<FiltrPozycja[]>(() => {
    const flagowe = FLAGI.map((flaga) => ({
      key: flaga.key,
      label: flaga.filterLabel,
      // „Do zrobienia" = flaga false.
      licznik: projekty.filter((projekt) => !projekt[flaga.key]).length,
    }));

    return [{ key: undefined, label: 'Wszystkie', licznik: projekty.length }, ...flagowe];
  }, [projekty]);

  return (
    <div className="flex items-center gap-3 border-b border-border bg-bg px-5">
      <div className="flex h-10 flex-1 items-center gap-[18px] overflow-x-auto">
        {!archiwum &&
          pozycje.map((pozycja) => {
            const isAktywny = pozycja.key === flagaAktywna;

            return (
              <button
                key={pozycja.key ?? 'wszystkie'}
                type="button"
                onClick={() => onFlagaChange(pozycja.key)}
                aria-pressed={isAktywny}
                className={`${LINK_BASE} ${isAktywny ? LINK_AKTYWNY : LINK_NIEAKTYWNY}`}
              >
                {pozycja.label}
                <span className={`${PILL_BASE} ${isAktywny ? PILL_AKTYWNY : PILL_NIEAKTYWNY}`}>
                  {pozycja.licznik}
                </span>
              </button>
            );
          })}
        {archiwum && (
          <span className="text-xs font-medium text-text-primary">Archiwum</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onArchiwumChange(!archiwum)}
        aria-pressed={archiwum}
        className={`${LINK_BASE} shrink-0 ${archiwum ? LINK_AKTYWNY : LINK_NIEAKTYWNY}`}
      >
        <Archive size={13} aria-hidden="true" />
        {archiwum ? 'Pokaż aktywne' : 'Archiwum'}
      </button>

      <search className="shrink-0">
        <label htmlFor="filtry-szukaj" className="sr-only">
          Szukaj projektu po nazwie
        </label>
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-meta"
            aria-hidden="true"
          />
          <input
            id="filtry-szukaj"
            type="search"
            value={szukaj}
            onChange={(event) => onSzukajChange(event.target.value)}
            placeholder="Szukaj…"
            className="h-8 w-40 rounded-input border border-border bg-surface pl-8 pr-2.5 text-xs text-text-primary placeholder:text-text-meta focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          />
        </div>
      </search>
    </div>
  );
}

export default Filtry;
