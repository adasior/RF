import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

import { server } from './msw-server';

// MSW: przechwytuje wyłącznie żądania HTTP do zewnętrznych serwisów (Supabase REST).
// `onUnhandledRequest: 'error'` wymusza jawne mockowanie każdego żądania w teście.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
