import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { SzczegolyWidok } from './SzczegolyWidok';

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
    nazwa: 'Tshirty Piast Anty KSG',
    kategoria: 'T-shirt',
    rozpisane: true,
    przeslany: false,
    sprawdzony: false,
    wydrukowany: false,
    kontakt: 'Bombi',
    uwagi: 'Pantone 186C, dostarczyć do magazynu B',
    dodal: 'Ania',
    archived_at: null,
    created_at: '2025-06-15T14:32:00',
    updated_at: '2025-06-17T09:15:00',
    ...over,
  };
}

/** Stubuje `window.matchMedia` ze sterowanym `matches` (mobile vs desktop). */
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

function renderWidok(projekt: Projekt, over: { onEdytuj?: () => void; onUsun?: () => void } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/projekt/${projekt.id}`]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(
    <SzczegolyWidok
      projekt={projekt}
      onEdytuj={over.onEdytuj ?? (() => undefined)}
      onUsun={over.onUsun ?? (() => undefined)}
      isUsuwanie={false}
    />,
    { wrapper: Wrapper },
  );
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
  vi.unstubAllGlobals();
});

describe('SzczegolyWidok', () => {
  it('read-only renderuje wszystkie pola układu DESIGN.md z datami pełnymi (nie względnymi)', () => {
    renderWidok(projektFixture());

    // Header: Wróć + Edytuj + Usuń.
    expect(screen.getByRole('link', { name: /wróć/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Edytuj' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń projekt' })).toBeInTheDocument();

    // Pill kategorii + data dodania PEŁNA (nie „dzisiaj"/„X dni temu").
    expect(screen.getByText('T-shirt')).toBeInTheDocument();
    expect(screen.getByText('dodano 15 cze 2025, 14:32')).toBeInTheDocument();

    // Nazwa jako nagłówek.
    expect(
      screen.getByRole('heading', { name: 'Tshirty Piast Anty KSG' }),
    ).toBeInTheDocument();

    // Grid: Kontakt / Dodał / Ostatnia zmiana (pełna data) + Uwagi.
    expect(screen.getByText('Kontakt')).toBeInTheDocument();
    expect(screen.getByText('Bombi')).toBeInTheDocument();
    expect(screen.getByText('Dodał')).toBeInTheDocument();
    expect(screen.getByText('Ania')).toBeInTheDocument();
    expect(screen.getByText('Ostatnia zmiana')).toBeInTheDocument();
    expect(screen.getByText('17 cze 2025, 09:15')).toBeInTheDocument();
    expect(screen.getByText('Uwagi')).toBeInTheDocument();
    expect(screen.getByText('Pantone 186C, dostarczyć do magazynu B')).toBeInTheDocument();
  });

  it('druga flaga ma pełną etykietę „PRZESŁANY HAFT/SITO" i stan aria-pressed z projektu', () => {
    renderWidok(projektFixture({ przeslany: false, rozpisane: true }));

    const przeslany = screen.getByRole('button', { name: 'PRZESŁANY HAFT/SITO' });
    expect(przeslany).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'ROZPISANE' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('puste kontakt/uwagi renderują „—"', () => {
    renderWidok(projektFixture({ kontakt: null, uwagi: null }));

    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('desktop: klik flagi wysyła PATCH natychmiast (bez ConfirmSheet) + toast „LABEL: TAK/NIE"', async () => {
    const user = userEvent.setup();
    const patch = trackPatch();

    renderWidok(projektFixture({ sprawdzony: false }));

    await user.click(screen.getByRole('button', { name: 'SPRAWDZONY' }));

    await waitFor(() => expect(patch.wyslany).toBe(true));
    expect(toastFn).toHaveBeenCalledWith('Tshirty Piast Anty KSG — SPRAWDZONY: TAK');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mobile: klik flagi otwiera ConfirmSheet; „Tak, zmień" → PATCH + toast', async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    const patch = trackPatch();

    renderWidok(projektFixture({ sprawdzony: false }));

    await user.click(screen.getByRole('button', { name: 'SPRAWDZONY' }));

    // Mutacja NIE poszła przed potwierdzeniem.
    const dialog = screen.getByRole('dialog', { name: 'Zaznaczyć flagę?' });
    expect(patch.wyslany).toBe(false);
    expect(within(dialog).getByText('Tshirty Piast Anty KSG')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Tak, zmień' }));

    await waitFor(() => expect(patch.wyslany).toBe(true));
    // Ta sama ścieżka co desktop: PATCH ustawia dokładnie tę flagę na nową wartość.
    expect(patch.body).toMatchObject({ sprawdzony: true });
    expect(toastFn).toHaveBeenCalledWith('Tshirty Piast Anty KSG — SPRAWDZONY: TAK');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mobile: „Anuluj" zamyka sheet bez mutacji', async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    const patch = trackPatch();

    renderWidok(projektFixture({ sprawdzony: false }));

    await user.click(screen.getByRole('button', { name: 'SPRAWDZONY' }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(patch.wyslany).toBe(false);
    expect(toastFn).not.toHaveBeenCalled();
  });

  it('Edytuj wywołuje callback strony', async () => {
    const user = userEvent.setup();
    const onEdytuj = vi.fn();

    renderWidok(projektFixture(), { onEdytuj });

    await user.click(screen.getByRole('button', { name: 'Edytuj' }));
    expect(onEdytuj).toHaveBeenCalledTimes(1);
  });

  it('Usuń otwiera UsunDialog; potwierdzenie → onUsun (archiwizacja)', async () => {
    const user = userEvent.setup();
    const onUsun = vi.fn();

    renderWidok(projektFixture(), { onUsun });

    // Klik kosza otwiera dialog — onUsun NIE odpala się od razu.
    await user.click(screen.getByRole('button', { name: 'Usuń projekt' }));
    expect(onUsun).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Tshirty Piast Anty KSG/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }));
    expect(onUsun).toHaveBeenCalledTimes(1);
  });

  it('Usuń → Anuluj zamyka dialog bez onUsun', async () => {
    const user = userEvent.setup();
    const onUsun = vi.fn();

    renderWidok(projektFixture(), { onUsun });

    await user.click(screen.getByRole('button', { name: 'Usuń projekt' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Anuluj' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onUsun).not.toHaveBeenCalled();
  });
});
