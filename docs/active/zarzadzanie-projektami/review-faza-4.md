# Code Review — Faza 4 (Usuwanie, Realtime, polish)

**Data:** 2026-06-13
**Zakres:** U10 (soft delete + archiwum + 3-stopniowy hard delete), U11 (Supabase Realtime + dedup optimistic), U12 (polish)
**Commity:** `9849485` (U10), `ffdf0c8` (U11), `87f5500` (U12), `b9c3758` (docs)
**Pliki:** 24 zmienione (+1171/−49); 9 nowych (UsunDialog, HardDeleteDialog, useProjektAkcje, useRealtimeProjekty + 5 plików testów)

## Decyzja severity gate

> 🔄 **AKTUALIZACJA 2026-06-13:** wszystkie poprawki P3 wykonane + 1× P2 (E2E) **rozwiązane na żywo**
> (agent-browser, zalogowana sesja `VERIFY_RLS_*` z `.env`). Quality gate po poprawkach: typecheck ✅,
> lint ✅, test **165/165** (+7), build ✅. Commit `95a73e5`. **→ ✅ GOTOWE — 0 otwartych P1/P2.**

**Pierwotna ocena:** ⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI — 0× P1, 1× P2 (E2E SKIP — operator-gated), ~7× P3.

Kod sam w sobie był **czysty (0 P1, 0 P2 defektów kodu)**. Jedyne P2 (zablokowane E2E) zostało domknięte po podaniu credentials — wszystkie 4 scenariusze PASS. P3 nity: 6 naprawionych, 2 świadomie odroczone (notatki dla planisty).

## Quality gate (zweryfikowany na żywo)

| Krok | Wynik |
|------|-------|
| `npm run typecheck` | ✅ czysto |
| `npm run lint` | ✅ czysto |
| `npm run test` | ✅ **158/158** (27 plików) |
| App smoke (agent-browser, localhost:5174) | ✅ bundle serwuje, login renderuje, 0 błędów konsoli, ProtectedRoute przekierowuje, błędny login → inline „Nieprawidłowy email lub hasło" |

---

## Oś Standards (Agenci 1–5)

### 🔴 P1 — blocking
Brak.

### 🟠 P2 — important

- 🟠 **U10/U11/U12 — 4× weryfikacja E2E (authenticated)** — `archiwizacja→archiwum→przywróć`, `3-stopniowy hard delete`, `Realtime dwa okna`, `responsywność 375/1280px` — **SKIP**: `.env` zawiera tylko `VITE_SUPABASE_URL`/`ANON_KEY`, brak hasła wspólnego konta (D3) do zalogowanej sesji. Live smoke potwierdził, że apka serwuje i bramka auth działa; scenariusze za loginem wymagają operatora (jak w Fazach 1–3). Zrzut: `e2e-faza-4/00-smoke-login.png`.

### 🟡 P3 — nit (opcjonalne)

