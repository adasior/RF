import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

import { server } from './msw-server';

// jsdom NIE implementuje window.matchMedia — minimalny stub (domyślnie desktop:
// `matches: false`). Testy mobile nadpisują go przez `vi.stubGlobal('matchMedia', …)`
// (wzorzec z useIsMobile.test.ts) albo lokalny stub w pliku testu.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// MSW: przechwytuje wyłącznie żądania HTTP do zewnętrznych serwisów (Supabase REST).
// `onUnhandledRequest: 'error'` wymusza jawne mockowanie każdego żądania w teście.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
