import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    render(<LoginPage />);

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

    render(<LoginPage />);
    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Nieprawidłowy email lub hasło');
  });

  it('wywołuje signInWithPassword z podanymi danymi i nie pokazuje błędu przy sukcesie', async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    render(<LoginPage />);
    await fillAndSubmit();

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'zespol@pracownia.pl',
      password: 'tajne123',
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
