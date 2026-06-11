-- Migracja 0002: Row Level Security dla `projekty`
-- Decyzja D3 (wbrew nieaktualnej sekcji "Bezpieczeństwo" w SPEC_projekty.md):
--   RLS WŁĄCZONE. Pole `kontakt` to dane osobowe (RODO), a anon key w bundlu
--   Vite jest publiczny — nie chroni danych. Dostęp tylko dla `authenticated`.
--
-- Model dostępu: aplikacja używa jednego wspólnego konta zespołu (4 osoby),
--   więc każdy zalogowany użytkownik ma pełny CRUD na wszystkich wierszach.
--   Brak per-user ownership → polityki `using (true)` / `with check (true)`.
--
-- Deny-all dla `anon`: nie definiujemy ŻADNEJ polityki dla roli `anon`.
--   Przy włączonym RLS brak polityki = brak dostępu (domyślny deny).

alter table projekty enable row level security;

-- SELECT — odczyt dla zalogowanych.
drop policy if exists "authenticated_select_projekty" on projekty;
create policy "authenticated_select_projekty"
on projekty
for select
to authenticated
using (true);

-- INSERT — tworzenie dla zalogowanych.
drop policy if exists "authenticated_insert_projekty" on projekty;
create policy "authenticated_insert_projekty"
on projekty
for insert
to authenticated
with check (true);

-- UPDATE — edycja / toggle flag / archiwizacja dla zalogowanych.
drop policy if exists "authenticated_update_projekty" on projekty;
create policy "authenticated_update_projekty"
on projekty
for update
to authenticated
using (true)
with check (true);

-- DELETE — hard delete (z archiwum) dla zalogowanych.
drop policy if exists "authenticated_delete_projekty" on projekty;
create policy "authenticated_delete_projekty"
on projekty
for delete
to authenticated
using (true);
