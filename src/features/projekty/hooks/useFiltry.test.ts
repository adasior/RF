import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFiltry } from './useFiltry';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useFiltry', () => {
  it('domyślnie: flaga undefined, szukaj pusty, archiwum false', () => {
    const { result } = renderHook(() => useFiltry());

    expect(result.current.filtry).toEqual({
      flaga: undefined,
      szukaj: '',
      archiwum: false,
    });
  });

  it('setFlaga ustawia aktywną flagę', () => {
    const { result } = renderHook(() => useFiltry());

    act(() => {
      result.current.setFlaga('rozpisane');
    });

    expect(result.current.filtry.flaga).toBe('rozpisane');
  });

  it('szukaj jest debounce’owany — wartość w filtry aktualizuje się dopiero po opóźnieniu', () => {
    const { result } = renderHook(() => useFiltry());

    act(() => {
      result.current.setSzukaj('kosz');
    });

    // Natychmiast: szukajInput odzwierciedla wpisany tekst (kontrolowany input)...
    expect(result.current.szukajInput).toBe('kosz');
    // ...ale debounce’owana wartość w filtry jeszcze pusta.
    expect(result.current.filtry.szukaj).toBe('');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.filtry.szukaj).toBe('kosz');
  });

  it('setArchiwum(true) przełącza wymiar archiwum i czyści aktywną flagę', () => {
    const { result } = renderHook(() => useFiltry());

    act(() => {
      result.current.setFlaga('rozpisane');
    });
    expect(result.current.filtry.flaga).toBe('rozpisane');

    act(() => {
      result.current.setArchiwum(true);
    });

    expect(result.current.filtry.archiwum).toBe(true);
    // Wejście do archiwum czyści filtr flagi (inny kontekst akcji).
    expect(result.current.filtry.flaga).toBeUndefined();
  });

  it('reset czyści szukaj i wraca do flaga undefined', () => {
    const { result } = renderHook(() => useFiltry());

    act(() => {
      result.current.setFlaga('przeslany');
      result.current.setSzukaj('logo');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.filtry.flaga).toBe('przeslany');
    expect(result.current.filtry.szukaj).toBe('logo');

    act(() => {
      result.current.reset();
    });

    expect(result.current.filtry.flaga).toBeUndefined();
    expect(result.current.szukajInput).toBe('');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.filtry.szukaj).toBe('');
  });
});
