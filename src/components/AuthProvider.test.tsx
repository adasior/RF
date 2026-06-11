import type { Session } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/components/AuthProvider';
import { useAuth } from '@/components/auth-context';

const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const unsubscribe = vi.fn();

// Mockujemy TYLKO zewnętrzny serwis (Supabase auth). Logika providera realna.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: (cb: unknown) => onAuthStateChange(cb),
    },
  },
}));

const fakeSession = { access_token: 'token', user: { id: 'u1' } } as unknown as Session;

function AuthProbe() {
  const { session, loading } = useAuth();
  if (loading) return <span>loading</span>;
  return <span>{session ? 'zalogowany' : 'anon'}</span>;
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
  });

  it('udostępnia sesję po jej odczytaniu (getSession)', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } });

    renderProvider();

    expect(await screen.findByText('zalogowany')).toBeInTheDocument();
  });

  it('udostępnia stan anonimowy gdy brak sesji', async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    renderProvider();

    expect(await screen.findByText('anon')).toBeInTheDocument();
  });

  it('sprząta subskrypcję onAuthStateChange przy odmontowaniu', async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    const { unmount } = renderProvider();
    await screen.findByText('anon');

    unmount();

    await waitFor(() => expect(unsubscribe).toHaveBeenCalledTimes(1));
  });
});
