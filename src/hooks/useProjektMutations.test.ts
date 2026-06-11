import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import type { Projekt } from '@/lib/types';
import { PROJEKTY_REST_URL, server } from '@/test/msw-server';

import { useProjektMutations } from './useProjektMutations';

// Mockujemy TYLKO sonner (zewnętrzny UI), by asertować toast bez renderowania.
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => toastError(msg) },
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

  const { result } = renderHook(() => useProjektMutations(), { wrapper: Wrapper });
  return { result, queryClient };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('create', () => {
  it('odrzuca brak nazwy przez walidację Zod PRZED wysłaniem żądania', async () => {
    let requestWyslane = false;
    server.use(
      http.post(PROJEKTY_REST_URL, () => {
        requestWyslane = true;
        return HttpResponse.json(projektFixture(), { status: 201 });
      }),
    );

    const { result } = setup();

    await expect(
      // @ts-expect-error celowo niepoprawny input (brak nazwy) — walidacja Zod.
      result.current.create.mutateAsync({ kategoria: 'T-shirt', dodal: 'Ania' }),
    ).rejects.toThrow();

    expect(requestWyslane).toBe(false);
  });

  it('wysyła nowy projekt z 4 flagami false', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(PROJEKTY_REST_URL, async ({ request }) => {
        const json = (await request.json()) as Record<string, unknown>;
        body = json;
        return HttpResponse.json(projektFixture(), { status: 201 });
      }),
    );

    const { result } = setup();

    await result.current.create.mutateAsync({
      nazwa: 'Nowy projekt',
      kategoria: 'T-shirt',
      dodal: 'Ania',
    });

    expect(body).not.toBeNull();
    expect(body).toMatchObject({
      nazwa: 'Nowy projekt',
      kategoria: 'T-shirt',
      dodal: 'Ania',
      rozpisane: false,
      przeslany: false,
      sprawdzony: false,
      wydrukowany: false,
    });
  });
});

describe('toggleFlaga', () => {
  it('optimistic: ustawia nową wartość w cache natychmiast', async () => {
    server.use(
      http.patch(PROJEKTY_REST_URL, () => HttpResponse.json([], { status: 204 })),
    );

    const { result, queryClient } = setup();
    const filtry = {};
    queryClient.setQueryData(queryKeys.lista(filtry), [
      projektFixture({ rozpisane: false }),
    ]);

    result.current.toggleFlaga.mutate({
      id: '11111111-1111-1111-1111-111111111111',
      key: 'rozpisane',
      nowaWartosc: true,
    });

    await waitFor(() => {
      const lista = queryClient.getQueryData<Projekt[]>(queryKeys.lista(filtry));
      expect(lista?.[0].rozpisane).toBe(true);
    });
  });

  it('błąd sieci: rollback do poprzedniej wartości + toast + stan błędu mutacji (bez re-throw)', async () => {
    server.use(
      http.patch(PROJEKTY_REST_URL, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );

    const { result, queryClient } = setup();
    const filtry = {};
    queryClient.setQueryData(queryKeys.lista(filtry), [
      projektFixture({ rozpisane: false }),
    ]);

    // `mutate` (nie mutateAsync) — kontrakt: brak unhandled rejection, UI czyta `isError`.
    result.current.toggleFlaga.mutate({
      id: '11111111-1111-1111-1111-111111111111',
      key: 'rozpisane',
      nowaWartosc: true,
    });

    await waitFor(() => expect(result.current.toggleFlaga.isError).toBe(true));

    // Rollback: wartość wróciła do false.
    const lista = queryClient.getQueryData<Projekt[]>(queryKeys.lista(filtry));
    expect(lista?.[0].rozpisane).toBe(false);
    // Toast pokazany.
    expect(toastError).toHaveBeenCalledWith('Błąd — spróbuj ponownie');
  });

  it('onSettled invaliduje też cache detalu projektu (queryKeys.projekt(id))', async () => {
    server.use(
      http.patch(PROJEKTY_REST_URL, () => HttpResponse.json([], { status: 204 })),
    );

    const { result, queryClient } = setup();
    const id = '11111111-1111-1111-1111-111111111111';
    queryClient.setQueryData(queryKeys.projekt(id), projektFixture());

    await result.current.toggleFlaga.mutateAsync({
      id,
      key: 'rozpisane',
      nowaWartosc: true,
    });

    expect(queryClient.getQueryState(queryKeys.projekt(id))?.isInvalidated).toBe(true);
  });
});

describe('archive / restore / hardDelete', () => {
  const id = '11111111-1111-1111-1111-111111111111';

  it('archive ustawia archived_at na wartość niepustą (PATCH)', async () => {
    const holder: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      http.patch(PROJEKTY_REST_URL, async ({ request }) => {
        holder.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    const { result } = setup();
    await result.current.archive.mutateAsync(id);

    expect(holder.body).not.toBeNull();
    expect(holder.body?.archived_at).toEqual(expect.any(String));
  });

  it('restore ustawia archived_at na null (PATCH)', async () => {
    const holder: { body: Record<string, unknown> | null } = { body: null };
    server.use(
      http.patch(PROJEKTY_REST_URL, async ({ request }) => {
        holder.body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json([], { status: 204 });
      }),
    );

    const { result } = setup();
    await result.current.restore.mutateAsync(id);

    expect(holder.body).toEqual({ archived_at: null });
  });

  it('hardDelete wysyła DELETE z filtrem id', async () => {
    const holder: { url: URL | null } = { url: null };
    server.use(
      http.delete(PROJEKTY_REST_URL, ({ request }) => {
        holder.url = new URL(request.url);
        return HttpResponse.json([], { status: 204 });
      }),
    );

    const { result } = setup();
    await result.current.hardDelete.mutateAsync(id);

    expect(holder.url).not.toBeNull();
    expect(holder.url?.searchParams.get('id')).toBe(`eq.${id}`);
  });
});
