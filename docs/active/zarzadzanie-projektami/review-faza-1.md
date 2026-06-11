# Code Review — Faza 1 (Fundament): U1 + U2 + U3

**Data:** 2026-06-11
**Branch:** `feature/zarzadzanie-zamowieniami`
**Commity:** `83dc287` (U1), `ceed23f` (U2), `94a8281` (U3), `27296bf` (docs)
**Zakres:** 33 pliki, +1362 linii (scaffolding + schemat/RLS/Realtime + bramka auth)

> Osie review trzymane rozdzielnie: **Standards** (bezpieczeństwo / performance / architektura
> / scenariusze / E2E) oraz **Zgodność ze spec** — celowo nie scalane, by jedna nie maskowała drugiej.

---

## Quality gate (zweryfikowany, nie zadeklarowany)

| Krok | Wynik |
|------|-------|
| `npm run typecheck` | ✅ czysto |
| `npm run lint` | ✅ czysto |
| `npm run test` | ✅ 22/22 zielone (5 plików) |
| `npm run build` | ✅ 1773 moduły, gzip index 121.80 kB |

---

## Decyzja severity gate

**⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× P1, 3× P2 (wszystkie to **zablokowane weryfikacje
E2E**, nie defekty kodu — wymagają środowiska Supabase z TODO operatora), 3× P3 (nity).

Kod Fazy 1 jest solidny i gotowy do kontynuacji (U4 — warstwa danych nie zależy od E2E Fazy 1).
Zastrzeżenie: scenariusze wizualne/E2E muszą zostać uruchomione po wykonaniu Operator TODO
(`.env` + aplikacja migracji + wspólne konto), zanim Faza 1 będzie uznana za w pełni zweryfikowaną.

---

## Standards — skonsolidowane findings

### 🔴 P1 (blocking)
Brak.

### 🟠 P2 (important)

Wszystkie P2 pochodzą z kroku 4.7 (E2E SKIP) — Agent E2E niedostępny, bo **brak `.env` /
projektu Supabase / danych** (Operator TODO z kontekst §110 niewykonane). To **blokada
infrastrukturalna, nie defekt kodu** — żaden kod nie wymaga zmiany; weryfikacje należy
uruchomić po setupie.

- [ ] 🟠 **U1 — `/` ładuje się bez błędów konsoli (agent-browser snapshot)** — SKIP (brak dev env z Supabase)
- [ ] 🟠 **U3 — niezalogowany dostęp do `/` → `/login`** — SKIP (brak dev env z Supabase)
- [ ] 🟠 **U3 — po zalogowaniu `/` osiągalne; po wylogowaniu znów `/login`** — SKIP (brak dev env z Supabase)

### 🟡 P3 (nit)

- [ ] 🟡 **supabase/migrations/0002_rls_policies.sql** — polityki `using(true)`/`with check(true)`
  dla roli `authenticated` dają **pełny CRUD na danych osobowych (`kontakt`, RODO) KAŻDEMU
  użytkownikowi Supabase Auth**, nie tylko wspólnemu kontu zespołu. Bezpieczne *wyłącznie* gdy
  publiczna rejestracja jest wyłączona. → **Dodać do Operator checklist: wyłączyć email signups
  w Supabase Auth** (utwardzenie, nie błąd kodu — model wspólnego konta jest świadomy, D3).
- [ ] 🟡 **src/components/Header.tsx:11, AuthProvider.tsx:18, :21** — zmienne boolean bez prefiksu
  `is`/`has` (`signingOut`, `loading`, `active`) — odstępstwo od coding-rules §7. Kosmetyka.
