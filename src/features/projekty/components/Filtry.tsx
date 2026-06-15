import { Archive, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { FLAGI } from '@/lib/config';
import type { FlagaKey, Projekt } from '@/lib/types';

import { useIsMobile } from '../hooks/useIsMobile';

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

// Pozycja w rozwijanym menu mobilnym — pełna szerokość, wysoki tap target (≥44px).
const MENU_ITEM_BASE =
  'flex min-h-11 w-full items-center justify-between gap-2 rounded-flag px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus';
const MENU_ITEM_AKTYWNY = 'bg-accent-light font-medium text-accent';
const MENU_ITEM_NIEAKTYWNY = 'text-text-secondary hover:bg-surface-row';

/** Pill z licznikiem „do zrobienia" — wspólny dla belki desktop i menu mobilnego. */
function LicznikPill({ licznik, isAktywny }: { licznik: number; isAktywny: boolean }) {
  return (
    <span className={`${PILL_BASE} ${isAktywny ? PILL_AKTYWNY : PILL_NIEAKTYWNY}`}>{licznik}</span>
  );
}

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
  const isMobile = useIsMobile();
  const [isOtwarta, setIsOtwarta] = useState(false);

  const pozycje = useMemo<FiltrPozycja[]>(() => {
    const flagowe = FLAGI.map((flaga) => ({
      key: flaga.key,
      label: flaga.filterLabel,
      // „Do zrobienia" = flaga false.
      licznik: projekty.filter((projekt) => !projekt[flaga.key]).length,
    }));

    return [{ key: undefined, label: 'Wszystkie', licznik: projekty.length }, ...flagowe];
  }, [projekty]);

  const aktywnaPozycja = pozycje.find((pozycja) => pozycja.key === flagaAktywna) ?? pozycje[0];

  // Escape zamyka rozwinięte menu filtrów (mobile). Cleanup przez AbortController.
  useEffect(() => {
    if (!isOtwarta) {
      return undefined;
    }
    const controller = new AbortController();
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          setIsOtwarta(false);
        }
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [isOtwarta]);

  const handleWybierz = (key: FlagaKey | undefined): void => {
    onFlagaChange(key);
    setIsOtwarta(false);
  };

  return (
    <div className="relative flex items-center gap-3 border-b border-border bg-bg px-5">
      {/* Desktop: lista filtrów rośnie i przewija się poziomo. Mobile: pojedynczy
          trigger o naturalnej szerokości (bez scrolla — przestrzeń oddaje „Szukaj"). */}
      <div
        className={`flex h-10 items-center gap-[18px] ${
          isMobile ? 'shrink-0' : 'flex-1 overflow-x-auto'
        }`}
      >
        {archiwum ? (
          <span className="text-xs font-medium text-text-primary">Archiwum</span>
        ) : isMobile ? (
          <button
            type="button"
            onClick={() => setIsOtwarta((otwarta) => !otwarta)}
            aria-expanded={isOtwarta}
            aria-controls="filtry-menu"
            className={`${LINK_BASE} ${LINK_AKTYWNY}`}
          >
            {aktywnaPozycja.label}
            <LicznikPill licznik={aktywnaPozycja.licznik} isAktywny />
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform ${isOtwarta ? 'rotate-180' : ''}`}
            />
          </button>
        ) : (
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
                <LicznikPill licznik={pozycja.licznik} isAktywny={isAktywny} />
              </button>
            );
          })
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

      {isMobile && !archiwum && isOtwarta && (
        <>
          {/* Backdrop — klik poza menu zamyka (z-index pod panelem). */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setIsOtwarta(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            id="filtry-menu"
            className="absolute inset-x-3 top-full z-50 mt-1 flex flex-col gap-0.5 rounded-card border border-border bg-surface p-1.5 shadow-lg"
          >
            {pozycje.map((pozycja) => {
              const isAktywny = pozycja.key === flagaAktywna;

              return (
                <button
                  key={pozycja.key ?? 'wszystkie'}
                  type="button"
                  onClick={() => handleWybierz(pozycja.key)}
                  aria-pressed={isAktywny}
                  className={`${MENU_ITEM_BASE} ${isAktywny ? MENU_ITEM_AKTYWNY : MENU_ITEM_NIEAKTYWNY}`}
                >
                  {pozycja.label}
                  <LicznikPill licznik={pozycja.licznik} isAktywny={isAktywny} />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Mobile: pole zwęża się (flex-1 min-w-0), by trigger zmieścił się bez scrolla. */}
      <search className={isMobile ? 'min-w-0 flex-1' : 'shrink-0'}>
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
            className={`h-8 rounded-input border border-border bg-surface pl-8 pr-2.5 text-xs text-text-primary placeholder:text-text-meta focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
              isMobile ? 'w-full' : 'w-40'
            }`}
          />
        </div>
      </search>
    </div>
  );
}

export default Filtry;
