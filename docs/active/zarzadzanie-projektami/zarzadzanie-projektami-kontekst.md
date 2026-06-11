# Kontekst: System zarządzania projektami odzieżowymi — MVP

**Branch:** `feature/zarzadzanie-zamowieniami` (nazwa brancha zachowana dla ciągłości git)
**Ostatnia aktualizacja:** 2026-06-11

> ⚠ Koncept zmieniony 2026-06-10: z „zamówień" (pojedynczy status główny, kanban,
> numery ZAM-XXX, terminy) na „projekty odzieżowe" (4 niezależne flagi, tabela/karty,
> kategorie, filtry z licznikami). Źródłem prawdy są nowe `SPEC_projekty.md` (v5) i
> `DESIGN.md` (v5). Część świadomych decyzji architektonicznych z poprzedniego planu
> zostaje utrzymana wbrew literalnemu SPEC (stack, auth, Realtime, soft-delete) — zob.
> tabela decyzji.

## Designerski kontekst

- **DESIGN.md (projekt-wide):** `./DESIGN.md` (v5.0 — finalna, zatwierdzona po mockupach)
- **SPEC.md (funkcjonalny):** `./SPEC_projekty.md` (v5 — finalna)
- **Screeny referencyjne:** brak (mockupy ASCII wewnątrz SPEC/DESIGN)

> Te pliki są MANDATORY context dla subagentów buildujących UI. `dev-docs-execute`
> wstrzykuje je do promptu Agent tool. `DESIGN.md` v5 jest źródłem prawdy o wyświetlaniu —
> każdy komponent UI lustruje pomiary 1:1 (paleta, typografia, pomiary tabeli/kart/flag).

## Powiązane pliki

### Dokumentacja źródłowa (read-only referencje)
- `DESIGN.md` (root, v5) — paleta terakota `#B5542D`, tła `#FCFBF9`, fonty Inter + Fraunces
  (Fraunces italic w logo), tokeny, layouty: header / belka filtrów / tabela desktop / karty
  mobile 2×2 / FlagBtn / ConfirmSheet / formularz / szczegóły / FAB / toast / empty states / ikony Lucide.
- `SPEC_projekty.md` (root, v5) — schemat SQL (tabela `projekty`, trigger `updated_at`),
  4 niezależne flagi boolean, lista `OSOBY`/`KATEGORIE`/`FLAGI`, kształt widoków, kolejność
  implementacji. **Stack ze SPEC (Next.js 14 / API Routes / Vercel) jest NIEAKTUALNY** —
  zastąpiony przez D1 (Vite SPA). **Brak auth ze SPEC jest NIEAKTUALNY** — zastąpiony przez D3 (RODO).
