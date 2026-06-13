import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { useProjektAkcje } from './useProjektAkcje';

// Mockujemy TYLKO sonner (zewnętrzny UI) — asercja toastów bez renderowania.
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

function projektFixture(over: Partial<Projekt> = {}): Projekt {
  return {
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
    ...over,
  };
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return renderHook(() => useProjektAkcje(), { wrapper: Wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useProjektAkcje', () => {
  it('start: brak otwartego dialogu', () => {
    const { result } = setup();
    expect(result.current.dialog.rodzaj).toBe('brak');
  });

  it('otworzUsun → dialog „usun"; potwierdzUsun → PATCH archived_at + toast + zamknięcie', async () => {
    const holder: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      http.patch(PROJEKTY_REST_URL, async ({ request }) => {
        holder.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    const { result } = setup();
    const projekt = projektFixture();

    act(() => result.current.otworzUsun(projekt));
    expect(result.current.dialog).toEqual({ rodzaj: 'usun', projekt });

    act(() => result.current.potwierdzUsun());

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Projekt przeniesiony do archiwum'));
    expect(holder.body?.archived_at).toEqual(expect.any(String));
    expect(result.current.dialog.rodzaj).toBe('brak'); // zamknięty po sukcesie
  });

  it('przywroc → PATCH archived_at=null + toast „Projekt przywrócony"', async () => {
    const holder: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      http.patch(PROJEKTY_REST_URL, async ({ request }) => {
        holder.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    const { result } = setup();
    act(() => result.current.przywroc(projektFixture({ archived_at: '2026-06-12T10:00:00Z' })));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Projekt przywrócony'));
    expect(holder.body).toEqual({ archived_at: null });
  });

  it('otworzHard → dialog „hard"; potwierdzHard → DELETE + toast „Projekt usunięty bezpowrotnie" + zamknięcie', async () => {
    const holder: { url: URL | null } = { url: null };
    server.use(
      http.delete(PROJEKTY_REST_URL, ({ request }) => {
        holder.url = new URL(request.url);
        return HttpResponse.json([], { status: 204 });
      }),
    );

    const { result } = setup();
    const projekt = projektFixture({ archived_at: '2026-06-12T10:00:00Z' });

    act(() => result.current.otworzHard(projekt));
    expect(result.current.dialog).toEqual({ rodzaj: 'hard', projekt });

    act(() => result.current.potwierdzHard());

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Projekt usunięty bezpowrotnie'));
    expect(holder.url?.searchParams.get('id')).toBe(`eq.${projekt.id}`);
    expect(result.current.dialog.rodzaj).toBe('brak');
  });

  it('guard: potwierdzUsun bez otwartego dialogu „usun" → brak żądania, dialog pozostaje „brak"', async () => {
    let requestWyslane = false;
    server.use(
      http.patch(PROJEKTY_REST_URL, () => {
        requestWyslane = true;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    const { result } = setup();
    act(() => result.current.potwierdzHard()); // też no-op (dialog „brak")
    act(() => result.current.potwierdzUsun());

    expect(requestWyslane).toBe(false);
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(result.current.dialog.rodzaj).toBe('brak');
  });

  it('błąd archiwizacji (500): dialog NIE zamyka się, brak toastu sukcesu', async () => {
    server.use(
      http.patch(PROJEKTY_REST_URL, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );

    const { result } = setup();
    act(() => result.current.otworzUsun(projektFixture()));
    act(() => result.current.potwierdzUsun());

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Błąd — spróbuj ponownie'));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(result.current.dialog.rodzaj).toBe('usun'); // zostaje otwarty
  });
});
