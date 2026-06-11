import type { Session } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AuthContext, type AuthState } from '@/components/auth-context';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function renderGuard(auth: AuthState) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Chroniona treść</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Ekran logowania</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const fakeSession = { access_token: 'token', user: { id: 'u1' } } as unknown as Session;

describe('ProtectedRoute', () => {
  it('bez sesji przekierowuje na /login', () => {
    renderGuard({ session: null, isLoading: false });

    expect(screen.getByText('Ekran logowania')).toBeInTheDocument();
    expect(screen.queryByText('Chroniona treść')).not.toBeInTheDocument();
  });

  it('z sesją renderuje children', () => {
    renderGuard({ session: fakeSession, isLoading: false });

    expect(screen.getByText('Chroniona treść')).toBeInTheDocument();
    expect(screen.queryByText('Ekran logowania')).not.toBeInTheDocument();
  });

  it('podczas ładowania nie przekierowuje ani nie renderuje children — pokazuje stan ładowania', () => {
    renderGuard({ session: null, isLoading: true });

    expect(screen.queryByText('Ekran logowania')).not.toBeInTheDocument();
    expect(screen.queryByText('Chroniona treść')).not.toBeInTheDocument();
    expect(screen.getByText('Ładowanie…')).toBeInTheDocument();
  });
});
