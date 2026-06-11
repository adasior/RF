const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PROG_WCZORAJ_H = 24;
const PROG_PRZEDWCZORAJ_H = 48;
const PROG_DNI_WZGLEDNE = 14;

/**
 * Skróty miesięcy PL (mianownik bez kropki) — stałe, niezależne od locale runtime,
 * by format był deterministyczny ("15 cze 2025", "3 cze").
 */
const MIESIACE_SKROT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
] as const;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Data względna do listy/kart:
 * < 24h → „dzisiaj", 24–48h → „wczoraj", < 14 dni → „X dni temu", ≥ 14 dni → „DD MMM".
 */
export function formatRelativeData(value: Date | string, teraz: Date = new Date()): string {
  const data = toDate(value);
  const diffMs = teraz.getTime() - data.getTime();
  const diffH = diffMs / HOUR_MS;

  if (diffH < PROG_WCZORAJ_H) {
    return 'dzisiaj';
  }
  if (diffH < PROG_PRZEDWCZORAJ_H) {
    return 'wczoraj';
  }

  const diffDni = Math.floor(diffMs / DAY_MS);
  if (diffDni < PROG_DNI_WZGLEDNE) {
    return `${diffDni} dni temu`;
  }

  return `${data.getDate()} ${MIESIACE_SKROT[data.getMonth()]}`;
}

/**
 * Pełna data do widoku szczegółów: „15 cze 2025, 14:32".
 */
export function formatDataPelna(value: Date | string): string {
  const data = toDate(value);
  const dzien = data.getDate();
  const miesiac = MIESIACE_SKROT[data.getMonth()];
  const rok = data.getFullYear();
  const godzina = pad2(data.getHours());
  const minuta = pad2(data.getMinutes());

  return `${dzien} ${miesiac} ${rok}, ${godzina}:${minuta}`;
}
