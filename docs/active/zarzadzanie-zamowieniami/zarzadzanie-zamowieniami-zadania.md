# Zadania: System zarządzania zamówieniami — MVP

**Branch:** `feature/zarzadzanie-zamowieniami`
**Ostatnia aktualizacja:** 2026-06-10

Legenda: `Test:` = scenariusz testowy (z planu technicznego), `Weryfikacja:` = kryterium
weryfikacji, `Operator:` = krok poza kodem (człowiek).

---

## Faza 1 — Fundament

### Unit 1: Scaffolding projektu + design system + config + routing shell
**Delegate to:** feature-builder-fullstack · **Nakład:** L · **Zależności:** brak

Implementacja:
- [ ] `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.env.example`, `eslint.config.js`
- [ ] `src/main.tsx`, `src/App.tsx` (routing 4 trasy + 404, QueryClientProvider, Toaster)
- [ ] `src/index.css` (`@theme` z tokenami `DESIGN.md` 1:1: paleta, statusy, fonty, radius, spacing)
- [ ] `src/lib/supabase.ts` (klient z env)
- [ ] `src/lib/config.ts` (OSOBY, STATUSY z value/label/order/kolory)
- [ ] `src/lib/types.ts`, `src/lib/format.ts` (`formatNumer`, `formatTermin`, `formatRelativeData`)
- [ ] Placeholder strony: `ListaPage`, `NoweZamowieniePage`, `ZamowienieSzczegolyPage`, `LoginPage`, `NotFoundPage`
- [ ] Fonty Google Fonts `<link>` w `index.html` (Inter 400/500/600 + Fraunces italic)
- [ ] `.gitignore` (`.env`, `node_modules`, `dist`)
- [ ] `CLAUDE.md` (komenda dev, stack, zasady: UI po polsku, config.ts, optimistic UI, błędy toastem)
- [ ] Test (unit): `src/lib/format.test.ts`, `src/lib/config.test.ts` (test-first)

