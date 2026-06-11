# Review Fazy 2 — Dane + widok główny desktop (U4/U5/U6)

**Data:** 2026-06-11
**Zakres diffu:** `git diff 27296bf..HEAD -- src/` (25 plików, +1968/−17)
**Branch:** `feature/zarzadzanie-zamowieniami`
**Metoda:** multi-agent (6 osi: Security, Performance, Architecture+TS, Scenario/Test-coverage, E2E, Spec)

## Quality gate (zweryfikowany na żywo)

| Krok | Wynik |
|------|-------|
| `npm run typecheck` | ✅ exit 0 |
| `npm run test` | ✅ 69/69 (13 plików) |
| `npm run lint` | ✅ exit 0 |

## Severity gate: ⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI

- 🔴 P1-blocking: **0**
- 🟠 P2-important: **9** (oś Standards) + **1** (oś Spec, scope creep „legalny")
- 🟡 P3-nit: **~13**

Brak blokerów. Większość P2 to spójność z `coding-rules` (Zod na granicy, dedup, naming) oraz brakujące testy nowych jednostek — do uprzątnięcia, ale nie blokują Fazy 3.

---

## Oś Standards (Agenci 1–5)

### 🟠 P2-important

1. 🟠 **`src/hooks/useProjektyData.ts:26`** — wildcard/LIKE injection w `ilike('nazwa', \`%${szukaj}%\`)`. To **nie** SQL injection (query builder parametryzuje), ale znaki `%`/`_` z pola „Szukaj" stają się metaznakami wzorca → degradacja filtra + teoretyczny koszt pattern-matchingu. `szukaj` nie przechodzi przez żaden Zod. **Fix:** escapuj `[\\%_]` przed interpolacją + limit długości (`szukaj.max(200)` spójnie z resztą granicy).

2. 🟠 **`useProjektData.ts:22` / `useProjektyData.ts:35` / `useProjektMutations.ts:55,82`** — odpowiedzi z Supabase rzutowane `as Projekt[]` / `as Projekt` zamiast `projektSchema.parse(...)`. `projektSchema` istnieje i jest przetestowany, ale **nieużywany na granicy** → martwy kod produkcyjny + naruszenie coding-rules §10 („Zod na granicach systemu", „NIGDY type assertions"). Odpowiedź z REST to granica systemu. **Fix:** `projektSchema.array().parse(data ?? [])` / `projektSchema.parse(data)` — eliminuje wszystkie `as Projekt`. *(Security zgłosił jako P3, Architecture jako P2 — dedup do P2.)*

3. 🟠 **`useProjektMutations.ts`** (6×: `:121,134,165,186,197,208`) — wzorzec `onError: (e) => { toast.error(...); throw e; }`. Re-throw z `onError` produkuje unhandled rejection przy `mutate` bez własnego `onError`, co wymusza obronny `onError: () => {}` u konsumenta (`ProjektTabela.tsx:41`). UI reaguje na błąd przez stan mutacji (`isError`), nie przez wyjątek. **Fix:** usuń `throw error`, zostaw sam toast.

4. 🟠 **`useProjektyData.ts:8` / `useProjektData.ts:8` / `useProjektMutations.ts:10`** — identyczny 13-kolumnowy string `KOLUMNY` skopiowany 3× (coding-rules §3). Dodanie kolumny = edycja w 3 miejscach. **Fix:** wyciągnij `export const PROJEKT_KOLUMNY = '…' as const`.

5. 🟠 **`useProjektMutations.ts:176-178`** — `onSettled` toggla invaliduje tylko `queryKeys.listy()`, mimo że `onMutate` patchuje też `projekt(id)` optimisticznie. Detal nie jest invalidowany → możliwy rozjazd + przy szybkich togglach race (refetch z nieaktualnym stanem). **Fix:** dorzuć `invalidateQueries({ queryKey: queryKeys.projekt(id) })` w `onSettled`.

6. 🟠 **`ListaPage.tsx:24,28`** — podwójny `useProjektyData({})` + `useProjektyData(filtry)` = 2 osobne zapytania do Supabase (różne queryKey, brak reuse cache). **Świadoma decyzja D10** (liczniki z pełnego zbioru, niezależne od filtra) — Performance i Spec potwierdzają poprawność; przy 50–150 wierszach koszt pomijalny. Architecture sugeruje rozważyć filtrowanie flagi/szukaj client-side z jednego datasetu **przed** dorzuceniem kart mobile (U8), by nie utrwalać wzorca. Klasyfikacja: P2 jako punkt decyzyjny, **nie defekt** — opcjonalna optymalizacja.

7. 🟠 **`ProjektTabela.test.tsx`** — brak asercji, że nagłówek kolumny renderuje `flaga.columnLabel ?? flaga.label` (druga flaga = „Przesłany haft/sito"). Jedyna logika warunkowa nagłówków niepokryta — regresja w `??` przeszłaby niezauważona. **Fix:** `expect(screen.getByText('Przesłany haft/sito')).toBeInTheDocument()`.

8. 🟠 **`useIsMobile.ts`** — nowy hook z subskrypcją `matchMedia` + `addEventListener('change')` + cleanup, **bez testu** (coding-rules §2: min 1 happy + 1 edge na nową funkcję). Uwaga: hook jeszcze niekonsumowany (konsumpcja w U8) — alternatywnie przenieść jego powstanie do U8. **Fix:** test z mockiem `window.matchMedia` (reaktywność + `removeEventListener` na unmount).

9. 🟠 **`EmptyState.tsx`** — komponent z logiką wyboru wariantu (`brak-projektow` vs `brak-wynikow`, różne ikony/CTA) **bez pliku testowego**; scenariusze E2E są SKIP. **Fix:** `EmptyState.test.tsx` — wariant → tekst CTA + klik woła `onAction`.

### 🟡 P3-nit

- 🟡 **`queryKeys.ts:23`** — `szukaj` (potencjalnie fragment PII) osadzony w query key / Devtools. Tylko klient zalogowanego usera, ryzyko minimalne.
- 🟡 **`Header.tsx:15-24,41`** — `async handleSignOut` wołany bez `await` w `onClick`; funkcja sama łapie błąd `signOut()`, więc w praktyce OK.
- 🟡 **`useProjektData.ts:29` / `useProjektyData.ts:43` / `useProjektMutations.ts:113`** — brak explicit return type na publicznych hookach danych (coding-rules §10); `useFiltry`/`useIsMobile` mają — niespójność w tym samym PR.
- 🟡 **`useProjektData.ts:32`** — `pobierzProjekt(id as string)` — `as` do obejścia (mimo `enabled: Boolean(id)`). Czystsze: guard albo id z `queryKey`.
- 🟡 **`FlagBtn.tsx:44`** — `React.MouseEvent` bez importu (działa dzięki global types); reszta repo używa `import type { … } from 'react'`. Spójność: `import type { MouseEvent }`.
- 🟡 **`ProjektTabela.tsx:32-45`** — `handleToggle(...)` to **factory** zwracający handler, nie event handler → prefix `handle` myli (coding-rules §7) + brak return type. Lepsza nazwa: `makeToggleHandler`.
- 🟡 **`Filtry.tsx:44-53`** — komponent oznaczony „czysto prezentacyjny" zawiera logikę liczenia liczników (`projekty.filter(...).length`). Przy 5 pozycjach OK; gdyby rosło — `useLiczniki(projekty)`.
- 🟡 **`ProjektTabela.tsx:48`** — inline `style={{ tableLayout:'auto' }}` / `minWidth` tworzą nowy obiekt na render (mikronarzut).
- 🟡 **`useProjektMutations.ts:144`** — `cancelQueries({ queryKey: queryKeys.all })` szersze niż `listy()` (celowe — detal też patchowany). OK, odnotowane.
- 🟡 **`ListaPage.tsx:33,58-63`** — logika `isFiltrAktywny` (wariant EmptyState + reset vs nawigacja) bez weryfikacji (unit ani E2E — E2E SKIP). Lekki render-test z mockiem `useProjektyData`→`[]` + aktywny filtr.
- 🟡 **`Filtry.tsx:78`** — natywny `<search>` nierozpoznawany przez jsdom → warning w stderr testów (kosmetyka).
- 🟡 **`ProjektTabela.test.tsx:89`** — nazwa testu „desktop: … bez ConfirmSheet" sugeruje rozgałęzienie desktop/mobile, którego w tym (czysto desktopowym) komponencie nie ma. Czysto nazewnicze.

---

## Zgodność ze spec (Agent 6 — oś osobna)

Werdykt: **zgodność wysoka, 0 błędnych implementacji.** Kluczowe D5 i D10 zrealizowane wiernie.

### (a) Brakujące / częściowe
- 🟡 **P3 `ProjektTabela.tsx:48`** — `DESIGN.md:162-169` podaje szerokości kolumn (Kategoria 106px, Kontakt 90px, Dodano 76px prawostronnie); implementacja używa `tableLayout:'auto'` bez szerokości. Zgodne z literą („table-layout:auto"), ale pomiary DESIGN pominięte. Kosmetyczne.
- 🟡 **P3 `ProjektTabela.tsx:88-93`** — `FlagBtn` nie dostaje `disabled` podczas `toggleFlaga.isPending` → możliwy double-click/wyścig na jednym wierszu. `FlagBtn` ma już prop `disabled` (niepodpięty). SPEC tego wprost nie wymaga.

### (b) Scope creep
- 🟠 **P2 `useProjektMutations.ts:181-212`** — `archive`/`restore`/`hardDelete` należą do Fazy 4 / U10 (plan:79), ale **checklist U4 (zadania:132) wprost je wymienia** → wyprzedzenie **dozwolone wg pliku zadań**. Plan-poziom (U4 = „mutacje… w tym `toggleFlaga`") tego nie przewidywał. Niska szkodliwość (warstwa danych bez UI). Odnotowane, nie wymaga akcji.
- 🟡 **P3 `useProjektData.ts` + patch `queryKeys.projekt(id)` w toggleFlaga** — widok detalu to U9 (Faza 3), ale `useProjektData` jest w checkliście U4 (zadania:131); optimistic patch detalu tani i spójny. Dozwolone — „kod aktywny zanim istnieje konsument".

### (c) Błędnie zaimplementowane
**Brak (0).** Zweryfikowane jako POPRAWNE:
- ✅ **D10** — liczniki z pełnego zbioru aktywnych (`ListaPage.tsx:24` osobny `useProjektyData({})` → `Filtry.tsx:49`), nie z przefiltrowanej listy.
- ✅ **D5** — toggle desktop natychmiastowy (`ProjektTabela.tsx:34-43` → `mutate` bez ConfirmSheet, optimistic + toast).
- ✅ **AND filtrów** — `.eq(flaga,false)` + `.ilike('nazwa',…)` na jednym query (PostgREST = AND).
- ✅ **Sortowanie** — `created_at desc` + `archived_at is null` domyślnie.
- ✅ **opacity 0.4** — `isKompletny = FLAGI.every(...)` → `opacity-40` (DESIGN:151).
- ✅ **Toast** — `"ROZPISANE: TAK/NIE"` zgodny z DESIGN:439.

---

## Odchylenia od planu

- **Brakujące pliki testowe (vs coding-rules §2, nie vs explicit `Pliki: Test:` w planie):** `useIsMobile.test.ts`, `EmptyState.test.tsx` — patrz Standards P2 #8/#9.
- **`Delegate to:` w IU:** U4 `feature-builder-data`, U5/U6 `feature-builder-ui` — zgodne z faktyczną kategorią plików. Brak niezgodności.
- **shadcn/ui niezainicjalizowany** (U5) — plan dopuszczał pominięcie; prymitywy proste. Bez zmiany scope.
- **Warstwa danych Fazy 4** (archive/restore/hardDelete) powstała w U4 — patrz Spec (b).

---

## E2E (Agent 5)

**SKIP — środowisko bez `.env`/projektu Supabase.** Wszystkie scenariusze E2E Fazy 2 (optimistic toggle przed/po, przygaszenie 4×true, empty state, liczniki/filtry/reset) wymagają realnego backendu. Uruchomić po wykonaniu Operator TODO (kontekst §110): setup Supabase + `.env` + migracje + konto zespołu.

---

## Bookkeeping checkboxów Weryfikacja:

- Odznaczone automatycznie (CLI/grep): **0** (wszystkie CLI `Weryfikacja:` U4/U5/U6 były już `[x]` — potwierdzone na żywo: typecheck/test 69/69/lint zielone)
- Odznaczone na podstawie Agent 5 E2E: **0**
- Pozostawione dla operatora (Manual): **0**
- Niejasne (P3): **0**
- E2E SKIP (Agent 5 niedostępny): **4** → zarejestrowane jako 🟠 [P2-important] (zablokowane na infrastrukturze, nie defekty kodu)

### Szczegóły
- [x] CLI: `npm run typecheck` / `lint` / `test` (U4, U5, U6) → PASS (potwierdzone: 69/69)
- [ ] E2E: `[E2E] optimistic zmiana flagi widoczna natychmiast + toast` (U5) — SKIP (Agent 5 niedostępny: brak `.env`/Supabase)
- [ ] E2E: `[E2E] wiersz z 4 flagami true przygaszony` (U5) — SKIP (brak `.env`/Supabase)
- [ ] E2E: `[E2E] empty state widoczny przy braku danych` (U5) — SKIP (brak `.env`/Supabase)
- [ ] E2E: `[E2E] liczniki aktualizują się po każdej zmianie flagi; aktywny filtr zawęża listę; reset działa` (U6) — SKIP (brak `.env`/Supabase)
