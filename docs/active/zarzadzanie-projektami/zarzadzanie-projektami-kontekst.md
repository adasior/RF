# Kontekst: System zarządzania projektami odzieżowymi — MVP

**Branch:** `feature/zarzadzanie-zamowieniami` (nazwa brancha zachowana dla ciągłości git)
**Ostatnia aktualizacja:** 2026-06-12 (Faza 3 ukończona — U7/U8/U9)

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
5. **Wyłącz publiczne email signups w Supabase Auth** (dashboard → Authentication → Sign In/Up) — polityki RLS `using(true)` dają pełny CRUD na PII (`kontakt`) każdemu użytkownikowi auth; model wspólnego konta (D3) jest bezpieczny tylko bez otwartej rejestracji (review F1, P3).

### Faza 2 — Dane + widok główny desktop (ukończona 2026-06-11)

3 Implementation Units zrealizowane przez subagentów (strategia: **serial** — łańcuch U4→U5→U6 + współdzielony `ListaPage.tsx`). Quality gate na koniec fazy: typecheck czysty, **69/69 testów zielonych** (22 z Fazy 1 + 47 nowych), lint czysty, build OK.

**U4 — Warstwa danych (feature-builder-data):** `src/lib/schemas.ts` (Zod: `projektSchema`, `nowyProjektInput` bez flag z komunikatami PL, `edycjaProjektuInput`), `queryKeys.ts` (typowany factory + `ProjektyFiltry`), rozszerzony `types.ts` (`NowyProjektInput`/`EdycjaProjektuInput` przez `z.infer` — istniejący `Projekt`/`FlagaKey` nietknięte). Hooki: `useProjektyData` (filtry AND, `created_at desc`, domyślnie `archived_at is null`), `useProjektData` (pojedynczy), `useProjektMutations` (`create`/`update`/`toggleFlaga`/`archive`/`restore`/`hardDelete`; `toggleFlaga` optimistic + rollback + toast błędu + re-throw). MSW mockuje TYLKO Supabase REST. Testy: 25 nowych.
- **Odchylenia (test-infra, w granicach planu):** `supabase.ts` — leniwy wrapper `global.fetch` (woła bieżący `globalThis.fetch` w momencie żądania) by MSW przechwytywał REST; zero zmiany zachowania w produkcji. `vite.config.ts` — `test.env` z fikcyjnym URL/anon key (klient robi fail-fast przy braku konfiguracji; wartości nie są sekretami). Dodano `src/test/msw-server.ts` + podpięcie w `setup.ts`. Dodatkowy test `useProjektData.test.ts` (reguła: każda nowa funkcja = happy + error).
- Uwaga dla U6: `useProjektyData({})` = pełen zbiór aktywnych → źródło liczników D10.

