/**
 * Źródło prawdy dla OSOBY / KATEGORIE / FLAGI.
 * Wartości pochodzą ze SPEC_projekty.md (sekcja „Konfiguracja").
 * Nie hardcoduj tych list w komponentach — importuj stąd.
 */

export const OSOBY = ['Ania', 'Bartek', 'Kasia', 'Marek'] as const;
// ⚠ Zmień na rzeczywiste imiona przed deploymentem.

export const KATEGORIE = [
  'T-shirt',
  'Longsleeve',
  'Bluza z kapturem',
  'Bluza bez kaptura',
  'Bluza rozpinana',
  'Kurtka',
  'Kamizelka',
  'Polo',
  'Koszula',
  'Tank top',
  'Spodenki',
  'Spodnie',
  'Czapka dziana',
  'Czapka z daszkiem',
  'Czapka sublimacyjna',
  'Beanie',
  'Szalik / komin',
  'Fartuch / zapaska',
  'Torba',
  'Plecak',
  'Skarpetki',
  'Inne…',
] as const;
// „Inne…" → pokazuje dodatkowy input tekstowy, jego wartość trafia do `kategoria`.

export interface Flaga {
  key: 'rozpisane' | 'przeslany' | 'sprawdzony' | 'wydrukowany';
  label: string;
  filterLabel: string;
  columnLabel?: string;
}

export const FLAGI: readonly Flaga[] = [
  { key: 'rozpisane', label: 'ROZPISANE', filterLabel: 'Do rozpisania' },
  {
    key: 'przeslany',
    label: 'PRZESŁANY',
    filterLabel: 'Do przesłania',
    columnLabel: 'Przesłany haft/sito',
  },
  { key: 'sprawdzony', label: 'SPRAWDZONY', filterLabel: 'Do sprawdzenia' },
  { key: 'wydrukowany', label: 'WYDRUKOWANY', filterLabel: 'Do wydrukowania' },
] as const;
