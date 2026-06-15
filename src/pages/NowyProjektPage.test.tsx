import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OSOBY } from '@/lib/config';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { NowyProjektPage } from './NowyProjektPage';

// Mockujemy TYLKO sonner (zewnętrzny UI) — asercja toastu bez renderowania Toaster.
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/nowy']}>
        <Routes>
          <Route path="/" element={<div>Lista projektów</div>} />
          <Route path="/nowy" element={<NowyProjektPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function wypelnijFormularz(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nazwa projektu/i), 'Koszulki firmowe');
  await user.selectOptions(screen.getByLabelText(/kategoria/i), 'T-shirt');
  await user.click(screen.getByRole('radio', { name: OSOBY[0] }));
  await user.click(screen.getByRole('button', { name: 'Zapisz projekt' }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NowyProjektPage', () => {
  it('poprawny submit: create z 4 flagami false → toast „Projekt dodany" + redirect /', async () => {
    const user = userEvent.setup();
    const holder: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      http.post(PROJEKTY_REST_URL, async ({ request }) => {
        holder.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: '11111111-1111-1111-1111-111111111111',
            nazwa: 'Koszulki firmowe',
            kategoria: 'T-shirt',
            rozpisane: false,
            przeslany: false,
            sprawdzony: false,
            wydrukowany: false,
            kontakt: null,
            uwagi: null,
            dodal: OSOBY[0],
            archived_at: null,
            created_at: '2026-06-12T10:00:00Z',
            updated_at: '2026-06-12T10:00:00Z',
          },
          { status: 201 },
        );
      }),
    );

    renderPage();
    await wypelnijFormularz(user);

    expect(await screen.findByText('Lista projektów')).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith('Projekt dodany');
    expect(holder.body).toMatchObject({
      nazwa: 'Koszulki firmowe',
      kategoria: 'T-shirt',
      dodal: OSOBY[0],
      rozpisane: false,
      przeslany: false,
      sprawdzony: false,
      wydrukowany: false,
    });
  });

  it('błąd zapisu: toast błędu, użytkownik zostaje na formularzu', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(PROJEKTY_REST_URL, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    renderPage();
    await wypelnijFormularz(user);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Błąd — spróbuj ponownie'));
    expect(screen.queryByText('Lista projektów')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zapisz projekt' })).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('Anuluj wraca na listę bez zapisu', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(await screen.findByText('Lista projektów')).toBeInTheDocument();
  });
});
