# Projekt: System zarządzania projektami odzieżowymi

Wewnętrzne narzędzie zastępujące arkusz Google Sheets (hafty, sitodruk, sublimacja).
4 osoby w biurze, ~50–150 projektów miesięcznie.

## Start

```bash
npm install
npm run dev
```

## Skrypty

- `npm run dev` — serwer deweloperski (Vite)
- `npm run build` — typecheck + build produkcyjny
- `npm run typecheck` — kontrola typów bez emisji
- `npm run test` — testy (Vitest)
- `npm run lint` — ESLint

## Stack (REALNY — nie ten ze SPEC_projekty.md)

- **Vite SPA + React 19 + TypeScript** (NIE Next.js — decyzja D1)
- **Supabase** (PostgreSQL) — CRUD bezpośrednio front→Supabase pod RLS, bez API Routes / Edge Functions
- **Supabase Auth + RLS** (wspólne konto zespołu) — pole `kontakt` to dane osobowe (RODO), decyzja D3
- **React Router v7** — trasy `/login`, `/`, `/nowy`, `/projekt/:id`, `*`/404
- **React Query** (cache, optimistic, Realtime reconcile), **React Hook Form + Zod** (formularze)
- **Tailwind CSS v4** — tokeny w `src/index.css` (`@theme`), NIE `tailwind.config.js`
- **sonner** (toasty), **lucide-react** (ikony)
- Testy: **Vitest + React Testing Library + MSW**

## Env (.env — prefix VITE_, NIE NEXT_PUBLIC_)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Service role key NIGDY nie trafia do frontu.

## Zasady

- UI w całości po polsku.
- Klient Supabase z `src/lib/supabase.ts`.
- `OSOBY`, `KATEGORIE`, `FLAGI` zawsze z `src/lib/config.ts` — nie hardcoduj.
- Model: 4 niezależne flagi boolean (`rozpisane` / `przeslany` / `sprawdzony` / `wydrukowany`).
  Brak statusu głównego, numerów ZAM-XXX, terminów, kanbana.
- Widok główny: tabela desktop / karty 2×2 mobile (breakpoint 768px, `matchMedia`).
- Toggle flagi: **desktop natychmiastowy** (optimistic, bez potwierdzenia); **mobile = bottom sheet** (`ConfirmSheet`).
- Optimistic updates + rollback przy błędzie; błędy pokazywane toastem.
- Formularz: mobile-first (min-height 48px), natywny `<select>` dla kategorii; „Inne…" → dodatkowy input.
- Nowy projekt: zawsze 4 flagi = false (formularz ich nie zawiera).
- Filtry z licznikami (client-side), aktualizowane po każdej zmianie flagi.
- Soft delete (`archived_at`); hard delete tylko z archiwum (3-stopniowe potwierdzenie).

## Źródła prawdy

- Design wizualny: `DESIGN.md` (v5) — tokeny portowane 1:1 do `src/index.css` `@theme`.
- Funkcjonalność + schemat + config: `SPEC_projekty.md` (v5).
  ⚠ Sekcje „Stack" (Next.js/Vercel/API Routes) oraz „Bezpieczeństwo" (brak auth, RLS off)
  w SPEC są NIEAKTUALNE — zastąpione decyzjami D1/D3 (patrz wyżej).
- Plan i zadania: `docs/active/zarzadzanie-projektami/`.
