# Zadania: System zarządzania projektami odzieżowymi — MVP

**Branch:** `feature/zarzadzanie-zamowieniami` (nazwa zachowana dla ciągłości git)
**Ostatnia aktualizacja:** 2026-06-12 (Faza 3 ukończona — U7/U8/U9)

Legenda: `Test:` = scenariusz testowy, `Weryfikacja:` = kryterium weryfikacji,
`Operator:` = krok poza kodem (człowiek).

> Model: 4 niezależne flagi boolean (`rozpisane` / `przeslany` / `sprawdzony` / `wydrukowany`).
> Toggle desktop natychmiastowy; mobile = `ConfirmSheet`. Źródło prawdy: `SPEC_projekty.md` v5 + `DESIGN.md` v5.

---

## Faza 1 — Fundament

### Unit 1: Scaffolding projektu + design system + config + routing shell
**Delegate to:** feature-builder-fullstack · **Nakład:** L · **Zależności:** brak

Implementacja:
- [x] `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.env.example`, `eslint.config.js`
- [x] `src/main.tsx`, `src/App.tsx` (routing: `/login`, `/`, `/nowy`, `/projekt/:id`, `*`/404, QueryClientProvider, Toaster)
- [x] `src/index.css` (`@theme` z tokenami `DESIGN.md` v5 1:1: paleta terakota/tła/tekst/flagi, fonty Inter+Fraunces, radius, spacing)
- [x] `src/lib/supabase.ts` (klient z env)
- [x] `src/lib/config.ts` (`OSOBY`, `KATEGORIE` z „Inne…", `FLAGI` z `key`/`label`/`filterLabel`/opcjonalnym `columnLabel`)
- [x] `src/lib/types.ts`, `src/lib/format.ts` (`formatRelativeData`, `formatDataPelna`)
- [x] Placeholder stron: `ListaPage`, `NowyProjektPage`, `ProjektSzczegolyPage`, `LoginPage`, `NotFoundPage`
- [x] Fonty Google Fonts `<link>` w `index.html` (Inter 400/500/600/700 + Fraunces italic 600)
- [x] `.gitignore` (`.env`, `node_modules`, `dist`)
- [x] `CLAUDE.md` (komenda dev, stack, zasady: UI po polsku, `config.ts`, optimistic UI, błędy toastem, desktop immediate / mobile bottom sheet)
- [x] Test (unit, test-first): `src/lib/format.test.ts`, `src/lib/config.test.ts`
- ⚠ shadcn/ui pominięty w IU-1 (plan dopuszczał); init w pierwszym IU UI, które tego wymaga (U5/U7).

Scenariusze testowe:
- [x] Test: `config.FLAGI` ma 4 flagi w kolejności ze SPEC; każda z unikalnym `key`/`label`/`filterLabel`; druga (`przeslany`) ma `columnLabel`
- [x] Test: `config.KATEGORIE` zawiera listę ze SPEC z „Inne…" jako ostatnią pozycją; `config.OSOBY` ma 4 imiona
- [x] Test: `formatRelativeData` — `<24h`→„dzisiaj", `24–48h`→„wczoraj", `<14 dni`→„X dni temu", `≥14 dni`→„DD MMM"
- [x] Test: `formatDataPelna` → format „15 cze 2025, 14:32" (PL)
- [ ] Test: [E2E] `/` renderuje shell bez błędów konsoli; `/nowy` i trasa nieistniejąca → placeholder/404 (weryfikacja wizualna w /dev-docs-review)

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` bez błędów
- [x] Weryfikacja: `npm run build` kończy się sukcesem
- [x] Weryfikacja: `npm run test` — testy `format`/`config` zielone (14/14)
- [x] Weryfikacja: `npm run lint` bez błędów
- [ ] Weryfikacja: [E2E] `/` ładuje się bez błędów konsoli (agent-browser snapshot) (SKIP — Agent 5 niedostępny: brak dev env z Supabase)

Operator:
- [ ] Operator zakłada projekt Supabase i wkleja `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` do `.env`

---

### Unit 2: Schemat bazy + migracja + RLS + Realtime
**Delegate to:** feature-builder-data · **Nakład:** S · **Zależności:** U1

Implementacja:
- [x] `supabase/migrations/0001_init_projekty.sql` (tabela `projekty`: `nazwa`, `kategoria`, 4 flagi boolean default false, `kontakt`, `uwagi`, `dodal`, `archived_at`, `created_at`/`updated_at` + trigger `update_updated_at`)
- [x] `supabase/migrations/0002_rls_policies.sql` (enable RLS + 4 polityki `authenticated`: select/insert/update/delete; deny-all dla `anon`)
- [x] `supabase/migrations/0003_realtime.sql` (`alter publication supabase_realtime add table projekty`, idempotentnie)
- [x] Indeks częściowy `(created_at desc) where archived_at is null`
- [x] `supabase/verify_rls.sql` + `scripts/verify-rls.mjs` (twardy dowód deny-all anon dla operatora)

Scenariusze testowe:
- [ ] Test: [Manual/operator] Migracje aplikują się czysto na świeżym projekcie Supabase (wymaga realnej bazy)
- [ ] Test: [skrypt operator] SELECT z anon key (bez sesji) → 0 wierszy / błąd RLS (`node --env-file=.env scripts/verify-rls.mjs`)
- [ ] Test: [skrypt operator] SELECT z zalogowaną sesją → zwraca wiersze

Weryfikacja:
- [x] Weryfikacja: składnia SQL poprawna i idempotentna (statycznie — brak Docker/CLI w środowisku)
- [ ] Weryfikacja: anon-key SELECT zwraca pustą tablicę lub błąd uprawnień (deny-all dla `anon`) — operator po aplikacji migracji — wymaga operatora (checklist)
- [ ] Weryfikacja: authenticated SELECT/INSERT/UPDATE/DELETE bez błędu RLS — operator — wymaga operatora (checklist)
- [ ] Weryfikacja: 4 kolumny flag + `archived_at` istnieją w schemacie (`information_schema.columns` via `verify_rls.sql`) — operator — wymaga operatora (checklist)

Operator:
- [ ] Operator aplikuje migracje w Supabase (SQL Editor lub `supabase db push`)
- [ ] Operator weryfikuje w dashboardzie, że Realtime jest włączony dla `projekty`

---

### Unit 3: Bramka dostępu — Supabase Auth + chronione trasy
**Delegate to:** feature-builder-fullstack · **Nakład:** M · **Zależności:** U1, U2

Implementacja:
- [x] `src/components/AuthProvider.tsx` (context sesji: `getSession` + `onAuthStateChange`, cleanup) — context/hook wydzielone do `src/components/auth-context.ts`
- [x] `src/components/ProtectedRoute.tsx` (brak sesji → `/login`; loading → krótki stan)
- [x] Modyfikuj `LoginPage.tsx` (formularz `signInWithPassword`, inline error PL, spinner; `useActionState`)
- [x] Modyfikuj `App.tsx` (owinięcie tras `ProtectedRoute` + `AuthProvider`)
- [x] Modyfikuj/utwórz `Header.tsx` (logo „Pracownia · projekty" Fraunces italic + hook wylogowania)
- [x] Test (unit, test-first): `AuthProvider.test.tsx` (mock TYLKO Supabase auth), test guardu `ProtectedRoute.test.tsx`

Scenariusze testowe:
- [x] Test: `ProtectedRoute` bez sesji renderuje redirect; z sesją renderuje children
- [x] Test: `LoginPage` przy odrzuceniu z auth pokazuje inline error PL (mock zwraca error)
- [ ] Test: [E2E] `/` bez sesji → `/login`; poprawne logowanie → `/`; błędne → inline error; wyloguj → `/login` (weryfikacja wizualna w /dev-docs-review)

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (w tym test guardu)
- [ ] Weryfikacja: [E2E] niezalogowany dostęp do `/` przekierowuje na `/login` (SKIP — Agent 5 niedostępny: brak dev env z Supabase)
- [ ] Weryfikacja: [E2E] po zalogowaniu `/` osiągalne; po wylogowaniu znów `/login` (SKIP — Agent 5 niedostępny: brak dev env z Supabase)

Operator:
- [ ] Operator zakłada wspólne konto zespołu (email+hasło) w Supabase Auth i przekazuje dane 4 osobom

---

## Do poprawy po review fazy 1

> Review: 2026-06-11 (`review-faza-1.md`). Gate: **⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× P1.
> Quality gate (typecheck/lint/test 22/22/build) zielony. Zgodność ze spec: pełna.

**Zablokowane na infrastrukturze operatora (nie defekty kodu — uruchom po setupie Supabase):**

- [ ] 🟠 [important] **U1/U3 — weryfikacje E2E** — 3 scenariusze (`/` bez błędów konsoli; redirect niezalogowanego na `/login`; po (wy)logowaniu) — SKIP, brak `.env`/projektu Supabase. Uruchom po wykonaniu Operator TODO (kontekst §110).

**Nity (opcjonalne):**

- [x] 🟡 [nit] **supabase/migrations/0002_rls_policies.sql** — `using(true)` daje pełny CRUD na PII (`kontakt`) każdemu użytkownikowi Supabase Auth. → **Dodane do Operator TODO (kontekst §110 pkt 5):** wyłączyć publiczne email signups w Supabase Auth (utwardzenie modelu wspólnego konta D3). ✅ 2026-06-11
- [x] 🟡 [nit] **Header.tsx:11 / AuthProvider.tsx:18,21** — boolean bez prefiksu `is`/`has` → zmienione: `isSigningOut` / `isLoading` / `isActive`; `AuthState.loading` → `isLoading` (publiczny kontrakt — zaktualizowano `auth-context.ts`, `ProtectedRoute` + testy). ✅ 2026-06-11
- [x] 🟡 [nit] **LoginPage.tsx:18** — dodany test gałęzi „Podaj email i hasło" (przez `fireEvent.submit` — jsdom egzekwuje natywny `required`, więc klik nie odpala akcji); auth nie wywołane. ✅ 2026-06-11

---

## Faza 2 — Dane + widok główny desktop

### Unit 4: Warstwa dostępu do danych — schematy Zod + hooki React Query
**Delegate to:** feature-builder-data · **Nakład:** L · **Zależności:** U1, U2, U3

Implementacja:
- [x] `src/lib/schemas.ts` (Zod: `projektSchema`, `nowyProjektInput`, `edycjaProjektuInput`)
- [x] Rozszerz `src/lib/types.ts` (typy z `z.infer`, typ klucza flagi `FlagaKey`, zero `any`)
- [x] `src/hooks/useProjektyData.ts` (lista z filtrami, `created_at desc`, `archived_at is null` domyślnie)
- [x] `src/hooks/useProjektData.ts` (pojedynczy)
- [x] `src/hooks/useProjektMutations.ts` (`create`/`update`/`toggleFlaga`/`archive`/`restore`/`hardDelete`; `toggleFlaga` z optimistic update + rollback; `onError` → toast + re-throw)
- [x] `src/lib/queryKeys.ts`
- [x] Test (unit, test-first wertykalnie): `schemas.test.ts`, `useProjektyData.test.ts`, `useProjektMutations.test.ts` (MSW mockuje TYLKO Supabase REST)

Scenariusze testowe:
- [x] Test: `useProjektyData` bez filtrów → wiersze `created_at desc`, tylko `archived_at is null`
- [x] Test: filtr flagi (np. `rozpisane=false`) + szukaj łączą się AND (asercja na parametrach zapytania)
- [x] Test: filtr „tylko zarchiwizowane" → wyłącznie `archived_at is not null`
- [x] Test: `create` waliduje Zod — brak `nazwa`/`kategoria`/`dodal` → błąd przed wysłaniem; nowy projekt ma 4 flagi `false`
- [x] Test: `toggleFlaga` optimistic ustawia nową wartość natychmiast; błąd sieci → rollback + toast + propagacja
- [x] Test: `archive`/`restore`/`hardDelete` wołają update(archived_at=now)/update(null)/delete

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` bez błędów, zero `any`
- [x] Weryfikacja: `npm run test` — schematy i hooki zielone
- [x] Weryfikacja: `npm run lint` bez błędów
- [x] Weryfikacja: brak pustych `catch {}` w nowych plikach

---

### Unit 5: Tabela desktop + FlagBtn (optimistic toggle) + przygaszanie + empty state
**Delegate to:** feature-builder-ui · **Nakład:** L · **Zależności:** U4, U3

Implementacja:
- [x] `src/features/projekty/components/FlagBtn.tsx` (reużywalny, `size: 'table' | 'detail' | 'card'`; aktywny=zielony+Check, nieaktywny=szary+Circle; bez animacji koloru)
- [x] `src/features/projekty/components/ProjektTabela.tsx` (kolumny `DESIGN.md`: Kategoria pill · Nazwa · Kontakt · 4× FlagBtn · Dodano; `table-layout:auto`; hover; klik wiersza→szczegóły; 4× true → `opacity 0.4`)
- [x] `src/features/projekty/components/EmptyState.tsx` (warianty: brak projektów / brak wyników)
- [x] `src/features/projekty/hooks/useIsMobile.ts` (`matchMedia('(max-width: 767px)')`, reaktywnie)
- [x] Modyfikuj `ListaPage.tsx` (header + tabela desktop); modyfikuj `Header.tsx` (CTA „+ Nowy projekt")
- [x] Toggle desktop: klik FlagBtn → `toggleFlaga` (optimistic) → toast „LABEL: TAK/NIE"; mobile ścieżka w U8
- [x] Test (unit): `FlagBtn.test.tsx`, `ProjektTabela.test.tsx`

Scenariusze testowe:
- [x] Test: `FlagBtn` aktywny renderuje zielony styl + Check; nieaktywny szary + Circle; klik wywołuje handler z nową wartością
- [x] Test: na desktopie klik flagi wywołuje `toggleFlaga` od razu (bez ConfirmSheet) + pokazuje toast
- [x] Test: wiersz z 4 flagami `true` ma klasę przygaszenia (`opacity 0.4`)
- [x] Test: błąd mutacji → wartość flagi wraca do poprzedniej + toast „Błąd — spróbuj ponownie"
- [ ] Test: [E2E] `/` tabela najnowsze-pierwsze; klik flagi natychmiastowy + toast; klik wiersza → szczegóły; pusta baza → empty state z CTA (weryfikacja wizualna w /dev-docs-review)

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E] optimistic zmiana flagi widoczna natychmiast + toast (snapshot przed/po) (SKIP — Agent 5 niedostępny: brak `.env`/Supabase)
- [ ] Weryfikacja: [E2E] wiersz z 4 flagami true przygaszony (screenshot) (SKIP — Agent 5 niedostępny: brak `.env`/Supabase)
- [ ] Weryfikacja: [E2E] empty state widoczny przy braku danych (SKIP — Agent 5 niedostępny: brak `.env`/Supabase)

---

### Unit 6: Belka filtrów z licznikami + wyszukiwarka
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U5

Implementacja:
- [x] `src/features/projekty/components/Filtry.tsx` (5 linków per `DESIGN.md`: Wszystkie · Do rozpisania · Do przesłania · Do sprawdzenia · Do wydrukowania; każdy z pillem-licznikiem; aktywny podkreślony terakotą; pole Szukaj)
- [x] `src/features/projekty/hooks/useFiltry.ts` (`{flaga, szukaj, archiwum}`, debounce szukaj)
- [x] Liczniki client-side (D10): liczone z pełnego zbioru aktywnych projektów, aktualizowane po każdej zmianie flagi
- [x] Modyfikuj `ListaPage.tsx` (podpięcie filtrów do `useProjektyData`)
- [x] Modyfikuj `EmptyState.tsx` (wariant „brak wyników" + „Pokaż wszystkie") — wariant istniał już z U5; podpięty w `ListaPage`
- [x] Test (unit, test-first liczniki + AND): `Filtry.test.tsx`, `useFiltry.test.ts`

Scenariusze testowe:
- [x] Test: filtr „Do rozpisania" pokazuje tylko `rozpisane=false`; analogicznie pozostałe 3 flagi
- [x] Test: licznik „Do rozpisania" = liczba projektów z `rozpisane=false`; po zaznaczeniu flagi licznik maleje i projekt znika z aktywnego filtra
- [x] Test: Szukaj filtruje po `nazwa` (ilike); łączy się AND z aktywnym filtrem flagi
- [x] Test: „Pokaż wszystkie" resetuje do filtra „Wszystkie", czyści szukaj
- [ ] Test: [E2E] przełączanie filtrów zmienia listę i liczniki; zaznaczenie flagi w aktywnym filtrze usuwa projekt; brak wyników → empty „brak wyników" (weryfikacja wizualna w /dev-docs-review)

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E] liczniki aktualizują się po każdej zmianie flagi; aktywny filtr zawęża listę; reset działa (SKIP — Agent 5 niedostępny: brak `.env`/Supabase)