Scenariusze testowe:
- [ ] Test: `formatNumer(18)`→`"ZAM-018"`, `formatNumer(7)`→`"ZAM-007"`, `formatNumer(1234)`→`"ZAM-1234"` (bez ucinania)
- [ ] Test: `config.STATUSY` zawiera 6 statusów w kolejności ze `SPEC`; każdy ma unikalny `value`/`label`/`order`
- [ ] Test: `formatTermin`/`formatRelativeData` zwracają polski format; edge: dziś, wczoraj, brak terminu (null)
- [ ] Test: [E2E] `/` renderuje shell bez błędów konsoli; `/nowe` i trasa nieistniejąca → placeholder/404

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` bez błędów
- [ ] Weryfikacja: `npm run build` kończy się sukcesem
- [ ] Weryfikacja: `npm run test` — testy `format`/`config` zielone
- [ ] Weryfikacja: `npm run lint` bez błędów
- [ ] Weryfikacja: [E2E] `/` ładuje się bez błędów konsoli (agent-browser snapshot)

Operator:
- [ ] Operator zakłada projekt Supabase i wkleja `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` do `.env`

---

### Unit 2: Schemat bazy + migracja + RLS
**Delegate to:** feature-builder-data · **Nakład:** S · **Zależności:** U1

Implementacja:
- [ ] `supabase/migrations/0001_init_zamowienia.sql` (tabela + `archived_at` + trigger `update_updated_at`)
- [ ] `supabase/migrations/0002_rls_policies.sql` (enable RLS + 4 polityki `authenticated`)
- [ ] `supabase/migrations/0003_realtime.sql` (`alter publication supabase_realtime add table zamowienia`)
- [ ] Indeks `(created_at desc)`; opcjonalnie częściowy `where archived_at is null`

Scenariusze testowe:
- [ ] Test: [Manual] Migracje aplikują się czysto na świeżym projekcie Supabase
- [ ] Test: [skrypt] SELECT z anon key (bez sesji) → 0 wierszy / błąd RLS
- [ ] Test: [skrypt] SELECT z zalogowaną sesją → zwraca wiersze

Weryfikacja:
- [ ] Weryfikacja: anon-key SELECT zwraca pustą tablicę lub błąd uprawnień (deny-all dla `anon`)
- [ ] Weryfikacja: authenticated SELECT/INSERT/UPDATE/DELETE bez błędu RLS
- [ ] Weryfikacja: `archived_at` istnieje w schemacie (`information_schema.columns`)

Operator:
- [ ] Operator aplikuje migracje w Supabase (SQL Editor lub `supabase db push`)
- [ ] Operator weryfikuje w dashboardzie, że Realtime jest włączony dla `zamowienia`

---

### Unit 3: Bramka dostępu — Supabase Auth + chronione trasy
**Delegate to:** feature-builder-fullstack · **Nakład:** M · **Zależności:** U1, U2

Implementacja:
- [ ] `src/components/AuthProvider.tsx` (context sesji: `getSession` + `onAuthStateChange`, cleanup)
- [ ] `src/components/ProtectedRoute.tsx` (brak sesji → `/login`; loading → krótki stan)
- [ ] Modyfikuj `LoginPage.tsx` (formularz `signInWithPassword`, inline error PL, spinner)
- [ ] Modyfikuj `App.tsx` (owinięcie tras `ProtectedRoute` + `AuthProvider`)
- [ ] Modyfikuj/utwórz `Header.tsx` (hook wylogowania)
- [ ] Test (unit): `AuthProvider.test.tsx` (mock TYLKO Supabase auth), test guardu (test-first)

Scenariusze testowe:
- [ ] Test: `ProtectedRoute` bez sesji renderuje redirect; z sesją renderuje children
- [ ] Test: `LoginPage` przy odrzuceniu z auth pokazuje inline error PL (mock zwraca error)
- [ ] Test: [E2E] `/` bez sesji → `/login`; poprawne logowanie → `/`; błędne → inline error; wyloguj → `/login`

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (w tym test guardu)
- [ ] Weryfikacja: [E2E] niezalogowany dostęp do `/` przekierowuje na `/login`
- [ ] Weryfikacja: [E2E] po zalogowaniu `/` osiągalne; po wylogowaniu znów `/login`

Operator:
- [ ] Operator zakłada wspólne konto zespołu (email+hasło) w Supabase Auth i przekazuje dane 4 osobom

---

## Faza 2 — Warstwa danych + lista + formularz

### Unit 4: Warstwa dostępu do danych — schematy Zod + hooki React Query
**Delegate to:** feature-builder-data · **Nakład:** L · **Zależności:** U1, U2, U3

Implementacja:
- [ ] `src/lib/schemas.ts` (Zod: `zamowienieSchema`, `noweZamowienieInput`, `edycjaZamowieniaInput`)
- [ ] Rozszerz `src/lib/types.ts` (typy z `z.infer`, zero `any`)
- [ ] `src/hooks/useZamowieniaData.ts` (lista z filtrami, `created_at desc`, `archived_at is null` domyślnie)
- [ ] `src/hooks/useZamowienieData.ts` (pojedyncze)
- [ ] `src/hooks/useZamowienieMutations.ts` (create/update/archive/restore/hardDelete, `onError` → toast + re-throw)
- [ ] `src/lib/queryKeys.ts`
- [ ] Test (unit, test-first wertykalnie): `schemas.test.ts`, `useZamowieniaData.test.ts`, `useZamowienieMutations.test.ts` (MSW mockuje TYLKO Supabase REST)

Scenariusze testowe:
- [ ] Test: `useZamowieniaData` bez filtrów → wiersze `created_at desc`, tylko `archived_at is null`
- [ ] Test: filtry status+osoba+szukaj łączą się AND (asercja na parametrach zapytania)
- [ ] Test: filtr „tylko zarchiwizowane" → wyłącznie `archived_at is not null`
- [ ] Test: `create` waliduje Zod — brak `klient_nazwa`/`opis`/`osoba` → błąd przed wysłaniem
- [ ] Test: mutacja przy błędzie sieci → toast błędu + propagacja (nie połyka)
- [ ] Test: `archive`/`restore`/`hardDelete` wołają update(archived_at)/update(null)/delete

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` bez błędów, zero `any`
- [ ] Weryfikacja: `npm run test` — schematy i hooki zielone
- [ ] Weryfikacja: `npm run lint` bez błędów
- [ ] Weryfikacja: brak pustych `catch {}` w nowych plikach

---

### Unit 5: Lista zamówień — karty, StatusBadge, inline StatusPicker, overdue, empty state
**Delegate to:** feature-builder-ui · **Nakład:** L · **Zależności:** U4, U3

