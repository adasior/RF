import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';

import { Filtry } from './Filtry';

function projektFixture(over: Partial<Projekt> = {}): Projekt {
  return {
    id: crypto.randomUUID(),
    nazwa: 'Koszulka klubowa',
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
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Filtry', () => {
  it('renderuje 5 filtrów: Wszystkie + 4 z config (filterLabel)', () => {
    render(
      <Filtry
        projekty={[]}
        flagaAktywna={undefined}
        szukaj=""
        onFlagaChange={vi.fn()}
        onSzukajChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /wszystkie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /do rozpisania/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /do przesłania/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /do sprawdzenia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /do wydrukowania/i })).toBeInTheDocument();
  });

  it('licznik „Do rozpisania" = liczba projektów z rozpisane=false', () => {
    const projekty = [
      projektFixture({ rozpisane: false }),
      projektFixture({ rozpisane: false }),
      projektFixture({ rozpisane: true }),
    ];

    render(
      <Filtry
        projekty={projekty}
        flagaAktywna={undefined}
        szukaj=""
        onFlagaChange={vi.fn()}
        onSzukajChange={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /do rozpisania/i });
    expect(btn).toHaveTextContent('2');
  });

  it('licznik „Wszystkie" = liczba wszystkich projektów', () => {
    const projekty = [projektFixture(), projektFixture(), projektFixture()];

    render(
      <Filtry
        projekty={projekty}
        flagaAktywna={undefined}
        szukaj=""
        onFlagaChange={vi.fn()}
        onSzukajChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /wszystkie/i })).toHaveTextContent('3');
  });

  it('po zaznaczeniu flagi licznik maleje (projekt znika z „do zrobienia")', () => {
    const { rerender } = render(
      <Filtry
        projekty={[projektFixture({ rozpisane: false }), projektFixture({ rozpisane: false })]}
        flagaAktywna={undefined}
        szukaj=""
        onFlagaChange={vi.fn()}
        onSzukajChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /do rozpisania/i })).toHaveTextContent('2');

    // Symulacja toggle flagi w jednym projekcie → świeży dataset z cache.
    rerender(
      <Filtry
        projekty={[projektFixture({ rozpisane: true }), projektFixture({ rozpisane: false })]}
        flagaAktywna={undefined}
        szukaj=""
        onFlagaChange={vi.fn()}
        onSzukajChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /do rozpisania/i })).toHaveTextContent('1');
  });

  it('klik filtra flagi wywołuje onFlagaChange z kluczem', async () => {
    const user = userEvent.setup();
    const onFlagaChange = vi.fn();

    render(
      <Filtry
        projekty={[]}
        flagaAktywna={undefined}
        szukaj=""
        onFlagaChange={onFlagaChange}
        onSzukajChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /do przesłania/i }));

    expect(onFlagaChange).toHaveBeenCalledWith('przeslany');
  });

  it('klik „Wszystkie" wywołuje onFlagaChange z undefined', async () => {
    const user = userEvent.setup();
    const onFlagaChange = vi.fn();

    render(
      <Filtry
        projekty={[]}
        flagaAktywna="rozpisane"
        szukaj=""
        onFlagaChange={onFlagaChange}
        onSzukajChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /wszystkie/i }));

    expect(onFlagaChange).toHaveBeenCalledWith(undefined);
  });

  it('aktywny filtr ma podkreślenie terakotą (border-accent)', () => {
    render(
      <Filtry
        projekty={[]}
        flagaAktywna="rozpisane"
        szukaj=""
        onFlagaChange={vi.fn()}
        onSzukajChange={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /do rozpisania/i });
    expect(btn.className).toContain('border-accent');
  });

  it('wpisanie w pole Szukaj wywołuje onSzukajChange', async () => {
    const user = userEvent.setup();
    const onSzukajChange = vi.fn();

    render(
      <Filtry
        projekty={[]}
        flagaAktywna={undefined}
        szukaj=""
        onFlagaChange={vi.fn()}
        onSzukajChange={onSzukajChange}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: /szukaj/i }), 'a');

    expect(onSzukajChange).toHaveBeenCalledWith('a');
  });
});
