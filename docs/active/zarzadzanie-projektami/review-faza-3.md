# Review Fazy 3 — Formularz, mobile, szczegóły (U7/U8/U9)

**Data:** 2026-06-13
**Zakres:** `git diff be9b273 HEAD -- src/` (commity `efdec76` U7, `f907ed6` U8, `cd4d675` U9, `8042f06` docs)
**Metoda:** multi-agent review — oś Standards (5 agentów: security, performance, architektura/TS, scenariusze/testy, E2E) + oś Spec (osobno).
**Plan techniczny:** brak osobnego `docs/plans/` dla projektów — źródłem prawdy plan + zadania w folderze zadania (`zarzadzanie-projektami-plan.md`, `-zadania.md`) oraz `SPEC_projekty.md` v5 / `DESIGN.md` v5.

---

## Severity gate

⚠️ **KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× 🔴 P1, **2× 🟠 P2** (oba architektura/TS), kilka 🟡 P3.

Quality gate zweryfikowany na żywo (2026-06-13):
- `npm run typecheck` → **exit 0** ✅
- `npm run test` → **126/126** (24 pliki) ✅
- `npm run lint` → **exit 0** ✅

Żaden P2 nie blokuje kontynuacji do Fazy 4 — oba to izolowane usprawnienia poprawności w ścieżce 404/edycji, nieleżące na krytycznej drodze U10/U11/U12.

---

## Statystyki

| Oś | 🔴 P1 | 🟠 P2 | 🟡 P3 |
|----|------|------|------|
| Standards (sec/perf/arch/test/E2E) | 0 | 2 | 5 |
| Spec (zgodność z planem/SPEC/DESIGN) | 0 | 0 | 3 |

- Plików produkcyjnych w przeglądzie: 12 (+11 testów)
- 🌐 E2E: 0 passed / 0 failed — **6× SKIP** (brak `.env`/Supabase/dev servera; Operator TODO §110)
- Pokrycie testowe: kompletne względem zadeklarowanych scenariuszy `Test:` (bez E2E/Manual); zero assertion-free / shape-testów / osłabionych asercji.

---

## Oś Standards

### 🟠 P2 — do naprawy

**1. `src/pages/ProjektSzczegolyPage.tsx:15-17` — type guard `isNotFoundError` opiera się na cichym `unknown`-compare i magic stringu**

```ts
function isNotFoundError(error: Error): boolean {
  return 'code' in error && error.code === 'PGRST116';
}
```

