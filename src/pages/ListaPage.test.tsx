import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { ListaPage } from './ListaPage';

function renderListaPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ListaPage />} />
          <Route path="/nowy" element={<div>Formularz nowego projektu</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function projektFixture(): Projekt {
  return {
    id: '11111111-1111-1111-1111-111111111111',
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
  };
}

/** Stub matchMedia z kontrolą `matches` — przełącza breakpoint w `useIsMobile`. */
function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '(max-width: 767px)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as MediaQueryList),
  );
}

describe('ListaPage — breakpoint mobile (U8)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('na mobile renderuje karty zamiast tabeli i FAB zamiast CTA „+ Nowy projekt"', async () => {
    stubMatchMedia(true);
    server.use(http.get(PROJEKTY_REST_URL, () => HttpResponse.json([projektFixture()])));

    renderListaPage();

    expect(await screen.findByText('Koszulka klubowa')).toBeInTheDocument();
    // Karty zamiast tabeli.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // FAB zamiast CTA w headerze.
    expect(screen.getByRole('button', { name: 'Nowy projekt' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Nowy projekt' })).not.toBeInTheDocument();
  });

  it('na desktopie renderuje tabelę i CTA w headerze (bez FAB)', async () => {
    stubMatchMedia(false);
    server.use(http.get(PROJEKTY_REST_URL, () => HttpResponse.json([projektFixture()])));

    renderListaPage();

    expect(await screen.findByText('Koszulka klubowa')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nowy projekt' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nowy projekt' })).not.toBeInTheDocument();
  });
});

describe('ListaPage — stan pusty', () => {
  it('bez aktywnego filtra: wariant brak-projektow, CTA nawiguje do /nowy', async () => {
    const user = userEvent.setup();
    server.use(http.get(PROJEKTY_REST_URL, () => HttpResponse.json([])));

    renderListaPage();

    // Wariant brak-projektow (CTA „+ Nowy projekt" wewnątrz <main>, nie w Header).
    const main = await screen.findByRole('main');
    expect(await within(main).findByText('Brak projektów')).toBeInTheDocument();

    await user.click(within(main).getByRole('button', { name: '+ Nowy projekt' }));

    expect(await screen.findByText('Formularz nowego projektu')).toBeInTheDocument();
  });

  it('z aktywnym filtrem flagi: wariant brak-wynikow, CTA resetuje filtr', async () => {
    const user = userEvent.setup();
    server.use(http.get(PROJEKTY_REST_URL, () => HttpResponse.json([])));

    renderListaPage();

    const main = await screen.findByRole('main');
    await within(main).findByText('Brak projektów');

    // Aktywuj filtr flagi → isFiltrAktywny → wariant brak-wynikow.
    await user.click(screen.getByRole('button', { name: /do rozpisania/i }));

    expect(await within(main).findByText('Brak projektów do pokazania')).toBeInTheDocument();

    // „Pokaż wszystkie" = reset filtra → z powrotem wariant brak-projektow.
    await user.click(within(main).getByRole('button', { name: 'Pokaż wszystkie' }));

    expect(await within(main).findByText('Brak projektów')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /do rozpisania/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
