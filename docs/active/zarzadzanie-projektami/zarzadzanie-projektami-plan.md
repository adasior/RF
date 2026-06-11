# Plan: System zarządzania projektami odzieżowymi (firma odzieżowa) — MVP

**Branch:** `feature/zarzadzanie-zamowieniami` (nazwa zachowana dla ciągłości git)
**Ostatnia aktualizacja:** 2026-06-10

## Cele i zakres

Wewnętrzne narzędzie dla 4-osobowego biura firmy odzieżowej (hafty, sitodruk, sublimacja),
zastępujące arkusz Google Sheets. Wspólna baza projektów dostępna z desktopa i mobile,
z szybkim dodawaniem z telefonu, czytelną tabelą oraz **klikalnymi flagami** — zmianą stanu
jednym kliknięciem. Trzy priorytety (za SPEC): szybkie dodanie z telefonu, tabela z klikalnymi
flagami na desktopie, filtry „co do zrobienia".

**Model stanu (D4):** zamiast jednego statusu głównego — **4 niezależne flagi boolean**:
`rozpisane`, `przeslany` (Przesłany haft/sito), `sprawdzony`, `wydrukowany`. Nowy projekt
startuje z czterema flagami `false`.

**Stack (D1):** Vite SPA + React 19 + TypeScript + TailwindCSS v4 + shadcn/ui + Supabase.
CRUD idzie bezpośrednio front→Supabase pod RLS — bez API Routes / Edge Functions (D2).

**Skala:** ~50–150 projektów/mies. Pole `kontakt` = dane osobowe (RODO), więc aplikacja
nie może być publiczna (D3).

### Poza zakresem (granice scope'u)

