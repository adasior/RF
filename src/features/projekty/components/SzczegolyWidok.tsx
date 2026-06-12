import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { FLAGI, type Flaga } from '@/lib/config';
import { formatDataPelna } from '@/lib/format';
import type { Projekt } from '@/lib/types';

import { useProjektMutations } from '@/hooks/useProjektMutations';

import { useIsMobile } from '../hooks/useIsMobile';

import { ConfirmSheet } from './ConfirmSheet';
import { FlagBtn } from './FlagBtn';

interface SzczegolyWidokProps {
  projekt: Projekt;
  onEdytuj: () => void;
  onUsun: () => void;
  isUsuwanie: boolean;
}

/** Zmiana flagi czekająca na potwierdzenie w ConfirmSheet (D5: mobile bez natychmiastowego toggle). */
interface OczekujacaZmiana {
  flaga: Flaga;
  nowaWartosc: boolean;
}

/** Pełna etykieta flagi w szczegółach — druga flaga: „PRZESŁANY HAFT/SITO" (DESIGN.md). */
function detailLabel(flaga: Flaga): string {
  return (flaga.columnLabel ?? flaga.label).toUpperCase();
}

const ETYKIETA_SEKCJI =
  'mb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-text-meta';
const PRZYCISK_HEADER =
  'rounded-[8px] border border-border bg-transparent text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus';

/**
 * Widok szczegółów projektu read-only (DESIGN.md „Widok szczegółów"):
 * header Wróć | Edytuj + Usuń → kategoria pill + data pełna → nazwa 22px →
 * rząd `FlagBtn size='detail'` z pełnymi etykietami → grid 3 kol
 * Kontakt / Dodał / Ostatnia zmiana → Uwagi pełna szerokość.
 * Toggle flagi: desktop natychmiastowy, mobile przez `ConfirmSheet` (D5).
 */
export function SzczegolyWidok({ projekt, onEdytuj, onUsun, isUsuwanie }: SzczegolyWidokProps) {
  const isMobile = useIsMobile();
  const { toggleFlaga } = useProjektMutations();
  const [zmiana, setZmiana] = useState<OczekujacaZmiana | null>(null);

  const mutujFlage = (flaga: Flaga, nowaWartosc: boolean): void => {
    toggleFlaga.mutate(
      { id: projekt.id, key: flaga.key, nowaWartosc },
      {
        onSuccess: () => {
          toast(`${flaga.label}: ${nowaWartosc ? 'TAK' : 'NIE'}`);
        },
        // Toast błędu i rollback obsługuje sam hook mutacji (bez re-throw).
      },
    );
  };

  const makeToggleHandler = (flaga: Flaga): ((nowaWartosc: boolean) => void) => {
    return (nowaWartosc: boolean): void => {
      if (isMobile) {
        setZmiana({ flaga, nowaWartosc });
        return;
      }
      mutujFlage(flaga, nowaWartosc);
    };
  };

  const handleConfirm = (): void => {
    if (!zmiana) {
      return;
    }
    mutujFlage(zmiana.flaga, zmiana.nowaWartosc);
    setZmiana(null);
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Wróć
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onEdytuj}
            className={`${PRZYCISK_HEADER} inline-flex items-center gap-1.5 px-3.5 py-[7px] font-medium text-text-primary`}
          >
            <Pencil size={14} aria-hidden="true" />
            Edytuj
          </button>
          <button
            type="button"
            onClick={onUsun}
            disabled={isUsuwanie}
            aria-label="Usuń projekt"
            className={`${PRZYCISK_HEADER} px-3 py-[7px] text-danger disabled:opacity-60`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-[22px]">
        <div className="mb-[10px] flex items-center gap-2">
          <span className="whitespace-nowrap rounded-pill border border-[#DDD7CC] bg-[#F0EDE7] px-[9px] py-[3px] text-[10px] font-medium text-[#6B6354]">
            {projekt.kategoria}
          </span>
          <span className="text-[11px] text-text-meta">
            dodano {formatDataPelna(projekt.created_at)}
          </span>
        </div>

        <h1 className="mb-[18px] text-[22px] font-bold leading-[1.2] tracking-[-0.02em] text-text-primary">
          {projekt.nazwa}
        </h1>

        <div className="mb-[22px] flex flex-wrap gap-2">
          {FLAGI.map((flaga) => (
            <FlagBtn
              key={flaga.key}
              label={detailLabel(flaga)}
              isActive={projekt[flaga.key]}
              size="detail"
              disabled={toggleFlaga.isPending}
              onToggle={makeToggleHandler(flaga)}
            />
          ))}
        </div>

        <div className="mb-[18px] border-t border-border" />

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
          <div>
            <dt className={ETYKIETA_SEKCJI}>Kontakt</dt>
            <dd className="text-sm text-text-primary">{projekt.kontakt ?? '—'}</dd>
          </div>
          <div>
            <dt className={ETYKIETA_SEKCJI}>Dodał</dt>
            <dd className="text-sm text-text-primary">{projekt.dodal}</dd>
          </div>
          <div>
            <dt className={ETYKIETA_SEKCJI}>Ostatnia zmiana</dt>
            <dd className="text-[13px] text-text-secondary">
              {formatDataPelna(projekt.updated_at)}
            </dd>
          </div>
          <div className="md:col-span-3">
            <dt className={ETYKIETA_SEKCJI}>Uwagi</dt>
            <dd className="text-[13px] leading-[1.6] text-text-secondary">
              {projekt.uwagi ?? '—'}
            </dd>
          </div>
        </dl>
      </main>

      {zmiana && (
        <ConfirmSheet
          nazwa={projekt.nazwa}
          flagaLabel={detailLabel(zmiana.flaga)}
          nowaWartosc={zmiana.nowaWartosc}
          onConfirm={handleConfirm}
          onCancel={() => setZmiana(null)}
        />
      )}
    </div>
  );
}

export default SzczegolyWidok;
