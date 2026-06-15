import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { ProjektTabela } from './ProjektTabela';

// Mockujemy TYLKO sonner (zewnętrzny UI) — asercja na treść toastu.
const toastFn = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: Object.assign((msg: string) => toastFn(msg), {
    success: (msg: string) => toastSuccess(msg),
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

function renderTabela(projekty: Projekt[], archiwum = false) {
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

  return render(<ProjektTabela projekty={projekty} archiwum={archiwum} />, { wrapper: Wrapper });
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

  it('nagłówek kolumny używa columnLabel gdy zdefiniowany („Przesłany haft/sito")', () => {
    renderTabela([projektFixture()]);

    expect(screen.getByText('Przesłany haft/sito')).toBeInTheDocument();
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
    expect(toastFn).toHaveBeenCalledWith('Koszulka klubowa — ROZPISANE: TAK');
  });

  it('podczas trwającej mutacji przyciski flag są disabled (ochrona przed double-click)', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(PROJEKTY_REST_URL, async () => {
        await delay(150);
        return HttpResponse.json([], { status: 204 });
      }),
    );

    renderTabela([projektFixture({ rozpisane: false })]);

    const flagBtn = screen.getByRole('button', { name: /rozpisane/i });
    await user.click(flagBtn);

    await waitFor(() => expect(flagBtn).toBeDisabled());
    // Po zakończeniu mutacji przyciski wracają do stanu aktywnego.
    await waitFor(() => expect(flagBtn).toBeEnabled());
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

  it('kontekst aktywny: renderuje „Usuń" (archive), NIE „Przywróć"/„Usuń trwale"', () => {
    renderTabela([projektFixture()], false);

    expect(screen.getByRole('button', { name: /^Usuń projekt/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usuń trwale' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Przywróć' })).not.toBeInTheDocument();
  });

  it('kontekst archiwum: renderuje „Przywróć" + „Usuń trwale", NIE „Usuń"', () => {
    renderTabela([projektFixture({ archived_at: '2026-06-12T10:00:00Z' })], true);

    expect(screen.getByRole('button', { name: 'Przywróć' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń trwale' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Usuń projekt/i })).not.toBeInTheDocument();
  });

  it('kontekst aktywny: „Usuń" otwiera UsunDialog z archiwizacją; potwierdzenie → PATCH archived_at', async () => {
    const user = userEvent.setup();
    let patchBody: Record<string, unknown> | null = null;
    server.use(
      http.patch(PROJEKTY_REST_URL, async ({ request }) => {
        patchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    renderTabela([projektFixture()], false);

    await user.click(screen.getByRole('button', { name: /^Usuń projekt/i }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }));

    await waitFor(() => expect(patchBody).not.toBeNull());
    expect(patchBody).toHaveProperty('archived_at');
  });

  it('kontekst archiwum: hard delete dopiero po 3 krokach wysyła DELETE', async () => {
    const user = userEvent.setup();
    let deleteWyslany = false;
    server.use(
      http.delete(PROJEKTY_REST_URL, () => {
        deleteWyslany = true;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    renderTabela([projektFixture({ archived_at: '2026-06-12T10:00:00Z' })], true);

    await user.click(screen.getByRole('button', { name: 'Usuń trwale' }));

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Usuń trwale' }));
    await user.click(within(dialog).getByRole('button', { name: 'Na pewno?' }));
    expect(deleteWyslany).toBe(false);

    await user.click(within(dialog).getByRole('button', { name: 'Tak, usuń bezpowrotnie' }));

    await waitFor(() => expect(deleteWyslany).toBe(true));
  });
});
