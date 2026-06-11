import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

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