- Brak statusu głównego, numerów ZAM-XXX w UI, terminów, kanbana, osób na liście (D8).
  (Osoba = „Dodał", widoczna tylko w szczegółach.)
- Brak per-user auth — jedna wspólna bramka; tożsamość samodeklarowana w polu `dodal`.
- Brak historii zmian, rozwiązywania konfliktów (last-write-wins), załączników, powiadomień,
  eksportu PDF.
- Faza 2 SPEC (nie teraz): opcjonalny PIN 4-cyfrowy w localStorage.

### Świadome odstępstwa od SPEC_projekty.md

SPEC v5 opisuje stack Next.js + brak auth + prosty delete + nie wspomina Realtime. Na podstawie
ustaleń z użytkownikiem (2026-06-10) utrzymujemy wcześniejsze decyzje architektoniczne:

- **D1** — Vite SPA zamiast Next.js (tooling repo + skille pod Vite).
- **D3** — Supabase Auth + RLS zamiast „bez auth" (RODO: pole `kontakt`).
- **D6** — soft-delete/archiwum + 3-stopniowy hard delete zamiast prostego delete (bezpieczeństwo).
- **D7** — Realtime sync (praca równoległa 4 osób).

## Kluczowe decyzje techniczne

- Tokeny designu w `@theme {}` (Tailwind v4 CSS-first), nie `tailwind.config.js` — port 1:1 z `DESIGN.md` v5.
- 4 niezależne flagi boolean; toggle desktop natychmiastowy (optimistic), mobile = bottom sheet `ConfirmSheet` (D5).
- Wykrywanie mobile: `matchMedia('(max-width: 767px)')` (`useIsMobile`), nie user-agent.
- Bramka = Supabase Auth (jedno wspólne konto) + RLS `authenticated`-only (deny-all dla `anon`).
- Soft delete = `archived_at TIMESTAMPTZ NULL`; hard delete = realny `DELETE` tylko z widoku archiwum.
- Data layer = React Query (TanStack) + zapytania Supabase w `src/hooks/*Data.ts`; walidacja Zod na granicy; RHF + Zod w formularzach.
- Routing = React Router v7: `/login`, `/`, `/nowy`, `/projekt/:id`, `*`/404.
- Filtry = 5 linków z licznikami (Wszystkie / Do rozpisania / Do przesłania / Do sprawdzenia / Do wydrukowania) + pole szukaj po nazwie; liczniki liczone client-side (D10).
- Kategoria = natywny `<select>`; „Inne…" → input tekstowy (D9).
- Toasty = Sonner; ikony = Lucide React.
- Realtime: subskrypcja `postgres_changes` patchuje cache React Query; dedup własnego echa optimistic (algorytm dostrajany w U11).
- Package manager = npm.

## Fazy i zadania (Implementation Units)

Szczegółowe pliki, podejście, scenariusze testowe i weryfikacja — jako checkboxy w
`zarzadzanie-projektami-zadania.md`.

### Faza 1 — Fundament
- **Unit 1** — Scaffolding projektu + design system (`DESIGN.md` v5) + config (OSOBY/KATEGORIE/FLAGI) + routing shell. *(brak zależności)*
- **Unit 2** — Schemat bazy (`projekty` + 4 flagi + `archived_at`) + migracja + RLS + Realtime. *(zal. U1)*
- **Unit 3** — Bramka dostępu (Supabase Auth + chronione trasy). *(zal. U1, U2)*

### Faza 2 — Dane + widok główny desktop
- **Unit 4** — Warstwa dostępu do danych: schematy Zod + hooki React Query (lista/pojedynczy/mutacje, w tym `toggleFlaga`). *(zal. U1, U2, U3)*
- **Unit 5** — Tabela desktop + `FlagBtn` z optimistic toggle (desktop natychmiastowy) + przygaszanie (4× true) + empty state. *(zal. U4, U3)*
- **Unit 6** — Belka filtrów z licznikami + wyszukiwarka po nazwie. *(zal. U4, U5)*

### Faza 3 — Formularz, mobile, szczegóły
- **Unit 7** — Formularz nowego projektu (kategoria natywna + „Inne…", `OsobaSegmented`, bez flag). *(zal. U4, U1)*
- **Unit 8** — Karty mobile 2×2 + `ConfirmSheet` (bottom sheet potwierdzenia na mobile) + FAB. *(zal. U5, U6)*
- **Unit 9** — Widok szczegółów + edycja + strona 404 projektu. *(zal. U4, U5, U7)*

### Faza 4 — Usuwanie, Realtime, polish
- **Unit 10** — Soft delete + archiwum + przywracanie + 3-stopniowy hard delete. *(zal. U4, U6, U9)*
- **Unit 11** — Synchronizacja na żywo (Supabase Realtime) + dedup optimistic. *(zal. U4, U2, U5/U8)*
- **Unit 12** — Polish: daty względne, toasty, empty states, dopięcie responsywności mobile. *(zal. U5, U6, U7, U8, U10)*

## Kryteria akceptacji (poziom feature)

- Dodanie projektu z telefonu < ~30 s (jeden ekran, minimum pól wymaganych: nazwa, kategoria, dodał).
- Zmiana flagi na desktopie = jedno kliknięcie, natychmiastowy efekt wizualny (optimistic) + toast „ROZPISANE: TAK/NIE".
- Na mobile zmiana flagi przechodzi przez bottom sheet potwierdzenia (ochrona przed przypadkowym dotykiem).
- Filtry „co do zrobienia" z licznikami aktualizowanymi po każdej zmianie flagi; po zaznaczeniu flagi w aktywnym filtrze projekt znika z listy.
- Wiersz/karta z 4 flagami = true → `opacity 0.4`.
- Cały zespół widzi zmiany na żywo (Realtime) bez ręcznego odświeżania.
- Zero przypadkowej bezpowrotnej utraty — „Usuń" archiwizuje; hard delete wymaga wejścia do archiwum + potwierdzenia.
- Aplikacja niedostępna bez zalogowania; anon key nie odsłania danych (RLS deny-all dla `anon` — dowód skryptem).
- `npm run typecheck` / `npm run lint` / `npm run test` zielone; `npm run build` przechodzi.

## Ryzyka i mitygacje

- **Reconciliacja optimistic ↔ Realtime (U11)** — najtrudniejsze; ryzyko migotania UI. Mitygacja: zacząć od integration testu z echem własnej zmiany; dedup po `updated_at`/pending IDs.
- **RLS musi realnie blokować anon (U2/D3)** — RODO. Mitygacja: twardy skrypt z anon key, nie sama obecność polityki.
- **Tailwind v4 CSS-first** — ryzyko rozjazdu tokenów (config v3 w `DESIGN.md` → `@theme`). Mitygacja: tokeny 1:1, flagi/kategorie jako mapy.
- **Liczniki filtrów vs filtrowane zapytanie (U6/D10)** — licznik musi liczyć z pełnego (niefiltrowanego flagą) zbioru aktywnych projektów, nie z aktualnie widocznej listy. Mitygacja: osobne źródło dla liczników.
- **Mobile bottom sheet vs desktop immediate (U5/U8/D5)** — rozjazd przy zmianie szerokości okna. Mitygacja: `matchMedia` reaktywnie, jedna ścieżka mutacji dla obu.
- **Konto wspólne Supabase + wartości config (OSOBY/KATEGORIE)** — kroki operatora; gotowe przed deployem/E2E.

## Szacunki nakładu

| Unit | Nakład | Unit | Nakład |
|------|--------|------|--------|
| U1 | L | U7 | M |
| U2 | S | U8 | L |
| U3 | M | U9 | M |
| U4 | L | U10 | M |
| U5 | L | U11 | L |
| U6 | M | U12 | M |

## Źródła
- Specyfikacja funkcjonalna: `SPEC_projekty.md` (v5, root)
- Specyfikacja wizualna: `DESIGN.md` (v5, root)
- Kontekst: `docs/active/zarzadzanie-projektami/zarzadzanie-projektami-kontekst.md`
- Zadania: `docs/active/zarzadzanie-projektami/zarzadzanie-projektami-zadania.md`
