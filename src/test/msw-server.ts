import { setupServer } from 'msw/node';

/**
 * Współdzielony serwer MSW dla testów warstwy danych.
 * Domyślnie bez handlerów — każdy test rejestruje własne przez `server.use(...)`,
 * dzięki czemu mockujemy TYLKO zewnętrzny serwis (Supabase REST).
 */
export const server = setupServer();

/** Bazowy host Supabase w testach (zgodny z vite.config.ts → test.env). */
export const SUPABASE_URL = 'http://supabase.test';
export const PROJEKTY_REST_URL = `${SUPABASE_URL}/rest/v1/projekty`;
