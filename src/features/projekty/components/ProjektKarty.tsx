import { RotateCcw, Trash2 } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { FLAGI, type Flaga } from '@/lib/config';
import { formatRelativeData } from '@/lib/format';
import type { Projekt } from '@/lib/types';

import { useProjektMutations } from '@/hooks/useProjektMutations';

import { AkcjeDialogi } from './AkcjeDialogi';
import { ConfirmSheet } from './ConfirmSheet';
import { FlagBtn } from './FlagBtn';
import { useProjektAkcje } from '../hooks/useProjektAkcje';

interface ProjektKartyProps {
  projekty: Projekt[];
  /** Kontekst widoku: false = aktywne („Usuń"), true = archiwum („Przywróć" + „Usuń trwale"). */
  archiwum: boolean;
}

const AKCJA_BTN =
  'inline-flex items-center justify-center gap-1 rounded-[7px] border border-border bg-transparent px-2 py-1.5 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-60';

/** Zmiana flagi czekająca na potwierdzenie w ConfirmSheet (D5: mobile bez natychmiastowego toggle). */
interface OczekujacaZmiana {
  projekt: Projekt;
  flaga: Flaga;
  nowaWartosc: boolean;
}

/** Czy wszystkie 4 flagi są true → karta przygaszona (opacity 0.4). */
function isKompletny(projekt: Projekt): boolean {
  return FLAGI.every((flaga) => projekt[flaga.key]);
}

/**
 * Karty mobile (DESIGN.md < 768px). Karta: kategoria pill + data względna,
 * nazwa, flagi 2×2 (`FlagBtn size='card'`). Klik karty poza flagami → szczegóły.
 * Klik flagi NIE mutuje — otwiera `ConfirmSheet`; „Tak, zmień" → ta sama ścieżka
 * `toggleFlaga` (optimistic + rollback) co desktop + toast „LABEL: TAK/NIE".
 */
export function ProjektKarty({ projekty, archiwum }: ProjektKartyProps) {
  const navigate = useNavigate();
  const { toggleFlaga } = useProjektMutations();
  const akcje = useProjektAkcje();
  const [zmiana, setZmiana] = useState<OczekujacaZmiana | null>(null);

  const stopProp = (event: MouseEvent): void => event.stopPropagation();

  const handleConfirm = (): void => {
    if (!zmiana) {
      return;
    }
    const { projekt, flaga, nowaWartosc } = zmiana;
    toggleFlaga.mutate(
      { id: projekt.id, key: flaga.key, nowaWartosc },
      {
        onSuccess: () => {
          toast(`${flaga.label}: ${nowaWartosc ? 'TAK' : 'NIE'}`);
        },
        // Toast błędu i rollback obsługuje sam hook mutacji (bez re-throw).
      },
    );
    setZmiana(null);
  };

  return (
    <>
      <div className="flex flex-col gap-2 px-3 py-[10px]">
        {projekty.map((projekt) => (
          <div
            key={projekt.id}
            onClick={() => navigate(`/projekt/${projekt.id}`)}
            className={`cursor-pointer rounded-card border border-border bg-surface px-3 py-[10px] ${
              isKompletny(projekt) ? 'opacity-40' : ''
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="whitespace-nowrap rounded-pill border border-[#DDD7CC] bg-[#F0EDE7] px-[9px] py-[3px] text-[9px] font-medium text-[#6B6354]">
                {projekt.kategoria}
              </span>
              <span className="whitespace-nowrap text-[10px] text-text-meta">
                {formatRelativeData(projekt.created_at)}
              </span>
            </div>
            <p className="mb-[7px] overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-text-primary">
              {projekt.nazwa}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {FLAGI.map((flaga) => (
                <FlagBtn
                  key={flaga.key}
                  label={flaga.label}
                  isActive={projekt[flaga.key]}
                  size="card"
                  disabled={toggleFlaga.isPending}
                  onToggle={(nowaWartosc) => setZmiana({ projekt, flaga, nowaWartosc })}
                />
              ))}
            </div>

            {archiwum ? (
              <div className="mt-2 grid grid-cols-2 gap-1" onClick={stopProp}>
                <button
                  type="button"
                  onClick={() => akcje.przywroc(projekt)}
                  disabled={akcje.isPrzywracanie}
                  className={`${AKCJA_BTN} text-text-secondary`}
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  Przywróć
                </button>
                <button
                  type="button"
                  onClick={() => akcje.otworzHard(projekt)}
                  className={`${AKCJA_BTN} text-danger`}
                >
                  <Trash2 size={12} aria-hidden="true" />
                  Usuń trwale
                </button>
              </div>
            ) : (
              <div className="mt-2" onClick={stopProp}>
                <button
                  type="button"
                  onClick={() => akcje.otworzUsun(projekt)}
                  aria-label={`Usuń projekt ${projekt.nazwa}`}
                  className={`${AKCJA_BTN} w-full text-danger`}
                >
                  <Trash2 size={12} aria-hidden="true" />
                  Usuń
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {zmiana && (
        <ConfirmSheet
          nazwa={zmiana.projekt.nazwa}
          flagaLabel={zmiana.flaga.label}
          nowaWartosc={zmiana.nowaWartosc}
          onConfirm={handleConfirm}
          onCancel={() => setZmiana(null)}
        />
      )}

      <AkcjeDialogi akcje={akcje} />
    </>
  );
}

export default ProjektKarty;
