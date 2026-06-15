import { RotateCcw, Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { FLAGI } from '@/lib/config';
import { formatRelativeData } from '@/lib/format';
import type { Projekt } from '@/lib/types';

import { useProjektMutations } from '@/hooks/useProjektMutations';

import { AkcjeDialogi } from './AkcjeDialogi';
import { FlagBtn } from './FlagBtn';
import { useProjektAkcje } from '../hooks/useProjektAkcje';

interface ProjektTabelaProps {
  projekty: Projekt[];
  /** Kontekst widoku: false = aktywne („Usuń"), true = archiwum („Przywróć" + „Usuń trwale"). */
  archiwum: boolean;
}

const AKCJA_BTN =
  'inline-flex items-center gap-1 rounded-[7px] border border-border bg-transparent px-2 py-1 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-60';

const TH_BASE = 'px-2.5 py-2.5 text-[10px] font-medium uppercase tracking-[0.07em] text-text-meta whitespace-nowrap';

/** Równa szerokość wszystkich 4 kolumn flag (px) = szerokość najszerszej („PRZESŁANY HAFT/SITO"). */
const FLAGA_COL_WIDTH = 234;

/** Czy wszystkie 4 flagi są true → wiersz przygaszony (opacity 0.4). */
function isKompletny(projekt: Projekt): boolean {
  return FLAGI.every((flaga) => projekt[flaga.key]);
}

/**
 * Tabela desktop (DESIGN.md ≥ 768px). Kolumny: Kategoria · Nazwa · Kontakt · 4× flaga · Dodano.
 * Klik wiersza → szczegóły; klik flagi (stopPropagation) → optimistic toggle + toast.
 * Wiersz z 4× true → `opacity-40`.
 */
export function ProjektTabela({ projekty, archiwum }: ProjektTabelaProps) {
  const navigate = useNavigate();
  const { toggleFlaga } = useProjektMutations();
  const akcje = useProjektAkcje();

  const stopProp = (event: MouseEvent): void => event.stopPropagation();

  const makeToggleHandler = (
    projekt: Projekt,
    key: (typeof FLAGI)[number]['key'],
    label: string,
  ): ((nowaWartosc: boolean) => void) => {
    return (nowaWartosc: boolean): void => {
      toggleFlaga.mutate(
        { id: projekt.id, key, nowaWartosc },
        {
          onSuccess: () => {
            toast(`${projekt.nazwa} — ${label}: ${nowaWartosc ? 'TAK' : 'NIE'}`);
          },
          // Toast błędu i rollback obsługuje sam hook mutacji (bez re-throw).
        },
      );
    };
  };

  return (
    <>
      <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
        <thead>
          <tr className="border-b border-border bg-surface-alt">
            <th className={`${TH_BASE} pl-5 text-left`}>Kategoria</th>
            <th className={`${TH_BASE} text-left`} style={{ minWidth: 140 }}>
              Nazwa projektu
            </th>
            <th className={`${TH_BASE} text-left`}>Kontakt</th>
            {FLAGI.map((flaga) => (
              <th
                key={flaga.key}
                className={`${TH_BASE} text-center`}
                style={{ width: FLAGA_COL_WIDTH }}
              >
                {flaga.columnLabel ?? flaga.label}
              </th>
            ))}
            <th className={`${TH_BASE} text-right`}>Dodano</th>
            <th className={`${TH_BASE} pr-5 text-right`}>
              <span className="sr-only">Akcje</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projekty.map((projekt) => (
            <tr
              key={projekt.id}
              onClick={() => navigate(`/projekt/${projekt.id}`)}
              className={`cursor-pointer border-b border-border-row transition-colors hover:bg-surface-row ${
                isKompletny(projekt) ? 'opacity-40' : ''
              }`}
            >
              <td className="px-2.5 py-2 pl-5 align-middle">
                <span className="inline-block whitespace-nowrap rounded-pill border border-[#DDD7CC] bg-[#F0EDE7] px-[9px] py-[3px] text-[10px] font-medium text-[#6B6354]">
                  {projekt.kategoria}
                </span>
              </td>
              <td className="max-w-0 px-2.5 py-2 align-middle">
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-text-primary">
                  {projekt.nazwa}
                </span>
              </td>
              <td className="px-2.5 py-2 align-middle text-xs text-text-secondary">
                {projekt.kontakt ?? '—'}
              </td>
              {FLAGI.map((flaga) => (
                <td key={flaga.key} className="px-2.5 py-2 align-middle">
                  <FlagBtn
                    label={flaga.label}
                    isActive={projekt[flaga.key]}
                    size="table"
                    disabled={toggleFlaga.isPending}
                    onToggle={makeToggleHandler(projekt, flaga.key, flaga.label)}
                  />
                </td>
              ))}
              <td className="px-2.5 py-2 text-right align-middle text-[11px] text-text-meta whitespace-nowrap">
                {formatRelativeData(projekt.created_at)}
              </td>
              <td className="px-2.5 py-2 pr-5 text-right align-middle whitespace-nowrap" onClick={stopProp}>
                {archiwum ? (
                  <div className="inline-flex gap-1.5">
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
                  <button
                    type="button"
                    onClick={() => akcje.otworzUsun(projekt)}
                    aria-label={`Usuń projekt ${projekt.nazwa}`}
                    className={`${AKCJA_BTN} text-danger`}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    Usuń
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AkcjeDialogi akcje={akcje} />
    </>
  );
}

export default ProjektTabela;
