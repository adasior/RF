import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { ProjektKarty } from './ProjektKarty';

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

function renderKarty(projekty: Projekt[], archiwum = false) {
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

  return render(<ProjektKarty projekty={projekty} archiwum={archiwum} />, { wrapper: Wrapper });
}

/** Rejestruje handler PATCH i zwraca obiekt śledzący fakt mutacji oraz wysłane body. */
function trackPatch(): { wyslany: boolean; body: Record<string, unknown> | null } {
  const tracker: { wyslany: boolean; body: Record<string, unknown> | null } = {
    wyslany: false,
    body: null,
  };
  server.use(
    http.patch(PROJEKTY_REST_URL, async ({ request }) => {
      tracker.wyslany = true;
      tracker.body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json([], { status: 204 });
    }),
  );
  return tracker;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProjektKarty', () => {
  it('renderuje kartę z kategorią, nazwą i datą względną (bez kontaktu — DESIGN.md)', () => {
    renderKarty([projektFixture()]);

    expect(screen.getByText('T-shirt')).toBeInTheDocument();
    expect(screen.getByText('Koszulka klubowa')).toBeInTheDocument();
    expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument();
  });

  it('klik flagi NIE wysyła mutacji od razu — otwiera ConfirmSheet z podglądem stanu po zmianie', async () => {
    const user = userEvent.setup();
    const patch = trackPatch();

    renderKarty([projektFixture({ rozpisane: false })]);

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));

    const dialog = screen.getByRole('dialog', { name: 'Zaznaczyć flagę?' });
    expect(within(dialog).getByText('Koszulka klubowa')).toBeInTheDocument();
    // Podgląd pokazuje stan PO zmianie (false → true).
    expect(within(dialog).getByRole('button', { name: /rozpisane/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // Brak mutacji i toastu przed potwierdzeniem.
    expect(patch.wyslany).toBe(false);
    expect(toastFn).not.toHaveBeenCalled();
  });

  it('flaga aktywna → tytuł sheetu „Cofnąć flagę?" z podglądem nieaktywnym', async () => {
    const user = userEvent.setup();

    renderKarty([projektFixture({ rozpisane: true })]);

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));

    const dialog = screen.getByRole('dialog', { name: 'Cofnąć flagę?' });
    expect(within(dialog).getByRole('button', { name: /rozpisane/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('„Tak, zmień" wywołuje toggleFlaga (PATCH) + toast „ROZPISANE: TAK" i zamyka sheet', async () => {
    const user = userEvent.setup();
    const patch = trackPatch();

    renderKarty([projektFixture({ rozpisane: false })]);

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));
    await user.click(screen.getByRole('button', { name: 'Tak, zmień' }));

    await waitFor(() => expect(patch.wyslany).toBe(true));
    // Ta sama ścieżka co desktop: PATCH ustawia dokładnie tę flagę na nową wartość.
    expect(patch.body).toMatchObject({ rozpisane: true });
    expect(toastFn).toHaveBeenCalledWith('ROZPISANE: TAK');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('„Anuluj" zamyka sheet bez mutacji', async () => {
    const user = userEvent.setup();
    const patch = trackPatch();

    renderKarty([projektFixture({ rozpisane: false })]);

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(patch.wyslany).toBe(false);
    expect(toastFn).not.toHaveBeenCalled();
  });

  it('klik overlay zamyka sheet bez mutacji', async () => {
    const user = userEvent.setup();
    const patch = trackPatch();

    renderKarty([projektFixture({ rozpisane: false })]);

    await user.click(screen.getByRole('button', { name: /rozpisane/i }));

    const overlay = screen.getByRole('dialog').parentElement;
    expect(overlay).not.toBeNull();
    if (overlay) {
      await user.click(overlay);
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(patch.wyslany).toBe(false);
  });

  it('karta z 4 flagami true ma klasę przygaszenia opacity-40', () => {
    renderKarty([
      projektFixture({ rozpisane: true, przeslany: true, sprawdzony: true, wydrukowany: true }),
    ]);

    const card = screen.getByText('Koszulka klubowa').parentElement;
    expect(card).not.toBeNull();
    expect(card?.className).toContain('opacity-40');
  });

  it('klik karty (poza flagami) nawiguje do szczegółów bez otwierania sheetu', async () => {
    const user = userEvent.setup();
    renderKarty([projektFixture()]);

    await user.click(screen.getByText('Koszulka klubowa'));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/projekt/11111111-1111-1111-1111-111111111111',
      );
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('kontekst aktywny: renderuje „Usuń", NIE „Przywróć"/„Usuń trwale"', () => {
    renderKarty([projektFixture()], false);

    expect(screen.getByRole('button', { name: /^Usuń projekt/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Przywróć' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usuń trwale' })).not.toBeInTheDocument();
  });

  it('kontekst archiwum: renderuje „Przywróć" + „Usuń trwale"', () => {
    renderKarty([projektFixture({ archived_at: '2026-06-12T10:00:00Z' })], true);

    expect(screen.getByRole('button', { name: 'Przywróć' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń trwale' })).toBeInTheDocument();
  });

  it('kontekst archiwum: „Przywróć" wysyła PATCH archived_at=null + toast', async () => {
    const user = userEvent.setup();
    const patch = trackPatch();

    renderKarty([projektFixture({ archived_at: '2026-06-12T10:00:00Z' })], true);

    await user.click(screen.getByRole('button', { name: 'Przywróć' }));

    await waitFor(() => expect(patch.wyslany).toBe(true));
    expect(patch.body).toMatchObject({ archived_at: null });
    expect(toastSuccess).toHaveBeenCalledWith('Projekt przywrócony');
  });
});
