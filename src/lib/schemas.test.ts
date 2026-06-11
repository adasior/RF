import { describe, expect, it } from 'vitest';

import { edycjaProjektuInput, nowyProjektInput, projektSchema } from './schemas';

describe('nowyProjektInput', () => {
  it('akceptuje poprawny input (wymagane: nazwa, kategoria, dodal)', () => {
    const result = nowyProjektInput.safeParse({
      nazwa: 'Koszulka firmowa',
      kategoria: 'T-shirt',
      dodal: 'Ania',
    });

    expect(result.success).toBe(true);
  });

  it('odrzuca brak nazwy z komunikatem po polsku', () => {
    const result = nowyProjektInput.safeParse({
      kategoria: 'T-shirt',
      dodal: 'Ania',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nazwa jest wymagana');
    }
  });

  it('odrzuca pustą nazwę (po przycięciu białych znaków)', () => {
    const result = nowyProjektInput.safeParse({
      nazwa: '   ',
      kategoria: 'T-shirt',
      dodal: 'Ania',
    });

    expect(result.success).toBe(false);
  });

  it('odrzuca brak kategorii', () => {
    const result = nowyProjektInput.safeParse({
      nazwa: 'Koszulka',
      dodal: 'Ania',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Kategoria jest wymagana');
    }
  });

  it('odrzuca brak osoby (dodal)', () => {
    const result = nowyProjektInput.safeParse({
      nazwa: 'Koszulka',
      kategoria: 'T-shirt',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Pole „Dodał" jest wymagane');
    }
  });

  it('akceptuje opcjonalne kontakt i uwagi', () => {
    const result = nowyProjektInput.safeParse({
      nazwa: 'Koszulka',
      kategoria: 'T-shirt',
      dodal: 'Ania',
      kontakt: 'jan@example.com',
      uwagi: 'pilne',
    });

    expect(result.success).toBe(true);
  });

  it('NIE zawiera flag w typie wyjściowym (flagi ustawia mutacja create)', () => {
    const result = nowyProjektInput.parse({
      nazwa: 'Koszulka',
      kategoria: 'T-shirt',
      dodal: 'Ania',
    });

    expect(result).not.toHaveProperty('rozpisane');
    expect(result).not.toHaveProperty('przeslany');
  });
});

describe('edycjaProjektuInput', () => {
  it('akceptuje pełną edycję z flagami', () => {
    const result = edycjaProjektuInput.safeParse({
      nazwa: 'Nowa nazwa',
      kategoria: 'Bluza z kapturem',
      dodal: 'Marek',
      kontakt: null,
      uwagi: null,
      rozpisane: true,
      przeslany: false,
      sprawdzony: false,
      wydrukowany: false,
    });

    expect(result.success).toBe(true);
  });

  it('odrzuca pustą nazwę', () => {
    const result = edycjaProjektuInput.safeParse({
      nazwa: '',
      kategoria: 'T-shirt',
      dodal: 'Ania',
    });

    expect(result.success).toBe(false);
  });
});

describe('projektSchema', () => {
  it('waliduje pełny rekord z bazy', () => {
    const result = projektSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      nazwa: 'Koszulka',
      kategoria: 'T-shirt',
      rozpisane: false,
      przeslany: false,
      sprawdzony: false,
      wydrukowany: false,
      kontakt: null,
      uwagi: null,
      dodal: 'Ania',
      archived_at: null,
      created_at: '2026-06-11T10:00:00Z',
      updated_at: '2026-06-11T10:00:00Z',
    });

    expect(result.success).toBe(true);
  });

  it('odrzuca rekord z błędnym typem flagi', () => {
    const result = projektSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      nazwa: 'Koszulka',
      kategoria: 'T-shirt',
      rozpisane: 'tak',
      przeslany: false,
      sprawdzony: false,
      wydrukowany: false,
      kontakt: null,
      uwagi: null,
      dodal: 'Ania',
      archived_at: null,
      created_at: '2026-06-11T10:00:00Z',
      updated_at: '2026-06-11T10:00:00Z',
    });

    expect(result.success).toBe(false);
  });
});