- [ ] 🟡 **src/pages/LoginPage.tsx:18** — gałąź `if (!email || !password)` („Podaj email i hasło")
  nietestowana i częściowo przesłonięta natywnym `required` na inputach. Defense-in-depth OK,
  ale warto dodać 1 test albo świadomie pozostawić jako obronę programową.

### ⚪ Info (do uwzględnienia w późniejszych IU)

- **Realtime + RLS (U11):** `postgres_changes` egzekwuje RLS przez JWT subskrybenta — `anon`
  nie dostanie eventów, `authenticated` tak. Potwierdzić przy implementacji U11.
- **LoginPage UX:** zalogowany użytkownik wchodzący na `/login` widzi formularz (brak redirectu).
  Kosmetyczne; do rozważenia przy domykaniu UX po-logowania.
- **Bundle:** główny vendor chunk 121.80 kB gzip (React + Supabase + RQ + Router) — akceptowalne
  na tym etapie; lazy-routing już zastosowany.

### Performance — bez zastrzeżeń
Lazy routes ✅, React Query `staleTime: 30s` + `refetchOnWindowFocus: false` ✅,
cleanup `useEffect` w `AuthProvider` (flaga `active` + `unsubscribe`) ✅. Brak N+1, brak pętli z fetchem.

### Architektura / type-safety — czysto
Wszystkie pliki < 300 linii, funkcje < 50, zero `any` w kodzie produkcyjnym (testy: `as unknown as
Session` na fixturach — dopuszczalne). Rozdzielenie `auth-context.ts` od `AuthProvider.tsx`
(wymóg `react-refresh/only-export-components`) — dobry wzorzec. `FlagaKey = Flaga['key']` wyprowadzony
z configu (single source). Grupowanie importów spójne.

### E2E (Agent 5) — SKIPPED
Brak `.env`, projektu Supabase i danych testowych (Operator TODO, kontekst §110). Wszystkie
checkboxy `[E2E]` Fazy 1 pozostają niezaznaczone. Uruchomić po setupie operatora.

---

## Zgodność ze spec (oś osobna — Agent 6)

Źródła: `SPEC_projekty.md` v5 + Implementation Units U1/U2/U3 z planu.

**(a) Wymagania brakujące / częściowe:** Brak dla Fazy 1. `shadcn/ui` świadomie odroczony
(plan dopuszczał — init w pierwszym IU UI, U5/U7).

**(b) Scope creep (czego nikt nie prosił):** Brak istotnego. Montaż `Header` w `ListaPage.tsx`
(U3) jest minimalny i uzasadniony (osiągalność wylogowania) — w granicach „Modyfikuj/utwórz Header".
Implementacja jest wręcz powściągliwa (placeholdery stron naprawdę minimalne).

**(c) Wymagania zaimplementowane błędnie:** Brak. Cross-check 1:1:
- `KATEGORIE` — 21 pozycji + „Inne…" zgodnie ze SPEC (linie 81–85). ✅
- `OSOBY` — `['Ania','Bartek','Kasia','Marek']` zgodnie ze SPEC (linia 77, placeholdery). ✅
- `FLAGI` — kolejność + `key`/`label`/`filterLabel`; `przeslany.columnLabel='Przesłany haft/sito'`
  zgodnie ze SPEC (linie 89–91, 50). ✅
- Schemat: `rozpisane`/`przeslany`/`sprawdzony`/`wydrukowany` boolean default false, `kontakt`,
  `uwagi`, `dodal not null` zgodnie ze SPEC (linie 48–56) + `archived_at` (D6, świadome odstępstwo). ✅
- Nieaktualna sekcja SPEC „API Routes Next.js" (linia 108) **poprawnie pominięta** — D1/D2
  (CRUD front→Supabase, bez API routes). ✅

**⚪ Info:** `OSOBY`/`KATEGORIE` to wciąż wartości-placeholdery — operator musi je sfinalizować
przed deployem (już śledzone w kontekst §78).

---

## Bookkeeping checkboxów Weryfikacja:

- Odznaczone automatycznie (CLI/grep): 0 (wszystkie CLI Fazy 1 już `[x]` — potwierdzone ponownym uruchomieniem: typecheck/lint/test/build zielone)
- Odznaczone na podstawie Agent 5 E2E: 0
- Pozostawione dla operatora (Manual): 3
- Niejasne (P3): 0
- E2E SKIP (P2): 3

### Szczegóły
- [ ] E2E SKIP: `[E2E] / ładuje się bez błędów konsoli (agent-browser snapshot)` (U1) — brak dev env (P2)
- [ ] E2E SKIP: `[E2E] niezalogowany dostęp do / przekierowuje na /login` (U3) — brak dev env (P2)
- [ ] E2E SKIP: `[E2E] po zalogowaniu / osiągalne; po wylogowaniu znów /login` (U3) — brak dev env (P2)
- [ ] Manual: `anon-key SELECT zwraca pustą tablicę lub błąd uprawnień` (U2) — wymaga operatora (`verify-rls.mjs`)
- [ ] Manual: `authenticated SELECT/INSERT/UPDATE/DELETE bez błędu RLS` (U2) — wymaga operatora
- [ ] Manual: `4 kolumny flag + archived_at istnieją w schemacie` (U2) — wymaga operatora (`verify_rls.sql`)

---

## Statystyki

- Plików sprawdzonych: 33
- 🔴 blocking: 0
- 🟠 important: 3 (E2E SKIP — blokada infrastrukturalna)
- 🟡 nit: 3
- ⚪ info: 4
- 🌐 E2E: 0 passed / 0 failed / 3 skipped
- ☑️ Weryfikacja: 0 auto / 0 E2E / 3 manual / 0 niejasne / 3 E2E-skip(P2)
- 📋 Zgodność ze spec: 0 braków / 0 scope creep / 0 błędnie zaimplementowane