Implementacja:
- [ ] `src/components/Header.tsx` (CTA)
- [ ] `src/features/zamowienia/components/ZamowienieKarta.tsx` (grid `60px 1fr auto`, numer Fraunces italic, overdue = lewy akcent `--color-danger`)
- [ ] `StatusBadge.tsx`, `StatusPicker.tsx` (reużywalny — test-first), `ListaWidok.tsx`, `EmptyState.tsx`
- [ ] Modyfikuj `ListaPage.tsx` (kompozycja header + lista)
- [ ] Test (unit): `ZamowienieKarta.test.tsx`, `StatusPicker.test.tsx`, `StatusBadge.test.tsx`

Scenariusze testowe:
- [ ] Test: karta `termin < dziś` + `na_krojowni` → overdue; `termin < dziś` + `wyslane` → NIE
- [ ] Test: `StatusBadge` mapuje każdy status na kolory z configu/`DESIGN.md`
- [ ] Test: `StatusPicker` po wyborze wywołuje mutację z nowym statusem + optymistycznie pokazuje label; błąd → powrót + toast
- [ ] Test: klik poza otwartym pickerem zamyka go bez mutacji
- [ ] Test: [E2E] `/` karty najnowsze-pierwsze; zmiana statusu z karty natychmiastowa + toast; klik karty → szczegóły; pusta baza → empty state z CTA

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E] optimistic zmiana statusu widoczna natychmiast + toast (snapshot przed/po)
- [ ] Weryfikacja: [E2E] przeterminowana karta ma czerwony lewy akcent (screenshot)
- [ ] Weryfikacja: [E2E] empty state widoczny przy braku danych

---

### Unit 6: Formularz nowego zamówienia
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U1

Implementacja:
- [ ] `src/features/zamowienia/components/ZamowienieForm.tsx` (parametryzowany `create`|`edit` — reuse w U7)
- [ ] `src/features/zamowienia/components/OsobaSegmented.tsx` (radiogroup, WCAG 2.2)
- [ ] Modyfikuj `NoweZamowieniePage.tsx`
- [ ] RHF + `zodResolver(noweZamowienieInput)`, komunikaty PL; po sukcesie invalidate + redirect `/` + toast „Zamówienie ZAM-XXX dodane"
- [ ] Test (unit, test-first walidacja): `ZamowienieForm.test.tsx`, `OsobaSegmented.test.tsx`

Scenariusze testowe:
- [ ] Test: submit bez wymaganych pól → błędy PL pod klient/opis/osoba; create NIE wywołane
- [ ] Test: poprawny submit → create z danymi formularza; po sukcesie nawigacja `/`
- [ ] Test: `OsobaSegmented` zaznacza wybraną osobę, obsługiwalny klawiaturą (radiogroup)
- [ ] Test: [E2E] happy path: wypełnij → Zapisz → redirect + toast + karta na liście
- [ ] Test: [E2E] pusty submit → inline błędy PL

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E] dodanie zamówienia → redirect `/` + toast + nowa karta
- [ ] Weryfikacja: [E2E] walidacja blokuje pusty submit z komunikatami PL

---

## Faza 3 — Szczegóły, filtry, archiwum

### Unit 7: Szczegóły + edycja + strona 404 zamówienia
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U5, U6

Implementacja:
- [ ] Modyfikuj `ZamowienieSzczegolyPage.tsx`, `NotFoundPage.tsx`
- [ ] `src/features/zamowienia/components/SzczegolyWidok.tsx` (read-only sekcje per `DESIGN.md`)
- [ ] Sekcja statusu używa `StatusPicker` (U5); tryb edycji = `ZamowienieForm` mode `edit` (wszystkie pola, w tym `osoba` — D3)
- [ ] 404: get → brak rekordu → `NotFoundPage` + link do `/`
- [ ] Przycisk „Usuń" (placeholder/archive — pełny dialog w U9)
- [ ] Test (unit, test-first 404 + edycja `osoba`): `SzczegolyWidok.test.tsx`, `ZamowienieSzczegolyPage.test.tsx`