---

## Do poprawy po review fazy 2

> Review: 2026-06-11 (`review-faza-2.md`). Gate: **⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× P1.
> Quality gate zweryfikowany na żywo: typecheck/lint czyste, test 69/69, build OK.
> Zgodność ze spec: wysoka (D5/D10 wierne, 0 błędnych implementacji). E2E SKIP (brak `.env`/Supabase).

> ✅ **Poprawki wykonane 2026-06-11** (subagenci: feature-builder-data + feature-builder-ui, serial).
> Quality gate po poprawkach: typecheck ✅, test **85/85** (16 plików, +16), lint ✅, build ✅.

**Oś Standards — 🟠 P2 (do naprawy):**

- [x] 🟠 [important] **src/hooks/useProjektyData.ts:26** — LIKE injection → helper `escapeLike` (escapuje `\`, `%`, `_`) + przycięcie `szukaj` do 200 znaków (`slice`, nie ZodError — to filtr, nie formularz). Testy: escapowanie metaznaków + limit długości. ✅
- [x] 🟠 [important] **Zod na granicy** — `projektSchema.array().parse(data ?? [])` / `.parse(data)` w `useProjektyData`/`useProjektData`/`useProjektMutations` (create/update); wszystkie `as Projekt` usunięte. Test: niepoprawny kształt danych z bazy → `isError`. ✅
- [x] 🟠 [important] **useProjektMutations.ts** — usunięte 6× `throw error` z `onError` (zostaje toast; UI reaguje przez `isError`); usunięty obronny `onError: () => {}` z `ProjektTabela.tsx`. Świadoma zmiana kontraktu: test toggleFlaga przepisany z `rejects` na `waitFor(isError)` — rollback + toast nadal asertowane. ✅
- [x] 🟠 [important] **Dedup `KOLUMNY`** — `export const PROJEKT_KOLUMNY` w `src/lib/queryKeys.ts` (współdzielony moduł warstwy query), import w 3 hookach. ✅
- [x] 🟠 [important] **useProjektMutations onSettled** — toggleFlaga invaliduje dodatkowo `queryKeys.projekt(id)`. Test: `getQueryState(...).isInvalidated`. ✅
- [x] 🟠 [important] **ListaPage.tsx:24,28** — podwójny `useProjektyData` — **decyzja: bez zmian** (świadomy trade-off D10, nie defekt); rewizja wzorca przy U8 (karty mobile). ✅ odnotowane
- [x] 🟠 [important] **ProjektTabela.test.tsx** — asercja nagłówka `columnLabel` („Przesłany haft/sito") dodana. ✅
- [x] 🟠 [important] **useIsMobile.ts** — `useIsMobile.test.ts` dodany (4 testy: matches true/false, reaktywność na `change`, `removeEventListener` na unmount). ✅
- [x] 🟠 [important] **EmptyState.tsx** — `EmptyState.test.tsx` dodany (3 testy: oba warianty + klik CTA → `onAction`). ✅

**Oś Spec — 🟠 P2 (odnotowane, scope creep „legalny" — bez akcji):**

- [x] 🟠 [important] **useProjektMutations.ts** — `archive`/`restore`/`hardDelete` (U10/Faza 4) powstały w U4 — dozwolone wyprzedzenie (checklist U4 je wymienia). Odnotowane w kontekście; bez akcji. ✅

**Nity (🟡 P3 — opcjonalne):**

- [x] 🟡 [nit] **ProjektTabela.tsx** — rename `handleToggle` → `makeToggleHandler` + explicit return type. ✅
- [x] 🟡 [nit] **useProjektData.ts** — `id as string` usunięte (guard z early throw w queryFn). ✅
- [x] 🟡 [nit] **FlagBtn.tsx** — `import type { MouseEvent } from 'react'` zamiast `React.MouseEvent`. ✅
- [x] 🟡 [nit] **Explicit return types** na hookach danych (`UseQueryResult<…>`, `UseProjektMutationsResult`) — wyrównane z `useFiltry`/`useIsMobile`. ✅
- [x] 🟡 [nit] **ProjektTabela.tsx** — `FlagBtn` dostaje `disabled={toggleFlaga.isPending}` (+ test z opóźnionym PATCH). Szerokości kolumn z DESIGN.md:162-169 — **świadomie pominięte** (kosmetyka, tableLayout auto zostaje). ✅ częściowo
- [ ] 🟡 [nit] **Filtry.tsx:44-53** — logika liczników → `useLiczniki(projekty)` dopiero przy wzroście. Bez akcji (próg nieosiągnięty).
- [ ] 🟡 [nit] **queryKeys.ts:23** — `szukaj` w query key/Devtools — bez akcji (ryzyko minimalne, wspólne konto).
- [ ] 🟡 [nit] **Header.tsx** — `async handleSignOut` bez `await` — bez akcji (łapie błąd wewnątrz, w praktyce OK).
- [x] 🟡 [nit] **ListaPage** — `ListaPage.test.tsx` dodany (2 testy: brak filtra → `brak-projektow` + nawigacja `/nowy`; aktywny filtr → `brak-wynikow` + reset). Przez MSW (konwencja repo), nie mock hooka. ✅
- [ ] 🟡 [nit] **Filtry.tsx:78** — warning jsdom `<search>` — bez akcji (kosmetyka stderr testów).

---

## Faza 3 — Formularz, mobile, szczegóły

### Unit 7: Formularz nowego projektu
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U1

Implementacja:
- [x] `src/features/projekty/components/ProjektForm.tsx` (parametryzowany `create`|`edit` — reuse w U9; pola: Nazwa* → Kategoria*+Kontakt (grid 2→1 kol) → Dodał* → Uwagi; BEZ flag)
- [x] `src/features/projekty/components/OsobaSegmented.tsx` (segmented control z `OSOBY`, radiogroup, WCAG 2.2)
- [x] Kategoria: natywny `<select>` z `KATEGORIE`; wybór „Inne…" → input tekstowy → wartość trafia do `kategoria` (D9)
- [x] Modyfikuj `NowyProjektPage.tsx`; pola min-height 48px (mobile-first)
- [x] RHF + zodResolver, komunikaty PL; po sukcesie invalidate + redirect `/` + toast „Projekt dodany" — ⚠ resolver na lokalnym `projektFormSchema` (pochodna `nowyProjektInput`, reuse shape + komunikatów): czysty `nowyProjektInput` nie obsłużyłby pola „Inne…"/mapowania `''→null`; `create` w hooku nadal waliduje `nowyProjektInput`
- [x] Test (unit, test-first walidacja): `ProjektForm.test.tsx`, `OsobaSegmented.test.tsx` + dodatkowy `NowyProjektPage.test.tsx` (scenariusze create+nawigacja wymagają MSW+routera na poziomie strony — precedens `ListaPage.test.tsx`)

Scenariusze testowe:
- [x] Test: submit bez wymaganych pól → błędy PL pod nazwa/kategoria/dodał; create NIE wywołane
- [x] Test: wybór „Inne…" pokazuje input; wpisana wartość trafia jako `kategoria` do create (+ „Inne…" bez wpisania blokuje submit)
- [x] Test: poprawny submit → create z 4 flagami `false`; po sukcesie nawigacja `/` (+ error case: 500 → toast błędu, user zostaje na formularzu)
- [x] Test: `OsobaSegmented` zaznacza wybraną osobę, obsługiwalny klawiaturą (radiogroup)
- [ ] Test: [E2E] happy path: wypełnij → Zapisz → redirect + toast + wiersz w tabeli (weryfikacja wizualna w /dev-docs-review)
- [ ] Test: [E2E] pusty submit → inline błędy PL (weryfikacja wizualna w /dev-docs-review)

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (97/97 po IU-7)
- [ ] Weryfikacja: [E2E] dodanie projektu → redirect `/` + toast + nowy wiersz (SKIP — brak `.env`/Supabase, Operator TODO)
- [ ] Weryfikacja: [E2E] walidacja blokuje pusty submit z komunikatami PL; „Inne…" pokazuje input (SKIP — brak `.env`/Supabase, Operator TODO)

---

### Unit 8: Karty mobile 2×2 + ConfirmSheet (bottom sheet) + FAB
**Delegate to:** feature-builder-ui · **Nakład:** L · **Zależności:** U5, U6

Implementacja:
- [x] `src/features/projekty/components/ProjektKarty.tsx` (karta: wiersz 1 kategoria pill + data względna; wiersz 2 nazwa; flagi w gridzie 2×2 `FlagBtn size='card'`; klik karty poza flagami → szczegóły; 4× true → `opacity 0.4`)
- [x] `src/features/projekty/components/ConfirmSheet.tsx` (overlay + bottom sheet `sheetUp` 200ms + `prefers-reduced-motion`; tytuł „Zaznaczyć/Cofnąć flagę?"; nazwa; podgląd `FlagBtn` po zmianie; „Tak, zmień" / „Anuluj"; klik overlay = anuluj; `role="dialog"` + `aria-modal`)
- [x] `src/components/Fab.tsx` (terakota 52×52, okrągły, `fixed bottom-right`, `Plus` 22, nawiguje do `/nowy`)
- [x] Modyfikuj `ListaPage.tsx` (render tabela ≥768px / karty <768px wg `useIsMobile`)
- [x] Modyfikuj `Header.tsx` (CTA „+ Nowy projekt" ↔ FAB wg breakpointu)
- [x] Mobile toggle flagi: klik FlagBtn → `ConfirmSheet`; „Tak, zmień" → `toggleFlaga` (ta sama ścieżka co desktop) + toast
- [x] Test (unit): `ProjektKarty.test.tsx`, `ConfirmSheet.test.tsx`, `Fab.test.tsx` + 2 testy wiringu breakpointu w `ListaPage.test.tsx`
- ⚠ `src/test/setup.ts` — dodany stub `window.matchMedia` (jsdom go nie ma; bez stubu testy `ListaPage`/`Header` padają po wpięciu `useIsMobile`); domyślnie desktop, testy mobile nadpisują przez `vi.stubGlobal`. Test-infra, zero wpływu na produkcję.

Scenariusze testowe:
- [x] Test: na mobile klik flagi NIE zmienia jej od razu — otwiera `ConfirmSheet` z podglądem stanu po zmianie
- [x] Test: „Tak, zmień" wywołuje `toggleFlaga`; „Anuluj"/klik overlay → brak mutacji, sheet zamknięty
- [x] Test: karta z 4 flagami true ma przygaszenie; FAB nawiguje do `/nowy`
- [ ] Test: [E2E 375px] karty 2×2; klik flagi → sheet → „Tak, zmień" → zmiana + toast; klik karty → szczegóły; FAB widoczny, CTA ukryte (weryfikacja wizualna w /dev-docs-review)
- [ ] Test: [E2E 1280px] tabela zamiast kart, CTA w headerze zamiast FAB (weryfikacja wizualna w /dev-docs-review)

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (114/114 po IU-8)
- [ ] Weryfikacja: [E2E 375px] karty 2×2 + ConfirmSheet potwierdza zmianę flagi (screenshot przed/po) (SKIP — brak `.env`/Supabase, Operator TODO)
- [ ] Weryfikacja: [E2E] zmiana szerokości okna przełącza tabela↔karty (matchMedia reaktywnie) (SKIP — brak `.env`/Supabase, Operator TODO)

Operator:
- [ ] QA weryfikuje dotyk/scroll, ConfirmSheet i FAB na realnym urządzeniu (iOS + Android)

---

### Unit 9: Szczegóły + edycja + strona 404 projektu
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U5, U7

Implementacja:
- [x] Modyfikuj `ProjektSzczegolyPage.tsx`, `NotFoundPage.tsx` (NotFoundPage: opcjonalne propsy `tytul`/`opis`, defaulty = copy trasy `*` — bez drugiej strony 404)
- [x] `src/features/projekty/components/SzczegolyWidok.tsx` (header Wróć | Edytuj+Usuń; kategoria pill + data pełna; nazwa 22px; rząd dużych `FlagBtn size='detail'` z pełnymi etykietami — druga „PRZESŁANY HAFT/SITO" przez `columnLabel ?? label`; grid 3 kol Kontakt/Dodał/Ostatnia zmiana; Uwagi pełna szerokość)
- [x] Flagi w szczegółach: desktop natychmiast / mobile `ConfirmSheet` (reuse U8 bez zmian, `useIsMobile` w jednym komponencie)
- [x] Tryb edycji = `ProjektForm` mode `edit` (wszystkie pola wypełnione; bez flag — test asertuje brak `rozpisane` w body PATCH)
- [x] 404: get → brak rekordu (PostgREST `PGRST116`, type guard bez `as`) → `NotFoundPage` + link do `/`; inne błędy GET → osobny stan błędu
- [x] Przycisk „Usuń" (kosz) → `archive.mutate` + toast „Projekt usunięty" + powrót na `/` (pełny dialog w U10)
- [x] Test (unit, test-first 404 + edycja): `SzczegolyWidok.test.tsx` (7), `ProjektSzczegolyPage.test.tsx` (5)

Scenariusze testowe:
- [x] Test: read-only renderuje wszystkie pola w układzie `DESIGN.md` (data pełna, nie względna)
- [x] Test: druga flaga w szczegółach ma pełną etykietę „PRZESŁANY HAFT/SITO"
- [x] Test: Edytuj → zmiana pola + zapis → update; Anuluj → brak update, powrót do read-only
- [x] Test: get zwraca brak → render strony 404 z linkiem do `/`
- [ ] Test: [E2E] pełna ścieżka edycji + toast „Zmiany zapisane"; nieistniejące id → 404 + link działa (weryfikacja wizualna w /dev-docs-review)

Weryfikacja:
- [x] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (126/126 po IU-9)
- [ ] Weryfikacja: [E2E] edycja pól zapisuje się i widoczna po reloadzie (SKIP — brak `.env`/Supabase, Operator TODO)
- [ ] Weryfikacja: [E2E] `/projekt/nieistniejace` → „Nie znaleziono projektu" (SKIP — brak `.env`/Supabase, Operator TODO)

---

## Faza 4 — Usuwanie, Realtime, polish

### Unit 10: Soft delete + archiwum + przywracanie + 3-stopniowy hard delete
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U4, U6, U9

Implementacja:
- [ ] `src/features/projekty/components/UsunDialog.tsx` (potwierdzenie archiwizacji: „Usunąć projekt [nazwa]?")
- [ ] `src/features/projekty/components/HardDeleteDialog.tsx` (danger, „Operacja nieodwracalna", 3-stopniowe potwierdzenie)
- [ ] Modyfikuj `Filtry.tsx`/`useFiltry.ts` (wymiar archiwum: aktywne ↔ tylko zarchiwizowane)
- [ ] Modyfikuj `ProjektTabela.tsx`/`ProjektKarty.tsx` (akcje wg kontekstu: aktywne → „Usuń"; archiwum → „Przywróć" + „Usuń trwale")
- [ ] Modyfikuj `SzczegolyWidok.tsx` (przycisk Usuń → `UsunDialog`)
- [ ] Test (unit, test-first niedostępność hard delete z aktywnej): `UsunDialog.test.tsx`, `HardDeleteDialog.test.tsx`

Scenariusze testowe:
- [ ] Test: kontekst aktywny renderuje „Usuń" (archive), NIE renderuje „Usuń trwale"
- [ ] Test: kontekst archiwum renderuje „Przywróć" + „Usuń trwale"
- [ ] Test: `UsunDialog` potwierdzenie → archive; anulowanie → brak akcji
- [ ] Test: `HardDeleteDialog` przejście 3 kroków → hardDelete; anulowanie na dowolnym kroku → brak akcji
- [ ] Test: [E2E] archiwizacja → archiwum → przywróć; 3-stopniowy hard delete; hard delete nieosiągalny z aktywnej listy

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (w tym test niedostępności hard delete z aktywnej)
- [ ] Weryfikacja: [E2E] archiwizacja usuwa z aktywnej i pozwala przywrócić; hard delete tylko w archiwum, kasuje bezpowrotnie

---

### Unit 11: Synchronizacja na żywo (Supabase Realtime) + dedup optimistic
**Delegate to:** feature-builder-data · **Nakład:** L · **Zależności:** U4, U2, U5/U8

Implementacja:
- [ ] `src/features/projekty/hooks/useRealtimeProjekty.ts` (`channel('projekty').on('postgres_changes', {event:'*'})`, patch/invalidate cache, cleanup `removeChannel`)
- [ ] Modyfikuj `ListaPage.tsx` (montaż subskrypcji)
- [ ] Modyfikuj `useProjektMutations.ts` (tracking pending dla dedup, jeśli potrzebne)
- [ ] Dedup: porównanie `updated_at` + lista pending mutation IDs (algorytm dostrajany przy wykonaniu)
- [ ] Test (unit, start od failing integration testu dedup): `useRealtimeProjekty.test.ts` (mock kanału Supabase)

Scenariusze testowe:
- [ ] Test: event obcego update (zmiana flagi) patchuje cache — nowa wartość widoczna
- [ ] Test: event będący echem własnej optimistic mutacji NIE powoduje migotania / podwójnej aktualizacji
- [ ] Test: event delete usuwa rekord z cache; insert dodaje; update `archived_at` usuwa z aktywnej listy
- [ ] Test: subskrypcja sprzątana przy odmontowaniu (`removeChannel` wywołany)
- [ ] Test: [E2E] dwa okna: zmiana flagi / insert / archive w jednym propaguje do drugiego bez reloadu

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone (w tym test dedup)
- [ ] Weryfikacja: [E2E] zmiana flagi w jednym oknie widoczna w drugim bez ręcznego odświeżania (dwie sesje)

Operator:
- [ ] Operator potwierdza w dashboardzie Supabase, że Realtime aktywny dla `projekty` (jeśli nie w U2)

---

### Unit 12: Polish — daty względne, toasty, empty states, responsywność
**Delegate to:** feature-builder-ui · **Nakład:** M · **Zależności:** U5, U6, U7, U8, U10

Implementacja:
- [ ] Spójne daty względne w tabeli/kartach (`formatRelativeData`) i pełne w szczegółach (`formatDataPelna`)
- [ ] Komplet toastów wg `DESIGN.md`: „Projekt dodany" · „ROZPISANE: TAK/NIE" · „Zmiany zapisane" · „Projekt usunięty" · „Błąd — spróbuj ponownie"
- [ ] Empty states: brak projektów (`Inbox` → „Brak projektów" + CTA) / brak wyników (`SearchX` → „Brak projektów do pokazania" + „Pokaż wszystkie")
- [ ] Dopięcie responsywności: `Filtry` `overflow-x:auto` na mobile; `ProjektForm` siatka 2→1; FAB pozycja nad toastem
- [ ] Przegląd animacji (ConfirmSheet `sheetUp` 200ms, toast 160ms; bez animacji koloru flag) + `prefers-reduced-motion`
- [ ] Test (unit): pokrycie empty states + util daty względnej (jeśli nie w U1)

Scenariusze testowe:
- [ ] Test: empty „brak projektów" pokazuje CTA „+ Nowy projekt"; empty „brak wyników" pokazuje „Pokaż wszystkie"
- [ ] Test: toggle flagi emituje toast z poprawnym labelem i stanem (TAK/NIE)
- [ ] Test: [E2E 375px] filtry scroll poziomy, formularz 1-kolumnowy, FAB nad toastem, karty pełna szerokość
- [ ] Test: [E2E 1280px] CTA w headerze, tabela pełna szerokość

Weryfikacja:
- [ ] Weryfikacja: `npm run typecheck` / `lint` / `test` zielone
- [ ] Weryfikacja: [E2E 375px] layout jednokolumnowy, FAB i filtry scroll OK (screenshot)
- [ ] Weryfikacja: [E2E 1280px] CTA + tabela obecne; daty względne i pełne renderują się poprawnie

Operator:
- [ ] QA weryfikuje dotyk/scroll i FAB na realnym urządzeniu mobilnym (iOS + Android)
