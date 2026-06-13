import type { Session } from '@supabase/supabase-js';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/components/auth-context';
import { LoginPage } from '@/pages/LoginPage';

const signInWithPassword = vi.fn();

// Mockujemy TYLKO zewnętrzny serwis (Supabase auth).
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (creds: unknown) => signInWithPassword(creds),
    },
  },
}));

/** Renderuje LoginPage w kontekście sesji + routerze (LoginPage używa useAuth + Navigate). */
function renderLogin(session: Session | null = null) {
  return render(
    <AuthContext.Provider value={{ session, isLoading: false }}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Lista projektów</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

async function fillAndSubmit(): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'zespol@pracownia.pl');
  await user.type(screen.getByLabelText('Hasło'), 'tajne123');
  await user.click(screen.getByRole('button', { name: /zaloguj/i }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submit z pustymi polami: komunikat „Podaj email i hasło", auth NIE wywołane', async () => {
    renderLogin();

    // jsdom blokuje klik submitu przez natywne `required` — dispatch submit
    // bezpośrednio, by pokryć guard `!email || !password` w loginAction.
    const form = screen.getByRole('button', { name: /zaloguj/i }).closest('form');
    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Podaj email i hasło');
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('pokazuje inline błąd PL gdy auth odrzuca logowanie', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

    renderLogin();
    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Nieprawidłowy email lub hasło');
  });

  it('wywołuje signInWithPassword z podanymi danymi i nie pokazuje błędu przy sukcesie', async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    renderLogin();
    await fillAndSubmit();

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'zespol@pracownia.pl',
      password: 'tajne123',
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('z istniejącą sesją przekierowuje na / (regresja: po zalogowaniu nie zostaje na /login)', () => {
    const session = { access_token: 'abc', user: { id: '1' } } as unknown as Session;

    renderLogin(session);

    expect(screen.getByText('Lista projektów')).toBeInTheDocument();
    // Formularz logowania nie jest renderowany, gdy sesja istnieje.
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });
});
