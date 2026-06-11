import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from './useIsMobile';

interface MatchMediaMock {
  mediaQueryList: MediaQueryList;
  emitChange: (matches: boolean) => void;
  removeEventListener: ReturnType<typeof vi.fn>;
}

/** Stubuje `window.matchMedia` (brak w jsdom) z kontrolą `matches` i emisją `change`. */
function stubMatchMedia(initialMatches: boolean): MatchMediaMock {
  let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
  const removeEventListener = vi.fn();

  const mediaQueryList = {
    matches: initialMatches,
    media: '(max-width: 767px)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      changeListener = listener;
    },
    removeEventListener,
  } as unknown as MediaQueryList;

  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQueryList));

  return {
    mediaQueryList,
    emitChange: (matches: boolean) => {
      changeListener?.({ matches } as MediaQueryListEvent);
    },
    removeEventListener,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useIsMobile', () => {
  it('zwraca true gdy media query pasuje (viewport < 768px)', () => {
    stubMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('zwraca false gdy media query nie pasuje (viewport ≥ 768px)', () => {
    stubMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('reaguje na event change — zmiana szerokości aktualizuje wartość', () => {
    const media = stubMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      media.emitChange(true);
    });

    expect(result.current).toBe(true);
  });

  it('sprząta listener change przy odmontowaniu', () => {
    const media = stubMatchMedia(false);

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