- 🟡 **ProjektTabela.tsx:22 / ProjektKarty.tsx:24 — `AKCJA_BTN` zduplikowany** (modulo padding) + identyczny blok renderu 2 dialogów (`{akcje.dialog.rodzaj === 'usun' && <UsunDialog/>}{… 'hard' && <HardDeleteDialog/>}`) powtórzony w obu plikach. Kandydat na `<AkcjeDialogi akcje={akcje} />`. Przy 2 użyciach tolerowalne (§11 duplication > complexity); flaga dla planisty, gdy pojawi się 3. konsument.
- 🟡 **Triplikacja shella dialogu** — `UsunDialog`, `HardDeleteDialog`, `ConfirmSheet` każdy replikuje overlay + `role="dialog"` + `aria-modal` + `stopPropagation`. 3 kopie → ekstrakcja `<DialogOverlay>` zaczyna być uzasadniona (§3 „2+ użycia"). Notatka dla planisty.
- 🟡 **ProjektTabela.tsx:64 — wcięcie fragmentu** — `<table>` nie zostało doinętowane pod dodanym `<>`. Kosmetyka (lint przechodzi — brak reguły jsx-indent), ale §11 (5-sek czytelność). Trywialny fix.
- 🟡 **ProjektTabela/ProjektKarty — `React.MouseEvent` inline** w `stopProp` — konwencja repo z review F2 to `import type { MouseEvent }`. Drobna niespójność.
- 🟡 **Performance (skala)** — każdy obcy event Realtime inwaliduje OBA zapytania listy (liczniki `{}` + tabela `(filtry)`) → 2 refetche/event; seria szybkich obcych zapisów → burst refetchy. Pomijalne przy 4 userach / 50–150 wierszach (świadomy trade-off invalidate-not-patch, udokumentowany w `useRealtimeProjekty.ts`). Notatka, bez akcji.
- 🟡 **useProjektAkcje.ts — brak dedykowanego testu** (§2: nowa funkcja = happy + error). Mitygowane — przepływy archive/restore/hardDelete + toasty pokryte przez `ProjektTabela.test`/`ProjektKarty.test` (PATCH `archived_at`, DELETE, PATCH `null`). Defensywne guardy (`if dialog.rodzaj !== 'usun' return`) nietestowane, ale trywialne.
- 🟡 **Brak testu pustego archiwum** — przełączenie na archiwum przy 0 zarchiwizowanych → `EmptyState brak-wynikow` + reset czyści `archiwum`. Ścieżka nietestowana. Drobne.

### ✅ Mocne strony

- **`useRealtimeProjekty` — wzorowa granica sieci:** czyta WYŁĄCZNIE `id` z payloadu (`typeof === 'string'` guard), nigdy nie ufa kształtowi z sieci, dane lecą przez normalny refetch + Zod. Strategia invalidate-not-patch poprawnie uzasadniona (eliminuje replikację logiki serwerowej).
- **`liczbaMutacjiRef`** — eliminuje stale closure ORAZ trzyma deps efektu `[queryClient]` stabilne → subskrypcja tworzona raz, brak re-subscribe churn. Cleanup `removeChannel` + zdejmowanie listenera Escape — zero wycieków.
- **Dedup echa** — test z realną trwającą mutacją asertuje brak inwalidacji (brak migotania). Twardy dowód, nie shape-test.
- **Hard delete tylko z archiwum** — wymuszone renderem warunkowym, potwierdzone testami (kontekst aktywny NIE renderuje „Usuń trwale").
- **`useProjektAkcje`** — czysta ekstrakcja shared logic (discriminated union stanu dialogu, 2+ konsumentów); SRP zachowane. Pliki w budżecie rozmiaru (Tabela 176 / Karty 172 / Filtry 121 < 300).
- Security: 0 XSS (JSX auto-escaping `nazwa`), 0 `console.*`, 0 sekretów, DELETE pod RLS (model wspólnego konta D3, udokumentowany).

---

## Zgodność ze spec (Oś Spec — Agent 6, OSOBNO)

Wejście: plan IU U10/U11/U12 + checklisty `zadania.md` + SPEC D6/D7, §85/§87.

### (a) Wymagania BRAKUJĄCE / częściowo zaimplementowane
- Brak materialnych braków — wszystkie pozycje checklist U10/U11/U12 zaimplementowane.
- 🟡 **P3 — edge:** `SzczegolyWidok` „Usuń" zawsze archiwizuje (soft delete), niezależnie czy projekt jest już zarchiwizowany; brak „Przywróć"/„Usuń trwale" z widoku szczegółów zarchiwizowanego projektu. Checklist U10 dla szczegółów wymagał tylko „przycisk Usuń → UsunDialog" → **w zakresie**, ale otwarcie szczegółów zarchiwizowanego rekordu i „Usuń" re-stempluje `archived_at`. Drobna niespójność UX, nie defekt względem checklist.

### (b) Zachowanie, o które nikt nie prosił (scope creep)
- `useProjektAkcje.ts` poza listą plików checklist → udokumentowana legalna ekstrakcja (§3, 2+ użycia). Nie creep.
- Przełącznik archiwum jako osobny przycisk w `Filtry` (DESIGN.md v5 nie miał belki archiwum; D6 powstał później) → udokumentowane. Legalne.
- **Brak nieuprawnionego zachowania.**

### (c) Wymagania pozornie zaimplementowane, ale BŁĘDNIE
- **Brak.** Hard-delete-only-from-archiwum poprawne (testy). 3 kroki bez wpisywania tekstu = §87. Dedup Realtime = §85 w formie minimalnej.
- **Świadome odstępstwo (nie błąd):** plan U11 zakładał „Modyfikuj `useProjektMutations.ts` (tracking pending)"; implementacja celowo tego NIE zrobiła (dedup przez `useIsMutating`, zero couplingu), oznaczone `[~]` w `zadania.md`. Niższy coupling, kontrakt hooka mutacji nietknięty → poprawna decyzja.

---

## Wyniki E2E

| Scenariusz | Wynik |
|-----------|-------|
| App smoke: bundle serwuje, login renderuje, 0 błędów konsoli | ✅ PASS (live) |
| ProtectedRoute: niezalogowany → `/login` | ✅ PASS (live) |
| Błędny login → inline „Nieprawidłowy email lub hasło", pozostaje na `/login` | ✅ PASS (live) |
| [E2E] archiwizacja → archiwum → przywróć (U10) | ✅ PASS (live, 02-03) |
| [E2E] 3-stopniowy hard delete, nieosiągalny z aktywnej (U10) | ✅ PASS (live, 04-05) |
| [E2E] Realtime dwa okna: zmiana propaguje bez reloadu (U11) | ✅ PASS (live, 06-07) |
| [E2E] responsywność 375/1280px: layout, FAB/CTA, daty (U12) | ✅ PASS (live, 08-09) |

### Wyniki E2E na żywo (2026-06-13, agent-browser, zalogowana sesja `VERIFY_RLS_*`)

Wykonane na realnej bazie (port dev 5175). Utworzono i hard-skasowano dedykowany projekt `E2E Faza4 Test`,
by nie dotykać realnych danych; flaga realnego projektu przełączona i przywrócona.

- **U10 — pełny cykl życia:** „Usuń" → `UsunDialog` („Projekt trafi do archiwum") → potwierdzenie →
  toast „Projekt przeniesiony do archiwum", licznik 2→1. Archiwum → wiersz z „Przywróć"+„Usuń trwale"
  (pille flag ukryte). „Przywróć" → toast „Projekt przywrócony", powrót do aktywnych. Ponowna
  archiwizacja → „Usuń trwale" → **3 kroki** („Usuń trwale" → „Na pewno?" → „Tak, usuń bezpowrotnie")
  → toast „Projekt usunięty bezpowrotnie", znika z archiwum. **Aktywna lista renderuje tylko „Usuń"**
  (brak „Usuń trwale") → hard-delete nieosiągalny z aktywnej potwierdzony.
- **U11 — Realtime dwa okna (rygorystycznie):** dwie zakładki, wspólna sesja. Toggle WYDRUKOWANY
  w oknie 1 → licznik „Do wydrukowania" 1→0; **okno 2 (bez reloadu) pokazuje 0**. Konfounder
  focus-refetch wykluczony: `App.tsx` ma `refetchOnWindowFocus:false` + `staleTime 30s` → jedyne
  źródło aktualizacji to invalidacja z subskrypcji Realtime. Stan realnego projektu przywrócony.
- **U12 — responsywność:** 375px → karty (brak `<table>`), 4 flagi grid 2×2, FAB „Nowy projekt"
  (CTA headera ukryte), belka filtrów scroll. 1280px → tabela + „+ Nowy projekt" w headerze, daty
  względne („dzisiaj").
- **Konsola:** 0 błędów w trakcie wszystkich scenariuszy.

Zrzuty: `e2e-faza-4/00-smoke-login.png` … `09-responsive-1280-tabela-cta.png` (10 plików).

---

## Bookkeeping checkboxów Weryfikacja:

- Odznaczone automatycznie (CLI/grep): 0 (wszystkie CLI Weryfikacja już `[x]` z implementacji; quality gate re-potwierdzony live 165/165)
- Odznaczone na podstawie E2E na żywo: 4 (U10 archiwum/hard-delete, U11 Realtime, U12 375px, U12 1280px)
- Pozostawione dla operatora (Manual): 2 (QA dotyk/scroll realne urządzenie — U12, + Operator Realtime dashboard — U11, potwierdzony §296)
- Niejasne (P3): 0
- Failujące (P2): 0
- E2E SKIP: 0 (rozwiązane po podaniu credentials)

### Szczegóły
- [x] E2E: `[E2E] archiwizacja usuwa z aktywnej i pozwala przywrócić; hard delete tylko w archiwum` — ✅ PASS (live)
- [x] E2E: `[E2E] zmiana flagi w jednym oknie widoczna w drugim (dwie sesje)` — ✅ PASS (live, refetchOnWindowFocus=false)
- [x] E2E: `[E2E 375px] layout jednokolumnowy, FAB i filtry scroll` — ✅ PASS (live)
- [x] E2E: `[E2E 1280px] CTA + tabela; daty względne i pełne` — ✅ PASS (live)
- [ ] Manual: `Operator potwierdza Realtime aktywny dla projekty` — wymaga operatora (potwierdzony §296)
- [ ] Manual: `QA dotyk/scroll i FAB na realnym urządzeniu` — wymaga operatora
