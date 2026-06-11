import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { ProjektTabela } from './ProjektTabela';

// Mockujemy TYLKO sonner (zewnętrzny UI) — asercja na treść toastu.
const toastFn = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: Object.assign((msg: string) => toastFn(msg), {
    error: (msg: string) => toastError(msg),
  }),
}));

function projektFixture(over: Partial<Projekt> = {}): Projekt {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    nazwa: 'Koszulka klubowa',
    kategoria: 'T-shirt',
    rozpisane: false,
    przeslany: false,
    sprawdzony: false,
    wydrukowany: false,
    kontakt: 'Jan Kowalski',
    uwagi: null,
    dodal: 'Ania',
    archived_at: null,
    created_at: '2026-06-11T10:00:00Z',
    updated_at: '2026-06-11T10:00:00Z',
    ...over,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderTabela(projekty: Projekt[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          {children}
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(<ProjektTabela projekty={projekty} />, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProjektTabela', () => {
  it('renderuje wiersz z nazwą, kategorią i kontaktem', () => {
    renderTabela([projektFixture()]);

    expect(screen.getByText('Koszulka klubowa')).toBeInTheDocument();
    expect(screen.getByText('T-shirt')).toBeInTheDocument();
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
  });

  it('puste pole kontaktu wyświetla „—"', () => {
    renderTabela([projektFixture({ kontakt: null })]);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('desktop: klik flagi wywołuje toggle (PATCH) od razu i pokazuje toast „LABEL: TAK"', async () => {
    const user = userEvent.setup();
    let patchWyslany = false;
    server.use(
      http.patch(PROJEKTY_REST_URL, () => {
        patchWyslany = true;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    renderTabela([projektFixture({ rozpisane: false })]);

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));

    await waitFor(() => expect(patchWyslany).toBe(true));
    expect(toastFn).toHaveBeenCalledWith('ROZPISANE: TAK');
  });

  it('wiersz z 4 flagami true ma klasę przygaszenia opacity-40', () => {
    renderTabela([
      projektFixture({ rozpisane: true, przeslany: true, sprawdzony: true, wydrukowany: true }),
    ]);

    const row = screen.getByText('Koszulka klubowa').closest('tr');
    expect(row).not.toBeNull();
    expect(row?.className).toContain('opacity-40');
  });

  it('błąd mutacji: flaga wraca do poprzedniej wartości + toast błędu', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(PROJEKTY_REST_URL, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    renderTabela([projektFixture({ rozpisane: false })]);

    const flagBtn = screen.getByRole('button', { name: /rozpisane/i });
    // Optimistic: chwilowo aktywna.
    await user.click(flagBtn);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Błąd — spróbuj ponownie');
    });
    // Po rollbacku przycisk wraca do stanu nieaktywnego.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rozpisane/i })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  it('klik wiersza (poza flagą) nawiguje do szczegółów', async () => {
    const user = userEvent.setup();
    renderTabela([projektFixture()]);

    await user.click(screen.getByText('Koszulka klubowa'));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/projekt/11111111-1111-1111-1111-111111111111',
      );
    });
    // Klik nazwy nie wywołuje toggle flagi.
    expect(toastFn).not.toHaveBeenCalled();
  });
});
