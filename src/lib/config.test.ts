import { describe, expect, it } from 'vitest';

import { FLAGI, KATEGORIE, OSOBY } from './config';

describe('config.FLAGI', () => {
  it('ma 4 flagi w kolejności ze SPEC', () => {
    expect(FLAGI.map((f) => f.key)).toEqual([
      'rozpisane',
      'przeslany',
      'sprawdzony',
      'wydrukowany',
    ]);
  });

  it('każda flaga ma unikalny key/label/filterLabel', () => {
    const keys = FLAGI.map((f) => f.key);
    const labels = FLAGI.map((f) => f.label);
    const filterLabels = FLAGI.map((f) => f.filterLabel);

    expect(new Set(keys).size).toBe(FLAGI.length);
    expect(new Set(labels).size).toBe(FLAGI.length);
    expect(new Set(filterLabels).size).toBe(FLAGI.length);
  });

  it('druga flaga (przeslany) ma columnLabel, pozostałe nie', () => {
    expect(FLAGI[1].key).toBe('przeslany');
    expect(FLAGI[1].columnLabel).toBe('Przesłany haft/sito');
    expect(FLAGI[0].columnLabel).toBeUndefined();
    expect(FLAGI[2].columnLabel).toBeUndefined();
    expect(FLAGI[3].columnLabel).toBeUndefined();
  });
});

describe('config.KATEGORIE', () => {
  it('zawiera listę ze SPEC z „Inne…" jako ostatnią pozycją', () => {
    expect(KATEGORIE[0]).toBe('T-shirt');
    expect(KATEGORIE.at(-1)).toBe('Inne…');
    expect(KATEGORIE).toContain('Czapka sublimacyjna');
  });

  it('nie ma duplikatów', () => {
    expect(new Set(KATEGORIE).size).toBe(KATEGORIE.length);
  });
});

describe('config.OSOBY', () => {
  it('ma 4 imiona', () => {
    expect(OSOBY).toHaveLength(4);
    expect(OSOBY).toEqual(['Arek', 'Krzysiek', 'Grzesiek', 'Adam']);
  });
});
