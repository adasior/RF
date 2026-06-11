import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { useProjektData } from './useProjektData';

const ID = '11111111-1111-1111-1111-111111111111';

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useProjektData', () => {
  it('pobiera pojedynczy projekt po id', async () => {
    server.use(
      http.get(PROJEKTY_REST_URL, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('id')).toBe(`eq.${ID}`);
        return HttpResponse.json({
          id: ID,
          nazwa: 'Koszulka',
          kategoria: 'T-shirt',
          rozpisane: false,
          przeslany: false,
          sprawdzony: false,
          wydrukowany: false,
          kontakt: null,
          uwagi: null,
          dodal: 'Ania',
          archived_at: null,
          created_at: '2026-06-11T10:00:00Z',
          updated_at: '2026-06-11T10:00:00Z',
        });
      }),
    );

    const { result } = renderHook(() => useProjektData(ID), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nazwa).toBe('Koszulka');
  });

  it('nie uruchamia zapytania gdy brak id (enabled=false)', () => {
    const { result } = renderHook(() => useProjektData(undefined), {
      wrapper: createWrapper(),
    });

    // Brak id → query disabled → status pending bez fetchu (brak handlera = brak żądania).
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('propaguje błąd gdy serwer zwraca 500', async () => {
    server.use(
      http.get(PROJEKTY_REST_URL, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useProjektData(ID), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
