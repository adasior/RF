import { OSOBY } from '@/lib/config';

interface OsobaSegmentedProps {
  /** Aktualnie wybrana osoba (pusty string = brak wyboru). */
  value: string;
  onChange: (osoba: string) => void;
  /** id elementu z widoczną etykietą grupy (np. „Dodał"). */
  labelledBy: string;
}

const OPCJA_BASE =
  'flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-flag border-[1.5px] px-2 py-2.5 text-center text-[13px] font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-border-focus has-[:focus-visible]:ring-offset-1';
const OPCJA_AKTYWNA = 'border-accent bg-accent-light text-accent';
const OPCJA_NIEAKTYWNA = 'border-border bg-surface text-text-secondary';

/**
 * Segmented control wyboru osoby (DESIGN.md „Segmented control Dodał").
 * Natywne radio (sr-only) w label — klawiatura (strzałki/Tab) i semantyka
 * radiogroup za darmo (WCAG 2.2); fokus pokazywany ringiem na segmencie.
 */
export function OsobaSegmented({ value, onChange, labelledBy }: OsobaSegmentedProps) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex gap-2">
      {OSOBY.map((osoba) => {
        const isActive = osoba === value;

        return (
          <label
            key={osoba}
            className={`${OPCJA_BASE} ${isActive ? OPCJA_AKTYWNA : OPCJA_NIEAKTYWNA}`}
          >
            <input
              type="radio"
              name="dodal"
              value={osoba}
              checked={isActive}
              onChange={() => onChange(osoba)}
              className="sr-only"
            />
            {osoba}
          </label>
        );
      })}
    </div>
  );
}

export default OsobaSegmented;
