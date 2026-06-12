import { useId } from 'react';

import { FlagBtn } from './FlagBtn';

interface ConfirmSheetProps {
  /** Nazwa projektu, którego dotyczy zmiana flagi. */
  nazwa: string;
  /** Etykieta flagi (np. „ROZPISANE") — pokazywana w podglądzie. */
  flagaLabel: string;
  /** Wartość flagi PO potwierdzeniu — steruje tytułem i podglądem. */
  nowaWartosc: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Bottom sheet potwierdzenia zmiany flagi (mobile, DESIGN.md):
 * overlay (klik = anuluj) + sheet `sheetUp` 200ms (reduced-motion globalnie w index.css).
 * Tytuł „Zaznaczyć/Cofnąć flagę?", nazwa projektu, podgląd `FlagBtn` w stanie PO zmianie,
 * przyciski „Tak, zmień" / „Anuluj". Desktop NIE używa tego komponentu (toggle natychmiastowy).
 */
export function ConfirmSheet({
  nazwa,
  flagaLabel,
  nowaWartosc,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const titleId = useId();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-[rgba(30,27,23,0.35)]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="w-full animate-sheet-up rounded-t-sheet bg-surface px-[18px] pb-[calc(24px+env(safe-area-inset-bottom))] pt-5"
      >
        <h2 id={titleId} className="mb-1 text-sm font-semibold text-text-primary">
          {nowaWartosc ? 'Zaznaczyć flagę?' : 'Cofnąć flagę?'}
        </h2>
        <p className="mb-[18px] text-xs text-text-secondary">{nazwa}</p>

        {/* Podgląd flagi w stanie PO zmianie — nieinteraktywny (pointer-events-none). */}
        <div className="pointer-events-none mb-[18px]">
          <FlagBtn
            label={flagaLabel}
            isActive={nowaWartosc}
            size="detail"
            onToggle={() => undefined}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-[9px] bg-text-primary p-[11px] text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            Tak, zmień
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[9px] border-[1.5px] border-border bg-transparent p-[11px] text-[13px] text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmSheet;
