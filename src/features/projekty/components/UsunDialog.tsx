import { useId } from 'react';

interface UsunDialogProps {
  /** Nazwa projektu, którego dotyczy archiwizacja. */
  nazwa: string;
  /** Czy trwa archiwizacja (blokuje przyciski). */
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog potwierdzenia archiwizacji (soft delete, D6 / SPEC „Usuń").
 * Desktop modal w stylu `ConfirmSheet`: overlay (klik = anuluj) + `role="dialog"` + `aria-modal`.
 * „Usuń" archiwizuje (nie kasuje) — projekt trafia do archiwum, skąd można go przywrócić.
 */
export function UsunDialog({ nazwa, isPending, onConfirm, onCancel }: UsunDialogProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(30,27,23,0.35)] px-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[400px] rounded-sheet bg-surface px-[18px] pb-[18px] pt-5"
      >
        <h2 id={titleId} className="mb-1 text-sm font-semibold text-text-primary">
          Usunąć projekt „{nazwa}"?
        </h2>
        <p id={descId} className="mb-[18px] text-xs text-text-secondary">
          Projekt trafi do archiwum — można go później przywrócić.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-[9px] bg-danger p-[11px] text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-60"
          >
            Usuń
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-[9px] border-[1.5px] border-border bg-transparent p-[11px] text-[13px] text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-60"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsunDialog;