`error` jest typu `Error`; `'code' in error` zawęża `error.code` do `unknown`, a porównanie do `'PGRST116'` przechodzi mimo że typ `Error` nie gwarantuje pola `code`. To NIE jest `any` (reguła #10 formalnie niezłamana), ale guard zależy od kształtu błędu PostgREST poza systemem typów, a `'PGRST116'` to magic string (reguła #6).
**Rekomendacja:** jawny predykat `error is PostgrestLikeError` (`typeof === 'object'` + `error !== null` + `'code' in error` + porównanie) i wyciągnięcie stałej `POSTGREST_NO_ROWS = 'PGRST116'`. Czyni z kodu 404 świadomy kontrakt zamiast zaufania do nieudokumentowanego kształtu.
> Powiązane: security-nit poniżej (niezwalidowany `:id`) — najtaniej naprawić oba razem (pre-check `z.string().uuid().safeParse(id)` przed zapytaniem).

**2. `src/features/projekty/components/ProjektForm.tsx:60-72` + `src/lib/config.ts:32` — kolizja sentinela `'Inne…'` z wartością listy `KATEGORIE`**

`'Inne…'` jest jednocześnie ostatnim elementem `KATEGORIE` (`config.ts:32`) ORAZ wartownikiem `KATEGORIA_INNE` sterującym widocznością inputu własnej kategorii. W trybie `edit`, dla rekordu z `kategoria` równą dosłownie `'Inne…'`: `isZnanaKategoria` → `true`, więc `kategoriaInna` zostaje `''`, a `superRefine` (`:38-46`) zablokuje submit komunikatem „Podaj kategorię" mimo że użytkownik „niczego nie zmieniał".
**Praktyczne prawdopodobieństwo:** niskie — `toInput` (`:50-57`) nigdy nie zapisuje literału `'Inne…'` do bazy (mapuje na wpisaną wartość), więc kolizja jest osiągalna tylko przez ręczne zaseedowanie / migrację danych. Brak cichego zapisu pustej wartości (superRefine łapie).
**Rekomendacja (decyzja produktowa — NIE naprawiać autonomicznie, reguła #5):** rozdzielić sentinel od wartości danych — `<option value="__INNE__">Inne…</option>`, by `KATEGORIE.includes(kategoria)` i logika wartownika przestały na siebie nachodzić. Wymaga koordynacji z `config.ts`.

### 🟡 P3 — opcjonalne

- 🟡 **`src/pages/ProjektSzczegolyPage.tsx:27` (security)** — `:id` z URL trafia bez walidacji do `useProjektData(id)` → `.eq('id', id)`. Dla nie-UUID PostgREST zwraca błąd `22P02` (nie `PGRST116`), więc podrobiony link ląduje w generycznej gałęzi „Nie udało się wczytać" zamiast na `NotFoundPage`. To nie jest dziura bezpieczeństwa (RLS + parametryzacja PostgREST eliminują SQLi; wartość nigdy nie jest konkatenowana) — wyłącznie mylący UX. Fix: `z.string().uuid().safeParse(id)` → przy porażce `NotFoundPage`. Łączy się z P2 #1.
- 🟡 **`src/pages/NowyProjektPage.tsx:1-2` (arch)** — kolejność importów third-party: `sonner` przed `react-router-dom` (alfabetycznie odwrotnie). Trywialny fix; pozostałe pliki Fazy 3 trzymają porządek.
- 🟡 **`ProjektKarty.test.tsx` / `SzczegolyWidok.test.tsx` (test)** — ścieżka mobile „Tak, zmień" asertuje fakt wysłania PATCH + toast, ale nie treść body (`{key: nowaWartosc}`). Asercja na body byłaby mocniejsza („ta sama ścieżka co desktop", U8:280). Nie luka zachowania — optimistic/rollback pokryte w `useProjektMutations.test.ts` (U4).
- 🟡 **`SzczegolyWidok.tsx:115`, `ProjektKarty.tsx:70`, `ProjektTabela.tsx:77` (arch)** — „kategoria-pill" z hardcodowanymi hexami (`#DDD7CC`/`#F0EDE7`/`#6B6354`) powtórzona 3×, nie tokeny `@theme`. **Pre-existing z U5/U6** — F3 kontynuuje konwencję, nie regresja. Kandydat na token `--color-pill-*` + `<KategoriaPill>` poza zakresem F3.
- 🟡 **`src/components/Header.tsx:22` (arch)** — `Header` woła `supabase.auth.signOut()` bezpośrednio (warstwa serwisu w komponencie). **Pre-existing** (diff U8 dodał tylko gałąź `isMobile ? <Fab/> : <CTA/>`, nie tknął `handleSignOut`). Do rozważenia przeniesienie do `useAuth().signOut()` dla spójności — poza zakresem U7-U9.

### Performance — czysto
Brak N+1 (komponenty F3 nie robią własnych zapytań; toggle = 1 UPDATE). Lazy loading per-strona zweryfikowany w buildzie (`ProjektForm` 36 kB i `ConfirmSheet` 14 kB w osobnych chunkach on-demand, nie obciążają listy). `ConfirmSheet` bez `useEffect`/timerów (animacja czysto CSS) — nic do sprzątania. `useIsMobile` ma poprawny `removeEventListener`. Ternary `isMobile ? karty : tabela` renderuje jeden wariant. Mikro-nity (inline arrow w `ProjektKarty:88`, globalny `disabled={isPending}`) — **YAGNI dla skali 50–150**, reguła #12 „nie optymalizuj przedwcześnie"; bez akcji.

### Security — czysto
Zero `dangerouslySetInnerHTML`/`innerHTML`/`javascript:` w całym `src`. Cała warstwa PII (`nazwa`/`uwagi`/`kontakt`/`dodal`/`kategoria`) renderowana jako text-children JSX (auto-escaping React). Zero `console.*`, zero logowania PII; błędy mutacji generalizowane do stałego toastu (bez treści rekordu). Brak ekspozycji kluczy / `import.meta.env` w plikach F3. Kontrakt „edycja nie dotyka flag" trzyma się end-to-end (`ProjektForm` bez pól flag → `update` warunkowo dokłada flagi tylko gdy `!== undefined` → formularz ich nie wysyła). Walidacja Zod nieomijalna przez tryb edit ani „Inne…" (ten sam resolver + druga granica `nowyProjektInput.parse`/`edycjaProjektuInput.parse` w hooku). Znany P3 z F1 (RLS `using(true)` → operator wyłącza signupy) — bez zmian.

### Test coverage — czysto (0× P2)
Wszystkie scenariusze `Test:` (bez `[E2E]`/`[Manual]`) z U7/U8/U9 mają testy z twardymi asercjami zachowania (`toHaveBeenCalledWith`, `toMatchObject`, `aria-pressed`, `not.toHaveProperty`). Mock tylko `sonner` + Supabase REST przez MSW — zero mockowania testowanej jednostki. Mocny pozytyw: `ProjektSzczegolyPage.test.tsx:146` `expect(holder.body).not.toHaveProperty('rozpisane')` — dokładnie kontrakt „edycja nie dotyka flag" (U9:308).

---

## Zgodność ze spec (oś osobna — NIE scalona ze Standards)

**Gate zgodności: PRZECHODZI.** 0× 🔴 P1, 0× 🟠 P2, 3× 🟡 P3. Implementacja U7/U8/U9 realizuje plan/SPEC/DESIGN wiernie, łącznie z subtelnościami.

**(a) Wymagania brakujące / częściowe:** brak. Zweryfikowane pozytywnie z cytatami:
- Formularz BEZ flag, kolejność Nazwa → Kategoria+Kontakt (`md:grid-cols-2`, 2→1) → Dodał → Uwagi; pola `min-h-12` (=48px) — DESIGN.md:509, SPEC:205-213, 218. ✓
- Kategoria „Inne…" → input `kategoriaInna` → `kategoria` przy submit; „Inne…" bez wpisania blokuje (`superRefine`) — D9, SPEC:217. ✓
- Nowy projekt 4 flagi false (`nowyProjektInput` bez flag) — D4, SPEC:215. ✓
- Karta `grid-cols-2`, pill 9px + data względna, nazwa 12px, 4× true → `opacity-40` — DESIGN.md:232-264. ✓
- ConfirmSheet: podgląd `FlagBtn` w stanie **PO** zmianie (`isActive={nowaWartosc}`), klik overlay = anuluj, `role="dialog"`+`aria-modal`, `animate-sheet-up`, safe-area padding — DESIGN.md:268-304, SPEC:185-195. ✓
- Szczegóły: nazwa 22px, data **pełna** (`formatDataPelna`), druga flaga „PRZESŁANY HAFT/SITO" (`columnLabel ?? label`), grid 3 kol, Uwagi `md:col-span-3` — DESIGN.md:355-402, SPEC:224-250. ✓
- FAB 52×52 terakota / `Plus` 22 / `fixed bottom-5 right-5` → `/nowy` — DESIGN.md:408-416. ✓

**(b) Scope creep (🟡 P3, niegroźne):**
- FAB i CTA: `transition-colors hover:bg-accent-hover` — DESIGN.md:408-418 nie definiuje hover/transition dla FAB. Spójne z paletą (`accent-hover` w tokenach). Bez akcji.
- Przyciski formularza: `active:scale-[0.98]` + `focus-visible:ring` (`ProjektForm.tsx:242`) — DESIGN.md:344-347 nie wymienia animacji wciśnięcia. Drobny polish, niesprzeczny ze spec.

**(c) Pozornie zaimplementowane, ale błędnie:** brak. Punkty newralgiczne zweryfikowane:
- Mobile toggle NIE pomija ConfirmSheet (`onToggle` ustawia tylko `setZmiana`; mutacja w `handleConfirm`) — D5. ✓
- Edycja NIE wysyła flag w PATCH (`ProjektForm` mode='edit' → `NowyProjektInput` bez flag) — D4, asercja testowa U9:308. ✓
- 404: type-guard `PGRST116` bez `as`; osobny stan dla innych błędów GET. ✓

**Notatka dla planisty:** 🟡 P3 — rozbieżność w samym `DESIGN.md`: komentarz CSS `DESIGN.md:300` mówi „Potwierdź", a wireframe `SPEC:189` „Tak, zmień". Implementacja słusznie poszła za SPEC. Do ujednolicenia w źródłach przy okazji.

---

## Odchylenia od planu

Plan (zadania.md, dziennik kontekstu) deklaruje dla U7/U8/U9 strategię serial `feature-builder-ui` (U9 reuse `ProjektForm` z U7 + `ConfirmSheet` z U8). Diff potwierdza zgodność:
- `Delegate to: feature-builder-ui` we wszystkich trzech IU — zgodne z faktyczną kategorią plików (`*.tsx` w `src/features`/`src/pages`/`src/components`). ⚪ Brak niezgodności delegacji.
- Pliki testowe deklarowane w checklistach (`ProjektForm.test.tsx`, `OsobaSegmented.test.tsx`, `ConfirmSheet.test.tsx`, `ProjektKarty.test.tsx`, `Fab.test.tsx`, `SzczegolyWidok.test.tsx`, `NowyProjektPage.test.tsx`, `ProjektSzczegolyPage.test.tsx`) — **wszystkie istnieją**. ✓
- Odchylenia odnotowane w kontekście (test-infra: stub `matchMedia` w `setup.ts`; dodatkowy `NowyProjektPage.test.tsx`) — w granicach planu, bez zmiany scope. ✓

---

## Bookkeeping checkboxów `Weryfikacja:`

- Odznaczone automatycznie (CLI/grep): **0** (wszystkie CLI Weryfikacja U7/U8/U9 już `[x]` — 97/97, 114/114, 126/126; potwierdzone ponownie na żywo 126/126)
- Odznaczone na podstawie Agent 5 E2E: 0
- Pozostawione dla operatora (Manual): 0 (w Fazie 3)
- Niejasne (P3): 0
- **E2E SKIP (P2 zbiorczy): 6**

### Szczegóły
Niezaznaczone `Weryfikacja:` w Fazie 3 to wyłącznie scenariusze `[E2E]`, wszystkie już opatrzone suffixem `(SKIP — brak .env/Supabase, Operator TODO)` przy implementacji. Agent 5 niedostępny (brak `.env`/Supabase/dev servera) — stan bez zmian:
- [ ] E2E: `Weryfikacja: [E2E] dodanie projektu → redirect + toast + nowy wiersz` (U7) — SKIP
- [ ] E2E: `Weryfikacja: [E2E] walidacja blokuje pusty submit; „Inne…" pokazuje input` (U7) — SKIP
- [ ] E2E: `Weryfikacja: [E2E 375px] karty 2×2 + ConfirmSheet` (U8) — SKIP
- [ ] E2E: `Weryfikacja: [E2E] zmiana szerokości okna przełącza tabela↔karty` (U8) — SKIP
- [ ] E2E: `Weryfikacja: [E2E] edycja pól zapisuje się i widoczna po reloadzie` (U9) — SKIP
- [ ] E2E: `Weryfikacja: [E2E] /projekt/nieistniejace → „Nie znaleziono projektu"` (U9) — SKIP

Zgodnie z precedensem F1/F2 te 6× E2E grupuję jako **jeden zbiorczy 🟠 P2** „zablokowane na infrastrukturze operatora (nie defekty kodu)" — do uruchomienia po Operator TODO §110, nie blokują Fazy 4.

---

## Podsumowanie do działania (priorytet)

1. 🟠 **P2 #1** — `isNotFoundError`: jawny `error is PostgrestLikeError` + stała `POSTGREST_NO_ROWS`; przy okazji walidacja `:id` jako UUID (rozwiązuje też security-nit).
2. 🟠 **P2 #2** — kolizja sentinela `'Inne…'` (decyzja produktowa — potwierdź przed zmianą; niskie prawdopodobieństwo, ale tani fix usuwa klasę bugów).
3. 🟠 **P2 (zbiorczy)** — 6× E2E SKIP zablokowane na Operator TODO §110 (`.env`/Supabase) — nie defekty kodu.
4. 🟡 P3 — kolejność importów `NowyProjektPage`, asercja body PATCH mobile (opcjonalne).

---

## Wyniki E2E na żywo (2026-06-13)

Po skonfigurowaniu Supabase (Operator TODO §110) i poprawkach logowania/UUID przeprowadzono
6× E2E przez `agent-browser` na zalogowanej sesji (`localhost:5173`, realna baza). Zrzuty: `e2e-faza-3/`.

| # | Scenariusz | Wynik | Dowód |
|---|-----------|-------|-------|
| U7-b | pusty submit → błędy PL (zostaje na `/nowy`); „Inne…" → input własnej kategorii | ✅ PASS | 01, 02 |
| U7-a | dodanie projektu → redirect `/` + toast „Projekt dodany" + nowy wiersz; liczniki 0→1 | ✅ PASS | 03, 04 |
| U8-b | 1280↔375 przełącza tabela↔karty (matchMedia), CTA↔FAB | ✅ PASS | 04, 05 |
| U8-a | [375px] karty 2×2; klik flagi → ConfirmSheet (bez mutacji) → „Tak, zmień" → toast „ROZPISANE: TAK" + licznik 1→0 | ✅ PASS | 05, 06, 07 |
| U9-a | szczegóły (data pełna, „PRZESŁANY HAFT/SITO") → Edytuj → zmiana nazwy → „Zmiany zapisane" → reload utrzymuje zmianę | ✅ PASS | 08, 09, 10 |
| U9-b | `/projekt/nieistniejace` (nie-UUID) i valid-UUID/PGRST116 → „Nie znaleziono projektu"; link „Wróć do listy" → `/` | ✅ PASS | 11, 12 |

**Dodatkowo potwierdzone na żywo:**
- **Fix logowania** (`/login`→`/` po zalogowaniu) — wejście na listę po submit. ✅
- **Fix UUID-guard (P2 #1)** — nie-UUID `:id` → natychmiastowe 404 bez zapytania. ✅
- **Custom kategoria „Inne…" round-trip** — zapis „Naszywka 3D" i poprawne odtworzenie w trybie edit
  (`Inne…` + input wypełniony). To realne pokrycie ścieżki, której dotyczył P2 #2 (zostawiony jako
  udokumentowany invariant — w praktyce działa poprawnie).
- Empty state „Brak projektów" + CTA, filtry z licznikami `tabular-nums`, kolumna „PRZESŁANY HAFT/SITO".

**Severity gate E2E:** 6/6 PASS — brak nowych findingów. Pozostałe E2E (Faza 1/2/4) poza zakresem tego runu.
