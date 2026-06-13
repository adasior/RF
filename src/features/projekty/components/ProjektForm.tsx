import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { KATEGORIE } from '@/lib/config';
import { nowyProjektInput } from '@/lib/schemas';
import type { NowyProjektInput } from '@/lib/types';

import { OsobaSegmented } from './OsobaSegmented';

export interface ProjektFormProps {
  /** `create` = nowy projekt; `edit` = edycja istniejącego (reuse w U9). */
  mode: 'create' | 'edit';
  /** Wartości startowe (tryb edit). */
  defaultValues?: Partial<NowyProjektInput>;
  isSubmitting: boolean;
  onSubmit: (input: NowyProjektInput) => void;
  onCancel: () => void;
}

/**
 * Wartownik UI z KATEGORIE odsłaniający input własnej kategorii (D9).
 *
 * INWARIANT: `'Inne…'` jest wyłącznie wartownikiem — `toInput()` nigdy nie zapisuje
 * go jako `kategoria` (mapuje na wpisaną wartość `kategoriaInna`). Rekord z
 * `kategoria === 'Inne…'` jest nieosiągalny przez apkę (tylko ręczny seed DB), więc
 * kolizja wartownik↔wartość listy jest świadomie nieobsługiwana (review F3, P2 #2).
 */
const KATEGORIA_INNE = 'Inne…';

/**
 * Schemat wartości formularza — pochodna `nowyProjektInput` (te same komunikaty PL
 * dla nazwa/dodal), rozszerzona o `kategoriaInna` (D9) i stringowe pola opcjonalne
 * (puste '' mapowane na null dopiero przy submit).
 */
const projektFormSchema = z
  .object({
    nazwa: nowyProjektInput.shape.nazwa,
    kategoria: z.string().min(1, 'Kategoria jest wymagana'),
    kategoriaInna: z.string().trim().max(200, 'Kategoria jest za długa'),
    dodal: z.string().min(1, 'Pole „Dodał" jest wymagane'),
    kontakt: z.string().trim().max(200, 'Kontakt jest za długi'),
    uwagi: z.string().trim().max(2000, 'Uwagi są za długie'),
  })
  .superRefine((values, ctx) => {
    if (values.kategoria === KATEGORIA_INNE && values.kategoriaInna.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['kategoriaInna'],
        message: 'Podaj kategorię',
      });
    }
  });

type ProjektFormValues = z.infer<typeof projektFormSchema>;

function toInput(values: ProjektFormValues): NowyProjektInput {
  return {
    nazwa: values.nazwa,
    kategoria: values.kategoria === KATEGORIA_INNE ? values.kategoriaInna : values.kategoria,
    dodal: values.dodal,
    kontakt: values.kontakt === '' ? null : values.kontakt,
    uwagi: values.uwagi === '' ? null : values.uwagi,
  };
}

function toFormValues(defaults?: Partial<NowyProjektInput>): ProjektFormValues {
  const kategoria = defaults?.kategoria ?? '';
  const isZnanaKategoria = (KATEGORIE as readonly string[]).includes(kategoria);

  return {
    nazwa: defaults?.nazwa ?? '',
    kategoria: kategoria !== '' && !isZnanaKategoria ? KATEGORIA_INNE : kategoria,
    kategoriaInna: kategoria !== '' && !isZnanaKategoria ? kategoria : '',
    dodal: defaults?.dodal ?? '',
    kontakt: defaults?.kontakt ?? '',
    uwagi: defaults?.uwagi ?? '',
  };
}

const ETYKIETA = 'text-xs font-medium text-text-primary';
const POLE =
  'min-h-12 w-full rounded-input border border-border bg-surface px-[13px] py-2.5 text-sm text-text-primary placeholder:text-text-meta focus:border-accent focus:shadow-[0_0_0_3px_rgba(181,84,45,0.10)] focus:outline-none';

function Gwiazdka() {
  return <span className="text-accent"> *</span>;
}

function BladPola({ id, komunikat }: { id: string; komunikat: string | undefined }) {
  if (!komunikat) {
    return null;
  }

  return (
    <p id={id} role="alert" className="text-xs text-danger">
      {komunikat}
    </p>
  );
}