- `SPEC_zamowienia.md` (root) — **przestarzały** (poprzedni koncept „zamówienia"), nie używać.

### Repo
- **Greenfield** — repo zawiera tylko `docs/`, `DESIGN.md`, `SPEC_projekty.md`, `.claude/`.
  Brak `package.json`, `src/`, `supabase/`. Pierwszy unit (U1) to scaffolding.
- `docs/solutions/` — pusty (brak wniosków do reużycia).

### Pliki do stworzenia (kluczowe, per faza)
- **Fundament:** `src/lib/{supabase,config,types,format,schemas,queryKeys}.ts`, `src/index.css`
  (`@theme`), `supabase/migrations/000{1,2,3}_*.sql`, `src/components/{AuthProvider,ProtectedRoute,Header}.tsx`
- **Dane + UI:** `src/hooks/{useProjektyData,useProjektData,useProjektMutations}.ts`,
  `src/features/projekty/components/{ProjektTabela,ProjektKarty,FlagBtn,ConfirmSheet,Filtry,EmptyState,
  ProjektForm,OsobaSegmented,SzczegolyWidok,UsunDialog,HardDeleteDialog}.tsx`, `src/components/Fab.tsx`
- **Hooki feature:** `src/features/projekty/hooks/{useFiltry,useRealtimeProjekty,useIsMobile}.ts`
- **Strony:** `src/pages/{ListaPage,NowyProjektPage,ProjektSzczegolyPage,LoginPage,NotFoundPage}.tsx`

## Decyzje techniczne (skrót — pełne w planie)

| # | Decyzja | Uzasadnienie |
|---|---------|--------------|
| Tokeny | `@theme {}` w `src/index.css`, nie `tailwind.config.js` | Tailwind v4 CSS-first; port 1:1 z `DESIGN.md` v5 |
| D1 | **Vite SPA + React 19** (nie Next.js) | narzędzie wewnętrzne; tooling repo + skille pod Vite. SPEC-owy Next.js/Vercel/API Routes NIEAKTUALNY |
| D2 | CRUD bezpośrednio front→Supabase pod RLS; bez API Routes / Edge Functions | konsekwencja D1; prosty MVP |
| D3 | **Supabase Auth (wspólne konto) + RLS `authenticated`-only** | wbrew SPEC („bez auth"); pole `kontakt` = dane osobowe (RODO), anon key w bundlu Vite nie chroni |
| D4 | **4 niezależne flagi boolean** (`rozpisane`/`przeslany`/`sprawdzony`/`wydrukowany`), bez statusu głównego | rdzeń nowego konceptu; brak kanbana, brak StatusPicker |
| D5 | Toggle flagi: **desktop natychmiastowy** (optimistic, bez potwierdzenia); **mobile = bottom sheet** | SPEC; wykrywanie mobile przez `matchMedia(<768px)`, nie user-agent |
| D6 | Soft delete `archived_at`; hard delete tylko z archiwum | zachowane wbrew SPEC (prosty delete) — bezpieczeństwo przy 4 osobach + optimistic |
| D7 | Realtime `postgres_changes` patchuje cache React Query | zachowane wbrew SPEC (brak wzmianki) — praca równoległa 4 osób |
| D8 | Brak numerów w UI, brak terminów, brak kanbana | model `projekty` nie ma kolumny `numer` ani `termin`; SPEC „Nie ma: statusu głównego, numerów, terminów" |
| D9 | Kategoria = natywny `<select>`; opcja „Inne…" → dodatkowy input tekstowy → `kategoria` | lepsze UX mobile (SPEC) |
| D10 | Liczniki filtrów liczone client-side z pełnego datasetu | ~50–150 wierszy; prościej niż 5 zapytań count, aktualizacja po każdej zmianie flagi |
| Data | React Query + Zod na granicy + RHF | zgodność z `tailwind-react-guidelines`; cache do reconciliacji Realtime |
| Router | React Router v7 | SPA bez SSR: `/login`, `/`, `/nowy`, `/projekt/:id`, `*`/404 |

## Zależności

### Zewnętrzne (npm)
tailwindcss v4 (+`@tailwindcss/vite`), shadcn/ui, react-router-dom, @tanstack/react-query,
react-hook-form, zod, @hookform/resolvers, sonner, lucide-react, @supabase/supabase-js,
vitest, @testing-library/react, msw.

### Operatorskie (poza kodem — blokujące E2E/deploy)
- Projekt Supabase + `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` w `.env` (U1).
- Aplikacja migracji w Supabase + włączenie Realtime dla `projekty` (U2).
- Wspólne konto zespołu (email+hasło) w Supabase Auth (U3).
- Finalne wartości `OSOBY` / `KATEGORIE` w `config.ts` przed deployem.

### Wewnętrzne (graf zależności Units)
U1 → U2 → U3 → U4 → {U5} → {U6, U7, U8, U9}; U4/U6/U9 → U10; U4/U2/U5/U8 → U11;
U5/U6/U7/U8/U10 → U12.

## Odroczone do implementacji (z planu)
- Dokładny algorytm dedup optimistic ↔ echo Realtime (U11) — start od `updated_at` + pending mutation IDs.
- Nazwy helperów hooków/mutacji i kształt kluczy React Query.
- Copy 3-stopniowego dialogu hard delete; domyślnie potwierdzenie bez wpisywania tekstu (U10).
- Finalne `OSOBY`/`KATEGORIE` (operator).
- Faza 2 SPEC: opcjonalny PIN 4-cyfrowy — poza scope MVP.
- Sentry — poza scope MVP.

## Dziennik implementacji

### Faza 1 — Fundament (ukończona 2026-06-11)

Wszystkie 3 Implementation Units Fazy 1 zrealizowane przez subagentów (strategia: serial — łańcuch zależności U1→U2→U3). Commity: `83dc287` (U1), `ceed23f` (U2), `94a8281` (U3).

**U1 — Scaffolding (feature-builder-fullstack):** Vite SPA (React 19 + TS) + TailwindCSS v4 z tokenami `DESIGN.md` v5 w `@theme` (`src/index.css`), React Router v7 (5 tras + 404), QueryClientProvider + Sonner, klient Supabase, `config.ts` (OSOBY/KATEGORIE/FLAGI ze SPEC), `format.ts`/`types.ts`, placeholdery stron, `CLAUDE.md`. Testy: 14/14 (config 6 + format 8). typecheck/build/lint czyste.
- Decyzja: tokeny `@theme` jako hex 1:1 z DESIGN.md (nie OKLCH); daty PL przez stałą tablicę skrótów miesięcy (nie `Intl` — runtime dodaje kropkę „cze.").
- Decyzja: `archived_at` dodane do `types.ts` od razu (D6), choć kolumna powstaje w U2 — typ jako źródło prawdy apki.
- **Odchylenie:** shadcn/ui pominięty (plan dopuszczał) — init w pierwszym IU UI, które tego wymaga. Wersje deps podbite do patchy (0 vulnerabilities). `msw` zainstalowany, użycie w U4. Wszystkie odchylenia w granicach planu — bez zmiany scope.

**U2 — Schemat bazy (feature-builder-data):** `supabase/migrations/0001-0003` (tabela `projekty` + 4 flagi + `archived_at` + trigger; RLS authenticated-only + deny-all anon przez brak polityki; Realtime publication idempotentnie). `verify_rls.sql` + `scripts/verify-rls.mjs` jako gotowy twardy dowód deny-all dla operatora.
- Decyzja: polityki `using(true)`/`with check(true)` — model wspólnego konta (brak per-user ownership). Indeks częściowy `where archived_at is null`.
- **Weryfikacja statyczna:** brak Docker/CLI/psql w środowisku → realna aplikacja migracji + dowód RLS to kroki operatora (skrypty gotowe, nie TODO). **Odchylenia od planu: Brak.**

**U3 — Bramka dostępu (feature-builder-fullstack):** `AuthProvider` (getSession + onAuthStateChange + cleanup) + `auth-context.ts` (typowany context + `useAuth`), `ProtectedRoute` (guard), `LoginPage` (signInWithPassword, inline error PL, spinner, `useActionState`), `Header` (logo Fraunces + wyloguj). `App.tsx`: trasy chronione, `/login` publiczny. Testy: 22/22 (14 z U1 + 8 nowych). typecheck/lint/build czyste.
- **Odchylenie:** dodano `auth-context.ts` (rozdzielenie hooka od komponentu — wymóg `react-refresh/only-export-components`). Zmodyfikowano `ListaPage.tsx` (montaż `Header` by logout był osiągalny) — minimalne, Header trzyma scope (logo + logout, bez CTA „+ Nowy projekt" → U5). Bez zmiany scope feature.

**Operator TODO przed E2E/deployem (blokujące weryfikację wizualną w /dev-docs-review):**
1. Załóż projekt Supabase, uzupełnij `.env` (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
2. Zaaplikuj migracje 0001→0002→0003 (SQL Editor lub `supabase db push`); zweryfikuj `verify_rls.sql`; potwierdź Realtime dla `projekty`.
3. Uruchom `node --env-file=.env scripts/verify-rls.mjs` — sukces = exit 0 / „anon SELECT zwrócił 0 wierszy".
4. Załóż wspólne konto zespołu (email+hasło) w Supabase Auth, przekaż 4 osobom.

## Źródła
- Specyfikacja funkcjonalna: `SPEC_projekty.md` (v5, root)
- Specyfikacja wizualna: `DESIGN.md` (v5, root)
- Plan: `docs/active/zarzadzanie-projektami/zarzadzanie-projektami-plan.md`
- Zadania: `docs/active/zarzadzanie-projektami/zarzadzanie-projektami-zadania.md`
