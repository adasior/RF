import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const ListaPage = lazy(() => import('@/pages/ListaPage'));
const NowyProjektPage = lazy(() => import('@/pages/NowyProjektPage'));
const ProjektSzczegolyPage = lazy(() => import('@/pages/ProjektSzczegolyPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ListaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nowy"
                element={
                  <ProtectedRoute>
                    <NowyProjektPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projekt/:id"
                element={
                  <ProtectedRoute>
                    <ProjektSzczegolyPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