Scenariusze testowe:
- [ ] Test: read-only renderuje wszystkie pola w układzie `DESIGN.md`
- [ ] Test: Edytuj → zmiana `osoba` + zapis → update z nową osobą (D3)
- [ ] Test: Anuluj w edycji nie wywołuje update, przywraca read-only
- [ ] Test: get zwraca brak → render strony 404 z linkiem do `/`
- [ ] Test: [E2E] pełna ścieżka edycji + toast; nieistniejące id → 404 + link działa

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E] edycja pól (w tym osoba) zapisuje się i widoczna po reloadzie
- [ ] Weryfikacja: [E2E] `/zamowienie/nieistniejace` → „Nie znaleziono zamówienia"

---

### Unit 8: Filtry listy (status, osoba, szukaj, wymiar archiwizacji)
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U5

Implementacja:
- [ ] `src/features/zamowienia/components/Filtry.tsx` (linki podkreślone per `DESIGN.md`, wyszukiwarka po prawej)
- [ ] `src/features/zamowienia/hooks/useFiltry.ts` (`{status, osoba, szukaj, archiwum}`, debounce szukaj)
- [ ] Modyfikuj `ListaPage.tsx` (podpięcie filtrów do `useZamowieniaData`)
- [ ] Modyfikuj `EmptyState.tsx` (wariant „brak wyników" + „Wyczyść filtry")
- [ ] Test (unit, test-first AND + parsowanie ZAM-XXX): `Filtry.test.tsx`, `useFiltry.test.ts`

Scenariusze testowe:
- [ ] Test: `useFiltry` łączy status+osoba+szukaj jako AND (asercja na obiekcie filtrów)
- [ ] Test: szukaj „ZAM-003" → `numer = 3`; „Studio" → `klient_nazwa ilike`
- [ ] Test: wymiar archiwum przełącza `archived_at is null` ↔ `is not null`
- [ ] Test: „Wyczyść filtry" resetuje do domyślnego (aktywne, bez status/osoba/szukaj)
- [ ] Test: [E2E] kombinacja filtrów zawęża (AND); brak wyników → empty „brak wyników"; reset działa

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E] filtry AND zawężają; „tylko zarchiwizowane" pokazuje archiwa; empty + reset

---

### Unit 9: Soft delete + przywracanie + twardy delete 3-stopniowy
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U8, U5/U7

