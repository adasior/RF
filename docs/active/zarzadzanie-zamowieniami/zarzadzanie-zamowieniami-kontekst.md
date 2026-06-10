# Kontekst: System zarządzania zamówieniami — MVP

**Branch:** `feature/zarzadzanie-zamowieniami`
**Ostatnia aktualizacja:** 2026-06-10

## Designerski kontekst

- **DESIGN.md (projekt-wide):** `./DESIGN.md`
- **SPEC.md (per-feature, pomiary z Figmy):** `null`
- **Screeny referencyjne:** brak (figma_screens puste)

> Te pliki są MANDATORY context dla subagentów buildujących UI. `dev-docs-execute`
> wstrzykuje je do promptu Agent tool. `DESIGN.md` (v2.0, zatwierdzona) jest źródłem
> prawdy o wyświetlaniu — każdy komponent UI lustruje pomiary 1:1.

## Powiązane pliki

### Dokumentacja źródłowa (read-only referencje)
- `DESIGN.md` (root) — paleta terakota `#B5542D`, tła `#FCFBF9`, fonty Inter + Fraunces (italic dla logo i numerów ZAM-XXX), tokeny spacing/radius, layouty header / lista / karta / formularz / szczegóły / toast / mobile / empty states / animacje / ikony (Lucide).
- `SPEC_zamowienia.md` (root) — schemat SQL (tabela `zamowienia`, trigger `updated_at`), 6 statusów (`nowe`/`zaakceptowane`/`u_grafika`/`na_krojowni`/`gotowe`/`wyslane`) z kolorami, lista osób, kształt widoków, kolejność implementacji. **Stack ze SPEC (Next.js/Vercel/API Routes) jest NIEAKTUALNY** — zastąpiony przez D6.

### Repo
- **Greenfield** — repo zawiera tylko `docs/`, `DESIGN.md`, `SPEC_zamowienia.md`, `.claude/`. Brak `package.json`, `src/`, `supabase/`. Pierwszy unit (U1) to scaffolding.
- `docs/solutions/` — pusty (brak wniosków do reużycia).

### Pliki do stworzenia (kluczowe, per faza)
- **Fundament:** `src/lib/{supabase,config,types,format,schemas,queryKeys}.ts`, `src/index.css` (`@theme`), `supabase/migrations/000{1,2,3}_*.sql`, `src/components/{AuthProvider,ProtectedRoute,Header}.tsx`
- **Dane + UI:** `src/hooks/use{Zamowienia,Zamowienie}Data.ts`, `src/hooks/useZamowienieMutations.ts`, `src/features/zamowienia/components/{ZamowienieKarta,StatusBadge,StatusPicker,ListaWidok,EmptyState,ZamowienieForm,OsobaSegmented,SzczegolyWidok,Filtry,UsunDialog,HardDeleteDialog,KanbanWidok,WidokToggle,Fab}.tsx`
- **Hooki feature:** `src/features/zamowienia/hooks/{useFiltry,useWidokPreferencja,useRealtimeZamowienia}.ts`

## Decyzje techniczne (skrót — pełne w planie technicznym)

| # | Decyzja | Uzasadnienie |
|---|---------|--------------|
| Tokeny | `@theme {}` w `src/index.css`, nie `tailwind.config.js` | Tailwind v4 CSS-first; jedno źródło prawdy |
| ZAM-XXX | Format po stronie klienta (`format.ts`) | RLS na widokach SQL komplikuje politykę |
| D1 | Supabase Auth (wspólne konto) + RLS `authenticated`-only | anon key w bundlu Vite → frontowa bramka to iluzja |
| D2 | Soft delete `archived_at`; hard delete tylko z archiwum | 4 osoby + optimistic → ryzyko pomyłki |
| D3 | `osoba` edytowalne | spójność z D2/D4; samodeklaracja bez auth |
| D4 | Dowolne przejścia statusów | elastyczność > ochrona przed błędem |
| D5 | Kanban desktop-only, bez drag-and-drop | drag duplikuje picker, dokłada bundle + dług a11y |
| D6 | Vite SPA + React 19 (nie Next.js) | narzędzie wewnętrzne; tooling repo pod Vite |
| Data | React Query + Zod na granicy + RHF | zgodność z `tailwind-react-guidelines`; cache do reconciliacji Realtime |
| Router | React Router v7 | SPA bez SSR |

## Zależności

### Zewnętrzne (npm)
tailwindcss v4 (+`@tailwindcss/vite`), shadcn/ui, react-router-dom, @tanstack/react-query,
react-hook-form, zod, @hookform/resolvers, sonner, lucide-react, @supabase/supabase-js,
vitest, @testing-library/react, msw.

### Operatorskie (poza kodem — blokujące E2E/deploy)
- Projekt Supabase + `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` w `.env` (U1).
- Aplikacja migracji w Supabase + włączenie Realtime dla `zamowienia` (U2).
- Wspólne konto zespołu (email+hasło) w Supabase Auth (U3).
- Finalne wartości `OSOBY` / `STATUSY` w `config.ts` przed deployem.

### Wewnętrzne (graf zależności Units)
U1 → U2 → U3 → U4 → {U5, U6} → {U7, U8} → U9; U5/U8 → U10; U4/U2/U5/U10 → U11; U5/U6/U8/U10 → U12.

## Odroczone do implementacji (z planu technicznego)
- Dokładny algorytm dedup optimistic ↔ echo Realtime (U11) — start od `updated_at` + pending mutation IDs.
- Nazwy helperów hooków/mutacji i kształt kluczy React Query.
- Copy 3-stopniowego dialogu hard delete; domyślnie 3 kliknięcia bez wpisywania tekstu (U9).
- Finalne `OSOBY`/`STATUSY` (operator).
- Sentry — poza scope MVP.

## Źródła
- Requirements doc: docs/dev-brainstorms/2026-06-09-zarzadzanie-zamowieniami-requirements.md
- Plan techniczny: docs/plans/2026-06-10-001-feat-zarzadzanie-zamowieniami-plan.md
