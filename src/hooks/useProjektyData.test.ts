import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { useProjektyData } from './useProjektyData';

/**
 * Rejestruje handler MSW na GET projekty, zapamiętuje URL żądania i zwraca [] .
 * Zwraca getter do odczytania przechwyconego URL po wykonaniu zapytania.
 */
function przechwycZapytanie() {
  let capturedUrl: URL | null = null;

  server.use(
    http.get(PROJEKTY_REST_URL, ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json([]);
    }),
  );

  return () => capturedUrl;
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useProjektyData', () => {
  it('bez filtrów: sortuje created_at desc i pobiera tylko aktywne (archived_at is null)', async () => {
    const getUrl = przechwycZapytanie();

    const { result } = renderHook(() => useProjektyData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getUrl();
    expect(url).not.toBeNull();
    expect(url?.searchParams.get('order')).toBe('created_at.desc');
    expect(url?.searchParams.get('archived_at')).toBe('is.null');
  });

  it('łączy filtr flagi (rozpisane=false) i szukaj przez AND (oba parametry w zapytaniu)', async () => {
    const getUrl = przechwycZapytanie();

    const { result } = renderHook(
      () => useProjektyData({ flaga: 'rozpisane', szukaj: 'koszulka' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getUrl();
    expect(url?.searchParams.get('rozpisane')).toBe('eq.false');
    expect(url?.searchParams.get('nazwa')).toBe('ilike.%koszulka%');
    // AND: aktywne pozostają domyślne mimo dodatkowych filtrów.
    expect(url?.searchParams.get('archived_at')).toBe('is.null');
  });

  it('escapuje \\, % i _ w szukaj — metaznaki LIKE trafiają do zapytania jako literały', async () => {
    const getUrl = przechwycZapytanie();

    const { result } = renderHook(() => useProjektyData({ szukaj: '50%_a\\b' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getUrl();
    expect(url?.searchParams.get('nazwa')).toBe('ilike.%50\\%\\_a\\\\b%');
  });

  it('przycina szukaj do 200 znaków na granicy', async () => {
    const getUrl = przechwycZapytanie();

    const { result } = renderHook(() => useProjektyData({ szukaj: 'a'.repeat(250) }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getUrl();
    expect(url?.searchParams.get('nazwa')).toBe(`ilike.%${'a'.repeat(200)}%`);
  });

  it('archiwum:true pobiera wyłącznie zarchiwizowane (archived_at is not null)', async () => {
    const getUrl = przechwycZapytanie();

    const { result } = renderHook(() => useProjektyData({ archiwum: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getUrl();
    expect(url?.searchParams.get('archived_at')).toBe('not.is.null');
  });

  it('zwraca wiersze z bazy', async () => {
    server.use(
      http.get(PROJEKTY_REST_URL, () =>
        HttpResponse.json([
          {
            id: '11111111-1111-1111-1111-111111111111',
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
          },
        ]),
      ),
    );

    const { result } = renderHook(() => useProjektyData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].nazwa).toBe('Koszulka');
  });

  it('odrzuca niepoprawny kształt danych z bazy (granica Zod → stan błędu)', async () => {
    server.use(
      http.get(PROJEKTY_REST_URL, () =>
        // Brak wymaganych pól (m.in. flag boolean) → projektSchema musi odrzucić.
        HttpResponse.json([{ id: 'nie-uuid', nazwa: 'Koszulka' }]),
      ),
    );

    const { result } = renderHook(() => useProjektyData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