**U5 — Tabela desktop + FlagBtn (feature-builder-ui):** `FlagBtn.tsx` (3 warianty `size: table|detail|card`, aktywny zielony+Check / nieaktywny szary+Circle, `aria-pressed`, `stopPropagation`), `ProjektTabela.tsx` (kolumny DESIGN.md, klik wiersza → `/projekt/:id`, 4× true → `opacity-40`), `EmptyState.tsx` (warianty brak-projektow / brak-wynikow), `useIsMobile.ts` (`matchMedia(<768px)` reaktywnie z cleanup). Modyfikacje: `ListaPage` (loading/error/empty/data), `Header` (CTA „+ Nowy projekt"). Toggle desktop natychmiastowy → `toggleFlaga.mutate` + toast „{LABEL}: TAK/NIE"; rollback/toast błędu robi hook. Testy: 10 nowych.
- **Odchylenie:** shadcn/ui NIE zainicjalizowany — prymitywy (button/table/empty) proste, spójne z istniejącym kodem; uniknięto nowej zależności i `tailwind.config.js` (plan dopuszczał pominięcie). Kategoria-pill kolory jako arbitrary values 1:1 z DESIGN.md (brak tokenu w `@theme`). Brak `cn`/clsx → konkatenacja klas. `FlagBtn size=card|detail` i `useIsMobile` zbudowane teraz, konsumpcja w U8/U9.

**U6 — Belka filtrów + wyszukiwarka (feature-builder-ui):** `Filtry.tsx` (prezentacyjny: 5 linków z `filterLabel`, pill-licznik `tabular-nums`, aktywny `border-accent` terakota, `<search>` + `sr-only` label, `overflow-x-auto`), `useFiltry.ts` (`{flaga, szukaj, archiwum}`, debounce 300ms z cleanup, `reset()`). Liczniki client-side w `useMemo` z pełnego zbioru aktywnych (D10) — reaktywne po toggle. `ListaPage` woła `useProjektyData` dwukrotnie: `({})` dla liczników + `(filtry)` dla tabeli; rozróżnia empty `brak-wynikow` (reset) vs `brak-projektow` (`/nowy`). Testy: 12 nowych.
- **Odchylenie:** `EmptyState.tsx` nie modyfikowany — wariant `brak-wynikow` + „Pokaż wszystkie" już istniał z U5, tylko podpięty. Pole „Szukaj" bez wymiarów w DESIGN.md → `h-8 w-40` spójnie z resztą inputów.

**Otwarte dla kolejnych faz:**
- U8 (mobile): `useIsMobile` + `FlagBtn size=card` gotowe; przełączanie tabela↔karty + `ConfirmSheet` (mobile toggle) + układ pola szukaj na mobile do rozstrzygnięcia.
- E2E Fazy 2 (klik flagi, filtry, liczniki, empty states) — SKIP do `/dev-docs-review` (wymaga `.env`/Supabase, Operator TODO §110).

### Faza 3 — Formularz, mobile, szczegóły (ukończona 2026-06-12)

3 Implementation Units zrealizowane przez subagentów `feature-builder-ui` (strategia: **serial**
U7→U8→U9 — U9 reuse'uje `ProjektForm` z U7 i `ConfirmSheet` z U8; U7/U8 dzieliły ryzyko wspólnych
plików). Quality gate na koniec fazy (uruchomiony przez orkiestratora na całości): typecheck czysty,
**126/126 testów** (24 pliki; 85 → 126, +41), lint czysty, build OK (każda strona w osobnym lazy chunku).

**U7 — Formularz nowego projektu (feature-builder-ui):** `ProjektForm.tsx` (mode `create`|`edit`,
pola wg DESIGN.md: Nazwa → Kategoria+Kontakt grid 2→1 → Dodał → Uwagi, BEZ flag, min-h 48px),
`OsobaSegmented.tsx` (radiogroup z natywnymi radio `sr-only` w label — klawiatura/roving focus
za darmo), kategoria „Inne…" → input (D9, sentinel `KATEGORIA_INNE` zsynchronizowany z `config.ts`),
`NowyProjektPage` (po sukcesie toast „Projekt dodany" + redirect `/`; toast sukcesu w stronie —
hook toastuje tylko błędy). Testy: +12 (97/97).
- Decyzja: `zodResolver` na lokalnym `projektFormSchema` (pochodna `nowyProjektInput` — reuse shape
  i komunikatów PL + `kategoriaInna` w `superRefine`); czysty `nowyProjektInput` nie obsłużyłby
  „Inne…"/mapowania `''→null`. Podwójna granica zachowana — `create` w hooku nadal waliduje Zod.
- **Odchylenie:** dodatkowy `NowyProjektPage.test.tsx` (konwencja repo: MSW + router na poziomie
  strony, nie mock hooków). W granicach planu.

**U8 — Karty mobile + ConfirmSheet + FAB (feature-builder-ui):** `ProjektKarty.tsx` (pill+data
względna / nazwa / grid 2×2 `FlagBtn size='card'`, 4× true → `opacity-40`, klik karty → szczegóły),
`ConfirmSheet.tsx` (overlay + `animate-sheet-up` 200ms + `prefers-reduced-motion`, podgląd flagi
PO zmianie jako `FlagBtn size='detail'` w `pointer-events-none`, klik overlay = anuluj, `role="dialog"`),
`Fab.tsx` (terakota 52×52 → `/nowy`). `ListaPage`: tabela ≥768px / karty <768px (`useIsMobile`);
`Header`: CTA ↔ FAB. Mobile toggle = sheet → „Tak, zmień" → ta sama mutacja `toggleFlaga` co desktop
(D5) + toast; sheet zamyka się natychmiast po potwierdzeniu (optimistic). Testy: +17 (114/114).
- **Odchylenie (test-infra):** stub `window.matchMedia` w `src/test/setup.ts` (jsdom go nie ma);
  domyślnie desktop, testy mobile nadpisują `vi.stubGlobal`. Zero wpływu na produkcję.
- Rewizja podwójnego `useProjektyData` (prośba review F2): **zostawione 2×** — filtrowanie
  client-side zmieniałoby semantykę warstwy danych (`ilike` serwerowe, escapeLike, archiwum)
  i kontrakty testów U4/U6 → poza UI-scope U8. Ewentualna zmiana = zadanie dla feature-builder-data.
- `isKompletny` zduplikowany z `ProjektTabela` (3 linie) — atomowość > DRY przy tej skali.
- ConfirmSheet bez Escape/focus-trap (checklist nie wymagał) — kandydat do U12 (polish), jeśli QA podniesie.

**U9 — Szczegóły + edycja + 404 (feature-builder-ui):** `SzczegolyWidok.tsx` (header Wróć |
Edytuj+Usuń; pomiary 1:1 z DESIGN.md: nazwa 22px, etykiety 10px uppercase, grid 3→1 Kontakt/Dodał/
Ostatnia zmiana, Uwagi pełna szerokość; flagi `size='detail'` z pełną etykietą przez
`columnLabel ?? label` → „PRZESŁANY HAFT/SITO" bez nowego pola w config). Flagi: desktop natychmiast /
mobile `ConfirmSheet` (reuse U8 bez zmian). Edycja = `ProjektForm mode='edit'` (defaulty z projektu,
kategoria spoza listy → auto „Inne…"; PATCH bez flag — asertowane testem); po sukcesie toast „Zmiany
zapisane", cache `projekt(id)` patchowany przez `update.onSuccess` hooka. 404: type guard po kodzie
PostgREST `PGRST116` (`.single()` bez wiersza) → `NotFoundPage` z propsami `tytul`/`opis`
(„Nie znaleziono projektu") + link `/`; inne błędy GET → osobny stan błędu. „Usuń" =
`archive.mutate` + toast „Projekt usunięty" + powrót `/` (placeholder — `UsunDialog` w U10).
Testy: +12 (126/126). **Odchylenia od planu: Brak.**

**Otwarte dla Fazy 4:**
- U10: podmienia `handleUsun` w `ProjektSzczegolyPage` na `UsunDialog` (archive + toast już podpięte).
- U12: ewentualny Escape/focus-trap w ConfirmSheet; grid formularza 2→1 przez `md:` (viewport,
  nie container query) — do rewizji przy dopinaniu responsywności.
- E2E Fazy 3 (formularz, karty 375px, ConfirmSheet, edycja, 404) — SKIP do `/dev-docs-review`
  (blokada na Operator TODO §110 — brak `.env`/Supabase).

### Review Fazy 1 (2026-06-11)

Multi-axis code review (Standards + Spec) — raport: `review-faza-1.md`. Gate: **⚠️ KONTYNUUJ
Z ZASTRZEŻENIAMI** (0× P1, 3× P2, 3× P3). Quality gate zweryfikowany na żywo: typecheck/lint
czyste, test 22/22, build OK. **Zgodność ze spec: pełna** — `KATEGORIE`/`OSOBY`/`FLAGI` i schemat
1:1 ze SPEC v5; nieaktualna sekcja API-Routes SPEC poprawnie pominięta (D1/D2). Zero scope creep.

**Kluczowe wnioski:**
- Wszystkie 3× P2 to **zablokowane E2E** (brak `.env`/Supabase) — nie defekty kodu; uruchomić
  po Operator TODO. U4 (warstwa danych) nie zależy od E2E Fazy 1 → można kontynuować.
- P3 bezpieczeństwa do zapamiętania przy deployu: `RLS using(true)` = każdy user Supabase Auth
  ma pełny CRUD na PII → **operator musi wyłączyć publiczne signups** (model wspólnego konta D3).
- P3 nity: nazewnictwo boolean bez prefiksu `is/has`; nietestowana gałąź guardu w `LoginPage`.

### Review Fazy 2 (2026-06-11)

Multi-axis code review (Standards + Spec) — raport: `review-faza-2.md`. Gate: **⚠️ KONTYNUUJ
Z ZASTRZEŻENIAMI** (0× P1, 9× P2 Standards + 1× P2 Spec, ~13× P3). Quality gate zweryfikowany
na żywo: typecheck/lint czyste, test **69/69**, build OK. **Zgodność ze spec: wysoka** — D5
(toggle desktop natychmiastowy) i D10 (liczniki z pełnego zbioru aktywnych) zrealizowane
wiernie; AND filtrów, sortowanie `created_at desc`, opacity 0.4, toast „ROZPISANE: TAK/NIE"
poprawne. **0 błędnych implementacji.** E2E SKIP (brak `.env`/Supabase, Operator TODO §110).

**Kluczowe wnioski (do naprawy przed/podczas Fazy 3):**
- **Zod nieużywany na granicy** — `projektSchema` istnieje i jest testowany, ale odpowiedzi
  z Supabase rzutowane `as Projekt` zamiast `.parse()` (martwy schemat prod, coding-rules §10).
  Najtańszy fix o największym zysku spójności — usuwa 4× `as`.
- **LIKE injection** — `szukaj` interpolowany surowo do `ilike` (escapuj `%`/`_` + limit długości).
- **`onError` re-throw** (6×) — ryzyko unhandled rejection; wymusza obronny `onError: () => {}`
  u konsumenta. Usunąć `throw`, zostawić toast.
- **Dedup `KOLUMNY`** — 13-kolumnowy string w 3 plikach → jedna stała.
- **Brakujące testy nowych jednostek** — `useIsMobile`, `EmptyState`, render `columnLabel`
  w nagłówku tabeli (coding-rules §2).
- **Podwójny `useProjektyData`** (D10) — świadomy trade-off, NIE defekt; opcjonalnie filtrować
  client-side z jednego datasetu przed dorzuceniem kart mobile (U8), by nie utrwalać wzorca.
- **Scope creep „legalny"** — `archive`/`restore`/`hardDelete` (U10/Faza 4) powstały w U4 —
  wymienione w checkliście U4, więc dozwolone; delete-layer gotowy zanim istnieje jego UI.

### Poprawki po review Fazy 1 i 2 (2026-06-11)

Wykonane przez 2 subagentów (strategia: **serial** — współdzielony `ProjektTabela.tsx`).
Quality gate po poprawkach: typecheck ✅, test **85/85** (16 plików; 69 → 85), lint ✅, build ✅.

**feature-builder-data (hooki + granica Zod):**
- `escapeLike` (escapuje `\`/`%`/`_`) + limit 200 znaków dla `szukaj` przed `ilike` (LIKE injection).
- `projektSchema.parse(...)` na wszystkich odpowiedziach Supabase — usunięte 4× `as Projekt` (Zod realnie na granicy).
- Usunięte 6× `throw error` z `onError` mutacji (zostaje toast; UI przez `isError`) + usunięty obronny `onError: () => {}` w `ProjektTabela`. **Świadoma zmiana kontraktu** — test toggleFlaga przepisany z `rejects` na `waitFor(isError)`; rollback + toast nadal asertowane.
- `PROJEKT_KOLUMNY` w `queryKeys.ts` (dedup 3× stringa kolumn); `onSettled` toggleFlaga invaliduje też `projekt(id)`; explicit return types na hookach danych; usunięte `id as string`.
- Decyzja: limit `szukaj` przez `slice(0,200)`, nie ZodError — to filtr listy, rzucanie przy wpisywaniu psułoby UX.

**feature-builder-ui (testy komponentów + nity):**
- Nowe testy: `useIsMobile.test.ts` (4), `EmptyState.test.tsx` (3), `ListaPage.test.tsx` (2 — warianty empty state przez MSW, nie mock hooka), asercja `columnLabel` + disabled-podczas-pending w `ProjektTabela.test.tsx`, gałąź „Podaj email i hasło" w `LoginPage.test.tsx` (przez `fireEvent.submit` — jsdom egzekwuje natywny `required`).
- Renamy: `handleToggle` → `makeToggleHandler`; booleany z prefiksem `is` (`isSigningOut`, `isLoading`, `isActive`) — w tym **publiczny kontrakt `AuthState.loading` → `isLoading`** (zaktualizowani konsumenci + testy); `import type { MouseEvent }` w FlagBtn.
- `FlagBtn` w tabeli dostaje `disabled={toggleFlaga.isPending}` — blokuje wszystkie flagi tabeli na czas pojedynczej mutacji (jeden hook na tabelę); per-wiersz granulacja wymagałaby zmiany w hooku — odnotowane na przyszłość.

**Świadomie bez akcji:** podwójny `useProjektyData` (D10 — rewizja przy U8), szerokości kolumn z DESIGN.md (kosmetyka), `useLiczniki`, `szukaj` w queryKeys, `<search>` jsdom warning, async `handleSignOut` bez await. RLS hardening → Operator TODO pkt 5 (wyłączyć publiczne signups). E2E Fazy 1 i 2 nadal SKIP — blokada na Operator TODO §110.

### Review Fazy 3 (2026-06-13)

Multi-axis code review (Standards + Spec) — raport: `review-faza-3.md`. Gate: **⚠️ KONTYNUUJ
Z ZASTRZEŻENIAMI** (0× P1, 2× P2 Standards + 0× P2 Spec, ~8× P3). Quality gate zweryfikowany
na żywo: typecheck/lint czyste, test **126/126** (24 pliki), build OK. **Zgodność ze spec: pełna** —
0 błędnych implementacji; podgląd flagi PO zmianie, data pełna w szczegółach, „PRZESŁANY HAFT/SITO",
edycja bez flag (asercja `not.toHaveProperty('rozpisane')`), 4× false dla nowego projektu, „Inne…"→input
zrealizowane wiernie. E2E SKIP (6×, brak `.env`/Supabase, Operator TODO §110).

**Kluczowe wnioski (do naprawy — nie blokują Fazy 4):**
- **`isNotFoundError`** (`ProjektSzczegolyPage.tsx:15-17`) — guard na cichym `unknown`-compare + magic
  string `'PGRST116'`; jawny predykat `error is PostgrestLikeError` + stała + walidacja `:id` jako UUID
  (rozwiązuje też nit: nie-UUID → 404 zamiast generycznego błędu).
- **Kolizja sentinela `'Inne…'`** — wartość jest jednocześnie elementem `KATEGORIE` (config.ts:32) i wartownikiem
  `KATEGORIA_INNE`; edycja rekordu z `kategoria='Inne…'` blokuje submit mimo braku zmian. Praktyczne ryzyko niskie
  (app nigdy nie zapisuje literału). **Decyzja produktowa** — rozdzielić sentinel (`value="__INNE__"`); potwierdzić
  przed zmianą.
- **Czysto:** security (0 XSS, PII auto-escaping, edycja nie dotyka flag, zero `console.*`), performance
  (lazy chunki per-strona zweryfikowane, ConfirmSheet bez timerów, mikro-nity = YAGNI dla 50–150), pokrycie
  testowe (wszystkie scenariusze `Test:` z asercjami zachowania, zero shape/assertion-free testów).
- **Pre-existing / poza zakresem F3:** kategoria-pill hardcoded hexy (U5/U6), `Header` woła `signOut` bezpośrednio,
  rozbieżność copy ConfirmSheet w DESIGN.md vs SPEC (impl poszła za SPEC — poprawnie).

## Źródła
- Specyfikacja funkcjonalna: `SPEC_projekty.md` (v5, root)
- Specyfikacja wizualna: `DESIGN.md` (v5, root)
- Plan: `docs/active/zarzadzanie-projektami/zarzadzanie-projektami-plan.md`
- Zadania: `docs/active/zarzadzanie-projektami/zarzadzanie-projektami-zadania.md`
- Review Fazy 1: `docs/active/zarzadzanie-projektami/review-faza-1.md`
- Review Fazy 2: `docs/active/zarzadzanie-projektami/review-faza-2.md`
- Review Fazy 3: `docs/active/zarzadzanie-projektami/review-faza-3.md`
