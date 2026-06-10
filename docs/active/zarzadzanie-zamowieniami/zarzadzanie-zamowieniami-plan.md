# Plan: System zarządzania zamówieniami (firma odzieżowa) — MVP

**Branch:** `feature/zarzadzanie-zamowieniami`
**Ostatnia aktualizacja:** 2026-06-10

## Cele i zakres

Wewnętrzne narzędzie dla 4-osobowego biura firmy odzieżowej: wspólna baza zamówień
dostępna z desktopa i mobile, z szybkim dodawaniem (< ~30 s), czytelną listą, inline
zmianą statusu (jeden klik), dwoma widokami (lista + kanban), filtrami, archiwizacją
(soft delete) z bezpiecznym twardym delete, bramką dostępu (Supabase Auth + RLS) oraz
synchronizacją na żywo (Supabase Realtime).

**Stack (D6):** Vite SPA + React 19 + TypeScript + TailwindCSS v4 + shadcn/ui + Supabase.
CRUD idzie bezpośrednio front→Supabase pod RLS — bez Edge Functions w MVP (D1).

**Skala:** ~50–150 zamówień/mies. `klient_nazwa` + `klient_kontakt` = dane osobowe (RODO),
więc aplikacja nie może być publiczna.

### Poza zakresem (granice scope'u)

- Brak per-user auth — jedna wspólna bramka; tożsamość samodeklarowana w polu `osoba`.
- Brak historii zmian statusów, rozwiązywania konfliktów (last-write-wins), załączników,
  powiadomień, eksportu PDF, wymuszonego przepływu statusów.
- Brak drag-and-drop w kanbanie (D5) — status wyłącznie przez `StatusPicker`.
- Brak Edge Functions (D1).

## Kluczowe decyzje techniczne

- Tokeny designu w `@theme {}` (Tailwind v4 CSS-first), nie `tailwind.config.js` — port 1:1 z `DESIGN.md`.
- Format `ZAM-XXX` po stronie klienta (`src/lib/format.ts`), bez widoku SQL `zamowienia_view`.
- Bramka = Supabase Auth (jedno wspólne konto) + RLS `authenticated`-only (deny-all dla `anon`).
- Soft delete = `archived_at TIMESTAMPTZ NULL`; hard delete = realny `DELETE` tylko z widoku archiwum.
- Data layer = React Query (TanStack) + zapytania Supabase w `src/hooks/*Data.ts`; walidacja Zod na granicy; RHF + Zod w formularzach.
- Routing = React Router v7: `/login`, `/`, `/nowe`, `/zamowienie/:id`, `*`/404.
- Toasty = Sonner; ikony = Lucide React.
- Realtime: subskrypcja `postgres_changes` patchuje cache React Query; dedup własnego echa optimistic (algorytm dostrajany w U11).
- Package manager = npm.

## Fazy i zadania (Implementation Units)

Szczegółowe pliki, podejście, scenariusze testowe i weryfikacja — w technicznym planie
źródłowym (zob. Źródła) oraz jako checkboxy w `zarzadzanie-zamowieniami-zadania.md`.

### Faza 1 — Fundament
- **Unit 1** — Scaffolding projektu + design system + config + routing shell. *(brak zależności)*
- **Unit 2** — Schemat bazy + migracja + RLS. *(zal. U1)*
- **Unit 3** — Bramka dostępu (Supabase Auth + chronione trasy). *(zal. U1, U2)*

### Faza 2 — Warstwa danych + lista + formularz
- **Unit 4** — Warstwa dostępu do danych: schematy Zod + hooki React Query. *(zal. U1, U2, U3)*
- **Unit 5** — Lista zamówień: karty, StatusBadge, inline StatusPicker, overdue, empty state. *(zal. U4, U3)*
- **Unit 6** — Formularz nowego zamówienia. *(zal. U4, U1)*

### Faza 3 — Szczegóły, filtry, archiwum
- **Unit 7** — Szczegóły + edycja + strona 404 zamówienia. *(zal. U4, U5, U6)*
- **Unit 8** — Filtry listy (status, osoba, szukaj, wymiar archiwizacji). *(zal. U4, U5)*
- **Unit 9** — Soft delete + przywracanie + twardy delete 3-stopniowy. *(zal. U4, U8, U5/U7)*

### Faza 4 — Kanban, Realtime, Mobile
- **Unit 10** — Widok kanban + przełącznik widoku (localStorage). *(zal. U5, U8, U1)*
- **Unit 11** — Synchronizacja na żywo (Supabase Realtime) + dedup optimistic. *(zal. U4, U2, U5/U10)*
- **Unit 12** — Responsywność mobile + polish empty states. *(zal. U5, U6, U8, U10)*

## Kryteria akceptacji (poziom feature)

- Dodanie zamówienia < ~30 s (jeden ekran, minimum pól wymaganych).
- Zmiana statusu z listy = jedno kliknięcie + wybór, natychmiastowy efekt wizualny (optimistic) + toast.
- Cały zespół widzi zmiany na żywo (Realtime) bez ręcznego odświeżania.
- Zero przypadkowej bezpowrotnej utraty — „Usuń" zawsze archiwizuje; hard delete wymaga wejścia do archiwum + potwierdzenia.
- Aplikacja niedostępna bez zalogowania; anon key nie odsłania danych (RLS deny-all dla `anon` — dowód skryptem).
- `npm run typecheck` / `npm run lint` / `npm run test` zielone; `npm run build` przechodzi.

## Ryzyka i mitygacje

- **Reconciliacja optimistic ↔ Realtime (U11)** — najtrudniejsze; ryzyko migotania UI. Mitygacja: zacząć od integration testu z echem własnej zmiany; dedup po `updated_at`/pending IDs.
- **RLS musi realnie blokować anon (U2/D1)** — RODO. Mitygacja: twardy skrypt z anon key, nie sama obecność polityki.
- **Tailwind v4 CSS-first** — ryzyko rozjazdu tokenów (config v3 w `DESIGN.md` → `@theme`). Mitygacja: tokeny 1:1, statusy jako mapa.
- **Rozjazd R1 vs DESIGN.md (osoba na karcie)** — przyjęto `DESIGN.md` (osoba tylko w szczegółach + filtr); udokumentowane w U5.
- **Konto wspólne Supabase + wartości config (OSOBY/STATUSY)** — kroki operatora; gotowe przed deployem/E2E.

## Szacunki nakładu

| Unit | Nakład | Unit | Nakład |
|------|--------|------|--------|
| U1 | L | U7 | M |
| U2 | S | U8 | M |
| U3 | M | U9 | M |
| U4 | L | U10 | M |
| U5 | L | U11 | L |
| U6 | M | U12 | M |

## Źródła
- Requirements doc: docs/dev-brainstorms/2026-06-09-zarzadzanie-zamowieniami-requirements.md
- Plan techniczny: docs/plans/2026-06-10-001-feat-zarzadzanie-zamowieniami-plan.md
