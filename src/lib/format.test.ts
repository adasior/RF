import { describe, expect, it } from 'vitest';

import { formatDataPelna, formatRelativeData } from './format';

// Punkt odniesienia: 15 czerwca 2025, 14:32 (stały „teraz" w testach).
const NOW = new Date('2025-06-15T14:32:00');

function hoursAgo(h: number): Date {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);
}

describe('formatRelativeData', () => {
  it('< 24h → „dzisiaj"', () => {
    expect(formatRelativeData(hoursAgo(2), NOW)).toBe('dzisiaj');
    expect(formatRelativeData(hoursAgo(23), NOW)).toBe('dzisiaj');
  });

  it('24–48h → „wczoraj"', () => {
    expect(formatRelativeData(hoursAgo(25), NOW)).toBe('wczoraj');
    expect(formatRelativeData(hoursAgo(47), NOW)).toBe('wczoraj');
  });

  it('< 14 dni → „X dni temu"', () => {
    expect(formatRelativeData(daysAgo(3), NOW)).toBe('3 dni temu');
    expect(formatRelativeData(daysAgo(13), NOW)).toBe('13 dni temu');
  });

  it('≥ 14 dni → „DD MMM" (PL)', () => {
    // 15 cze − 14 dni = 1 czerwca
    expect(formatRelativeData(daysAgo(14), NOW)).toBe('1 cze');
    // 15 cze − 20 dni = 26 maja
    expect(formatRelativeData(daysAgo(20), NOW)).toBe('26 maj');
  });

  it('akceptuje datę jako string ISO', () => {
    expect(formatRelativeData(hoursAgo(2).toISOString(), NOW)).toBe('dzisiaj');
  });
});

describe('formatDataPelna', () => {
  it('zwraca format „15 cze 2025, 14:32" (PL)', () => {
    expect(formatDataPelna(NOW)).toBe('15 cze 2025, 14:32');
  });

  it('akceptuje datę jako string ISO', () => {
    expect(formatDataPelna('2025-06-15T14:32:00')).toBe('15 cze 2025, 14:32');
  });

  it('paduje godziny i minuty zerami', () => {
    expect(formatDataPelna('2025-01-05T09:05:00')).toBe('5 sty 2025, 09:05');
  });
});