Implementacja:
- [ ] `src/features/zamowienia/components/UsunDialog.tsx` (potwierdzenie archiwizacji)
- [ ] `HardDeleteDialog.tsx` (danger, „Operacja nieodwracalna")
- [ ] Modyfikuj `ZamowienieKarta.tsx` (akcje zależne od kontekstu: aktywne → „Usuń"; archiwum → „Przywróć" + „Usuń trwale")
- [ ] Modyfikuj `SzczegolyWidok.tsx` (przycisk Usuń → UsunDialog)
- [ ] Test (unit, test-first niedostępność hard delete z aktywnej): `UsunDialog.test.tsx`, `HardDeleteDialog.test.tsx`, `ZamowienieKarta.test.tsx`

Scenariusze testowe:
- [ ] Test: karta aktywna renderuje „Usuń" (archive), NIE renderuje „Usuń trwale"
- [ ] Test: karta archiwum renderuje „Przywróć" + „Usuń trwale"
- [ ] Test: `UsunDialog` potwierdzenie → archive; anulowanie → brak akcji
- [ ] Test: `HardDeleteDialog` potwierdzenie → hardDelete; anulowanie → brak akcji
- [ ] Test: [E2E] archiwizacja → archiwum → przywróć; 3-stopniowy hard delete; hard delete nieosiągalny z aktywnej listy

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (w tym test niedostępności hard delete z aktywnej)
- [ ] Weryfikacja: [E2E] archiwizacja usuwa z aktywnej i pozwala przywrócić; hard delete tylko w archiwum, kasuje bezpowrotnie

---

## Faza 4 — Kanban, Realtime, Mobile

### Unit 10: Widok kanban + przełącznik widoku (localStorage)
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U5, U8, U1

Implementacja:
- [ ] `src/features/zamowienia/components/KanbanWidok.tsx` (kolumny z `config.STATUSY` w kolejności `order`, reuse `ZamowienieKarta` + `StatusPicker`)
- [ ] `WidokToggle.tsx` (widoczny tylko ≥768px)
- [ ] `src/features/zamowienia/hooks/useWidokPreferencja.ts` (localStorage, domyślnie `'lista'`)
- [ ] Modyfikuj `ListaPage.tsx` (render lista|kanban), `Header.tsx` (toggle)
- [ ] Filtry współdzielone (ten sam `useFiltry`); klik karty → szczegóły
- [ ] Test (unit, test-first regrupowanie): `KanbanWidok.test.tsx`, `WidokToggle.test.tsx`, `useWidokPreferencja.test.ts`

Scenariusze testowe:
- [ ] Test: kanban renderuje kolumny w kolejności `config.STATUSY` i przypisuje karty po statusie
- [ ] Test: zmiana statusu karty przenosi ją do kolumny docelowej
- [ ] Test: `useWidokPreferencja` zapisuje/odczytuje wybór z localStorage; domyślnie lista
- [ ] Test: [E2E] toggle kanban; zmiana statusu przez picker przenosi kartę między kolumnami + toast; preferencja przetrwa reload; filtry zawężają kanban

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E] kanban z kolumnami; zmiana statusu przenosi kartę; widok zapamiętany po reloadzie

---

### Unit 11: Synchronizacja na żywo (Supabase Realtime) + dedup optimistic
**Delegate to:** feature-builder-data · **Nakład:** L · **Zależności:** U4, U2, U5/U10

Implementacja:
- [ ] `src/features/zamowienia/hooks/useRealtimeZamowienia.ts` (`channel('zamowienia').on('postgres_changes', {event:'*'})`, patch/invalidate cache, cleanup `removeChannel`)
- [ ] Modyfikuj `ListaPage.tsx` (montaż subskrypcji)
- [ ] Modyfikuj `useZamowienieMutations.ts` (tracking pending dla dedup, jeśli potrzebne)
- [ ] Dedup: porównanie `updated_at` + lista pending mutation IDs (algorytm dostrajany przy wykonaniu)
- [ ] Test (unit, start od failing integration testu dedup): `useRealtimeZamowienia.test.ts` (mock kanału Supabase)

Scenariusze testowe:
- [ ] Test: event obcego update patchuje cache (nowa wartość widoczna)
- [ ] Test: event będący echem własnej optimistic mutacji NIE powoduje podwójnej aktualizacji/migotania
- [ ] Test: event delete usuwa rekord z cache; insert dodaje
- [ ] Test: subskrypcja sprzątana przy odmontowaniu (`removeChannel` wywołany)
- [ ] Test: [E2E] dwa okna: zmiana/insert/archive w jednym propaguje do drugiego bez reloadu

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (w tym test dedup)
- [ ] Weryfikacja: [E2E] zmiana w jednym oknie widoczna w drugim bez ręcznego odświeżania (dwie sesje)

Operator:
- [ ] Operator potwierdza w dashboardzie Supabase, że Realtime aktywny dla `zamowienia` (jeśli nie w U2)

---

### Unit 12: Responsywność mobile + polish empty states
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U5, U6, U8, U10

Implementacja:
- [ ] `src/components/Fab.tsx` (terakota, okrągły, `fixed bottom-right`, `Plus` size 22)
- [ ] Modyfikuj `Header.tsx` (CTA↔FAB wg breakpointu, ukrycie toggle <768px, wymuszona lista)
- [ ] Modyfikuj `ZamowienieKarta.tsx` (mobile: numer+status w wiersz, `grid 1fr`, większy padding)
- [ ] Modyfikuj `Filtry.tsx` (`overflow-x: auto`), `ZamowienieForm.tsx` (siatka 2→1 kolumna)
- [ ] Przegląd animacji (max 180ms, tylko funkcjonalne) + `prefers-reduced-motion`
- [ ] Test (unit): `Fab.test.tsx`, `Header.test.tsx` (warunek breakpointu przez util/prop)

Scenariusze testowe:
- [ ] Test: `Header` z flagą mobile renderuje FAB, nie renderuje CTA/toggle; desktop odwrotnie
- [ ] Test: FAB nawiguje do `/nowe`
- [ ] Test: [E2E] viewport 375px: FAB widoczny, toggle ukryty, wymuszona lista, karty pełna szerokość, filtry scroll poziomy, formularz 1-kolumnowy
- [ ] Test: [E2E] viewport 1280px: CTA + toggle widoczne, kanban dostępny

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E 375px] FAB obecny, toggle/kanban niedostępne, layout jednokolumnowy (screenshot)
- [ ] Weryfikacja: [E2E 1280px] CTA + toggle obecne

Operator:
- [ ] QA weryfikuje dotyk/scroll i FAB na realnym urządzeniu mobilnym (iOS + Android)