/**
 * Formularz projektu (DESIGN.md „Formularz nowego projektu"):
 * Nazwa* → Kategoria*+Kontakt (grid 2→1 kol) → Dodał* → Uwagi. BEZ flag —
 * nowy projekt zawsze startuje z 4 flagami false (ustawia je mutacja create).
 */
export function ProjektForm({
  mode,
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProjektFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProjektFormValues>({
    resolver: zodResolver(projektFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const isInne = watch('kategoria') === KATEGORIA_INNE;

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toInput(values)))}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="projekt-nazwa" className={ETYKIETA}>
          Nazwa projektu
          <Gwiazdka />
        </label>
        <input
          id="projekt-nazwa"
          type="text"
          {...register('nazwa')}
          aria-invalid={errors.nazwa ? true : undefined}
          aria-describedby={errors.nazwa ? 'projekt-nazwa-blad' : undefined}
          className={POLE}
        />
        <BladPola id="projekt-nazwa-blad" komunikat={errors.nazwa?.message} />
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="projekt-kategoria" className={ETYKIETA}>
            Kategoria
            <Gwiazdka />
          </label>
          <select
            id="projekt-kategoria"
            {...register('kategoria')}
            aria-invalid={errors.kategoria ? true : undefined}
            aria-describedby={errors.kategoria ? 'projekt-kategoria-blad' : undefined}
            className={POLE}
          >
            <option value="" disabled>
              Wybierz kategorię
            </option>
            {KATEGORIE.map((kategoria) => (
              <option key={kategoria} value={kategoria}>
                {kategoria}
              </option>
            ))}
          </select>
          <BladPola id="projekt-kategoria-blad" komunikat={errors.kategoria?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="projekt-kontakt" className={ETYKIETA}>
            Kontakt
          </label>
          <input
            id="projekt-kontakt"
            type="text"
            {...register('kontakt')}
            aria-invalid={errors.kontakt ? true : undefined}
            aria-describedby={errors.kontakt ? 'projekt-kontakt-blad' : undefined}
            className={POLE}
          />
          <BladPola id="projekt-kontakt-blad" komunikat={errors.kontakt?.message} />
        </div>
      </div>

      {isInne && (
        <div className="flex flex-col gap-1">
          <label htmlFor="projekt-kategoria-inna" className={ETYKIETA}>
            Własna kategoria
            <Gwiazdka />
          </label>
          <input
            id="projekt-kategoria-inna"
            type="text"
            {...register('kategoriaInna')}
            aria-invalid={errors.kategoriaInna ? true : undefined}
            aria-describedby={errors.kategoriaInna ? 'projekt-kategoria-inna-blad' : undefined}
            className={POLE}
          />
          <BladPola
            id="projekt-kategoria-inna-blad"
            komunikat={errors.kategoriaInna?.message}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span id="projekt-dodal-label" className={ETYKIETA}>
          Dodał
          <Gwiazdka />
        </span>
        <Controller
          control={control}
          name="dodal"
          render={({ field }) => (
            <OsobaSegmented
              value={field.value}
              onChange={field.onChange}
              labelledBy="projekt-dodal-label"
            />
          )}
        />
        <BladPola id="projekt-dodal-blad" komunikat={errors.dodal?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="projekt-uwagi" className={ETYKIETA}>
          Uwagi
        </label>
        <textarea
          id="projekt-uwagi"
          rows={2}
          {...register('uwagi')}
          aria-invalid={errors.uwagi ? true : undefined}
          aria-describedby={errors.uwagi ? 'projekt-uwagi-blad' : undefined}
          className={POLE}
        />
        <BladPola id="projekt-uwagi-blad" komunikat={errors.uwagi?.message} />
      </div>

      <div className="flex gap-2.5 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="min-h-12 flex-1 rounded-input bg-accent p-3 text-sm font-medium text-white hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
        >
          {mode === 'create' ? 'Zapisz projekt' : 'Zapisz zmiany'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-input border border-border bg-transparent px-5 py-3 text-sm text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}

export default ProjektForm;
