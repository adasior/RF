import { Inbox, SearchX } from 'lucide-react';

export type EmptyStateVariant = 'brak-projektow' | 'brak-wynikow';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  /** Akcja przycisku CTA (np. nawigacja do /nowy lub reset filtra). */
  onAction: () => void;
}

interface EmptyStateConfig {
  Icon: typeof Inbox;
  naglowek: string;
  opis: string;
  cta: string;
}

const CONFIG: Record<EmptyStateVariant, EmptyStateConfig> = {
  'brak-projektow': {
    Icon: Inbox,
    naglowek: 'Brak projektów',
    opis: 'Dodaj pierwszy projekt.',
    cta: '+ Nowy projekt',
  },
  'brak-wynikow': {
    Icon: SearchX,
    naglowek: 'Brak projektów do pokazania',
    opis: 'Wszystko zrobione albo zmień filtr.',
    cta: 'Pokaż wszystkie',
  },
};

/**
 * Stan pusty listy (DESIGN.md „Stany puste").
 * - `brak-projektow` — ikona Inbox, CTA „+ Nowy projekt".
 * - `brak-wynikow` — ikona SearchX, CTA „Pokaż wszystkie".
 */
export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const { Icon, naglowek, opis, cta } = CONFIG[variant];

  return (
    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
      <Icon size={28} className="text-text-meta" aria-hidden="true" />
      <h2 className="text-sm font-medium text-text-primary">{naglowek}</h2>
      <p className="text-xs text-text-secondary">{opis}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-2 rounded-pill bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      >
        {cta}
      </button>
    </div>
  );
}

export default EmptyState;
