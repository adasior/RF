import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import type { Projekt } from '@/lib/types';

import { useRealtimeProjekty } from './useRealtimeProjekty';

type ChangeHandler = (payload: RealtimePostgresChangesPayload<Projekt>) => void;

// Mock TYLKO zewnętrznego serwisu (Supabase). Fake kanał zapamiętuje handler eventu
// (`capturedHandler`), by test mógł ręcznie wywołać callback `postgres_changes`.
// `removeChannel` to spy — asercja cleanu.
let capturedHandler: ChangeHandler | undefined;
const subscribeSpy = vi.fn();
const removeChannelSpy = vi.fn();
const channelSpy = vi.fn();

vi.mock('@/lib/supabase', () => {
  const fakeChannel = {
    on: (_type: string, _filter: unknown, handler: ChangeHandler) => {
      capturedHandler = handler;
      return fakeChannel;
    },
    subscribe: () => {
      subscribeSpy();
      return fakeChannel;
    },
  };
  return {
    supabase: {
      channel: (name: string) => {
        channelSpy(name);
        return fakeChannel;
      },
      removeChannel: (channel: unknown) => removeChannelSpy(channel),
    },
  };
});

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

function updatePayload(projekt: Projekt): RealtimePostgresChangesPayload<Projekt> {
  return {
    eventType: 'UPDATE',
    schema: 'public',
    table: 'projekty',
    commit_timestamp: '2026-06-13T12:00:00Z',
    errors: [],
    new: projekt,
    old: { id: projekt.id },
  } as RealtimePostgresChangesPayload<Projekt>;
}

function deletePayload(id: string): RealtimePostgresChangesPayload<Projekt> {
  return {
    eventType: 'DELETE',
    schema: 'public',
    table: 'projekty',
    commit_timestamp: '2026-06-13T12:00:00Z',
    errors: [],
    new: {},
    old: { id },
  } as RealtimePostgresChangesPayload<Projekt>;
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return { queryClient, Wrapper };
}

beforeEach(() => {
  capturedHandler = undefined;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRealtimeProjekty', () => {
  it('subskrybuje kanał `projekty` na zdarzenia postgres_changes', () => {
    const { Wrapper } = makeWrapper();
    renderHook(() => useRealtimeProjekty(), { wrapper: Wrapper });

    expect(channelSpy).toHaveBeenCalledWith('projekty');
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(capturedHandler).toBeTypeOf('function');
  });

  it('obcy event UPDATE inwaliduje cache listy (nowa wartość zostanie zrefetchowana)', () => {
    const { queryClient, Wrapper } = makeWrapper();
    const filtry = {};
    queryClient.setQueryData(queryKeys.lista(filtry), [projektFixture({ rozpisane: false })]);

    renderHook(() => useRealtimeProjekty(), { wrapper: Wrapper });

    capturedHandler?.(updatePayload(projektFixture({ rozpisane: true })));

    expect(queryClient.getQueryState(queryKeys.lista(filtry))?.isInvalidated).toBe(true);
  });

  it('obcy event UPDATE inwaliduje też cache detalu projektu (queryKeys.projekt(id))', () => {
    const { queryClient, Wrapper } = makeWrapper();
    const id = '11111111-1111-1111-1111-111111111111';
    queryClient.setQueryData(queryKeys.projekt(id), projektFixture());

    renderHook(() => useRealtimeProjekty(), { wrapper: Wrapper });

    capturedHandler?.(updatePayload(projektFixture({ id, rozpisane: true })));

    expect(queryClient.getQueryState(queryKeys.projekt(id))?.isInvalidated).toBe(true);
  });

  it('event DELETE (tylko `old.id`) inwaliduje listę i detal usuwanego rekordu', () => {
    const { queryClient, Wrapper } = makeWrapper();
    const id = '22222222-2222-2222-2222-222222222222';
    queryClient.setQueryData(queryKeys.lista({}), [projektFixture({ id })]);
    queryClient.setQueryData(queryKeys.projekt(id), projektFixture({ id }));

    renderHook(() => useRealtimeProjekty(), { wrapper: Wrapper });

    capturedHandler?.(deletePayload(id));

    expect(queryClient.getQueryState(queryKeys.lista({}))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.projekt(id))?.isInvalidated).toBe(true);
  });

  it('echo własnej mutacji (mutacja w toku) NIE inwaliduje cache — brak migotania', async () => {
    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.lista({}), [projektFixture()]);

    // Trwająca (niesfinalizowana) mutacja → useIsMutating() > 0.
    let zwolnij: (() => void) | undefined;
    const wToku = new Promise<void>((resolve) => {
      zwolnij = resolve;
    });

    const { result } = renderHook(
      () => {
        useRealtimeProjekty();
        return useMutation({ mutationFn: () => wToku });
      },
      { wrapper: Wrapper },
    );

    result.current.mutate();
    await waitFor(() => expect(result.current.isPending).toBe(true));

    // Echo własnej zmiany przychodzi w trakcie trwania mutacji.
    capturedHandler?.(updatePayload(projektFixture({ rozpisane: true })));

    // Lista NIE została zinwalidowana (dedup) — optimistic + onSettled reconciliują.
    expect(queryClient.getQueryState(queryKeys.lista({}))?.isInvalidated).toBe(false);

    zwolnij?.();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('sprząta subskrypcję przy odmontowaniu (removeChannel)', () => {
    const { Wrapper } = makeWrapper();
    const { unmount } = renderHook(() => useRealtimeProjekty(), { wrapper: Wrapper });

    expect(removeChannelSpy).not.toHaveBeenCalled();
    unmount();
    expect(removeChannelSpy).toHaveBeenCalledTimes(1);
  });
});
