import { Check, Circle } from 'lucide-react';

export type FlagBtnSize = 'table' | 'detail' | 'card';

interface FlagBtnProps {
  /** Etykieta na przycisku (np. „ROZPISANE"). */
  label: string;
  /** Czy flaga jest aktywna (zielona) — false = nieaktywna (szara). */
  isActive: boolean;
  /** Wariant rozmiaru — różne paddingi/fonty/ikony (DESIGN.md). */
  size: FlagBtnSize;
  /** Wywoływane z nową wartością flagi (toggle). */
  onToggle: (nowaWartosc: boolean) => void;
  disabled?: boolean;
}

/** Wspólne klasy bazowe (DESIGN.md FlagBtn — „Wspólne"). Bez animacji koloru. */
const BASE_CLASSES =
  'inline-flex items-center justify-center gap-1 rounded-flag border-[1.5px] font-semibold tracking-[0.05em] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:cursor-not-allowed disabled:opacity-60';

const SIZE_CLASSES: Record<FlagBtnSize, string> = {
  table: 'w-full px-2 py-1.5 text-[10px]',
  detail: 'w-auto px-3.5 py-2 text-[11px]',
  card: 'w-full px-1 py-[5px] text-[9px] tracking-[0.04em] rounded-[6px] gap-[3px]',
};

const STATE_CLASSES = {
  on: 'bg-flag-on-bg border-flag-on-border text-flag-on-text',
  off: 'bg-flag-off-bg border-flag-off-border text-flag-off-text',
} as const;

/** Rozmiar ikony w px: detail większy (12), tabela/karta mniejszy (10). */
const ICON_SIZE: Record<FlagBtnSize, number> = {
  table: 10,
  detail: 12,
  card: 10,
};

/**
 * Reużywalny przycisk-flaga (DESIGN.md). Aktywny = zielony + Check (stroke 2.5),
 * nieaktywny = szary + Circle (stroke 2). Klik wywołuje `onToggle(!isActive)`.
 */
export function FlagBtn({ label, isActive, size, onToggle, disabled }: FlagBtnProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    // Wewnątrz klikalnego wiersza tabeli — nie propaguj do nawigacji.
    event.stopPropagation();
    onToggle(!isActive);
  };

  const stateClass = isActive ? STATE_CLASSES.on : STATE_CLASSES.off;
  const className = `${BASE_CLASSES} ${SIZE_CLASSES[size]} ${stateClass}`;
  const iconSize = ICON_SIZE[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={className}
    >
      {isActive ? (
        <Check size={iconSize} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Circle size={iconSize} strokeWidth={2} aria-hidden="true" />
      )}
      {label}
    </button>
  );
}

export default FlagBtn;
