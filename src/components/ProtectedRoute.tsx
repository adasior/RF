import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/components/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Bramka tras chronionych.
 * - isLoading → krótki stan ładowania (bez fade, per DESIGN.md).
 * - brak sesji → przekierowanie na /login.
 * - sesja → renderuje children.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <span className="text-sm text-text-secondary">Ładowanie…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
