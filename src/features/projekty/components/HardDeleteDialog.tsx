import { AlertTriangle } from 'lucide-react';
import { useId, useState } from 'react';

interface HardDeleteDialogProps {
  /** Nazwa projektu kasowanego bezpowrotnie. */
  nazwa: string;
  /** Czy trwa usuwanie (blokuje przyciski). */
  isPending: boolean;
  /** Wywołane dopiero po przejściu wszystkich 3 kroków. */
  onConfirm: () => void;
  onCancel: () => void;
}

/** Krok 3-stopniowego potwierdzenia (bez wpisywania tekstu, kontekst §87). */
type Krok = 1 | 2 | 3;

const ETYKIETY_KROKOW: Record<Krok, string> = {
  1: 'Usuń trwale',
  2: 'Na pewno?',
  3: 'Tak, usuń bezpowrotnie',
};

/**
 * Dialog 3-stopniowego hard delete (D6: realny DELETE, tylko z archiwum).
 * Danger styling + ikona AlertTriangle + „Operacja nieodwracalna".
 * Każdy klik przycisku danger przechodzi do kolejnego kroku; po 3. kroku → `onConfirm`.
 * Anulowanie na dowolnym kroku resetuje krok i zamyka (`onCancel`).
 */
export function HardDeleteDialog({ nazwa, isPending, onConfirm, onCancel }: HardDeleteDialogProps) {
  const [krok, setKrok] = useState<Krok>(1);
  const titleId = useId();
  const descId = useId();

  const handleDalej = (): void => {
    if (krok === 3) {
      onConfirm();
      return;
    }
    setKrok((poprzedni) => (poprzedni + 1) as Krok);
  };

  const handleAnuluj = (): void => {
    setKrok(1);
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(30,27,23,0.35)] px-4"
      onClick={handleAnuluj}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[400px] rounded-sheet border-t-2 border-danger bg-surface px-[18px] pb-[18px] pt-5"
      >
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle size={16} className="text-danger" aria-hidden="true" />
          <h2 id={titleId} className="text-sm font-semibold text-danger">
            Operacja nieodwracalna
          </h2>
        </div>
        <p id={descId} className="mb-[18px] text-xs text-text-secondary">
          Projekt „{nazwa}" zostanie usunięty bezpowrotnie z bazy. Tej operacji nie można cofnąć.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDalej}
            disabled={isPending}
            aria-label={ETYKIETY_KROKOW[krok]}
            className="flex-1 rounded-[9px] bg-danger p-[11px] text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-60"
          >
            {ETYKIETY_KROKOW[krok]}
          </button>
          <button
            type="button"
            onClick={handleAnuluj}
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

export default HardDeleteDialog;
