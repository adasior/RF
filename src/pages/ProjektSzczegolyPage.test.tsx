import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { ProjektSzczegolyPage } from './ProjektSzczegolyPage';

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

const PROJEKT_ID = '11111111-1111-1111-1111-111111111111';

function projektFixture(over: Partial<Projekt> = {}): Projekt {
  return {
    id: PROJEKT_ID,
    nazwa: 'Tshirty Piast Anty KSG',
    kategoria: 'T-shirt',
    rozpisane: false,
    przeslany: false,
    sprawdzony: false,
    wydrukowany: false,
    kontakt: 'Bombi',
    uwagi: null,
    dodal: 'Ania',
    archived_at: null,
    created_at: '2025-06-15T14:32:00',
    updated_at: '2025-06-17T09:15:00',
    ...over,
  };
}

/** Handler GET `.single()` — istniejący projekt (PostgREST zwraca pojedynczy obiekt). */
function mockGetProjekt(projekt: Projekt): void {
  server.use(http.get(PROJEKTY_REST_URL, () => HttpResponse.json(projekt)));
}

/** Handler GET `.single()` — brak wiersza (PostgREST: 406 + kod PGRST116). */
function mockGetBrakRekordu(): void {
  server.use(
    http.get(PROJEKTY_REST_URL, () =>
      HttpResponse.json(
        {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
          details: 'The result contains 0 rows',
          hint: null,
        },
        { status: 406 },
      ),
    ),
  );
}

function renderPage(id: string = PROJEKT_ID) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projekt/${id}`]}>
        <Routes>
          <Route path="/" element={<div>Lista projektów</div>} />
          <Route path="/projekt/:id" element={<ProjektSzczegolyPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjektSzczegolyPage', () => {
  it('brak rekordu (PGRST116) → strona 404 „Nie znaleziono projektu" z działającym linkiem do /', async () => {
    const user = userEvent.setup();
    mockGetBrakRekordu();

    renderPage('99999999-9999-9999-9999-999999999999');

    expect(
      await screen.findByRole('heading', { name: 'Nie znaleziono projektu' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Wróć do listy' }));
    expect(await screen.findByText('Lista projektów')).toBeInTheDocument();
  });

  it('inny błąd niż 404 → komunikat błędu, NIE strona 404', async () => {
    server.use(
      http.get(PROJEKTY_REST_URL, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nie udało się wczytać projektu',
    );
    expect(screen.queryByText('Nie znaleziono projektu')).not.toBeInTheDocument();
  });

  it('Edytuj → formularz wypełniony, zmiana pola + „Zapisz zmiany" → PATCH + toast „Zmiany zapisane" + powrót do read-only', async () => {
    const user = userEvent.setup();
    mockGetProjekt(projektFixture());

    const holder: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      http.patch(PROJEKTY_REST_URL, async ({ request }) => {
        holder.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(projektFixture({ nazwa: 'Tshirty Piast V2' }));
      }),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edytuj' }));

    // Formularz wypełniony danymi projektu (bez pól flag).
    const nazwa = screen.getByLabelText(/nazwa projektu/i);
    expect(nazwa).toHaveValue('Tshirty Piast Anty KSG');
    expect(screen.getByLabelText(/kategoria/i)).toHaveValue('T-shirt');
    expect(screen.getByLabelText(/kontakt/i)).toHaveValue('Bombi');

    await user.clear(nazwa);
    await user.type(nazwa, 'Tshirty Piast V2');
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Zmiany zapisane'));
    // Update wysłał pola formularza, NIE dotyka flag.
    expect(holder.body).toMatchObject({ nazwa: 'Tshirty Piast V2', kategoria: 'T-shirt' });
    expect(holder.body).not.toHaveProperty('rozpisane');

    // Powrót do read-only ze zaktualizowaną nazwą (cache patchnięty odpowiedzią).
    expect(
      await screen.findByRole('heading', { name: 'Tshirty Piast V2' }),
    ).toBeInTheDocument();
  });

  it('Anuluj w trybie edycji → brak PATCH, powrót do read-only', async () => {
    const user = userEvent.setup();
    mockGetProjekt(projektFixture());

    const tracker = { wyslany: false };
    server.use(
      http.patch(PROJEKTY_REST_URL, () => {
        tracker.wyslany = true;
        return HttpResponse.json(projektFixture());
      }),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edytuj' }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(
      await screen.findByRole('heading', { name: 'Tshirty Piast Anty KSG' }),
    ).toBeInTheDocument();
    expect(tracker.wyslany).toBe(false);
  });

  it('Usuń (placeholder U10) → archiwizacja + toast „Projekt usunięty" + powrót na listę', async () => {
    const user = userEvent.setup();
    mockGetProjekt(projektFixture());

    const holder: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      http.patch(PROJEKTY_REST_URL, async ({ request }) => {
        holder.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Usuń projekt' }));

    expect(await screen.findByText('Lista projektów')).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith('Projekt usunięty');
    expect(holder.body).toHaveProperty('archived_at');
    expect(holder.body?.archived_at).toEqual(expect.any(String));
  });
});
