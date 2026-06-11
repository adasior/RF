-- Migracja 0003: Realtime dla `projekty`
-- Decyzja D7: synchronizacja na żywo (postgres_changes) między 4 osobami
--   pracującymi równolegle. Tabela musi należeć do publikacji `supabase_realtime`.
--
-- Publikacja `supabase_realtime` istnieje domyślnie w projektach Supabase.
-- Idempotentnie: dodajemy tabelę tylko gdy nie jest jeszcze w publikacji,
--   aby ponowne uruchomienie migracji nie kończyło się błędem
--   "relation is already member of publication".

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'projekty'
  ) then
    alter publication supabase_realtime add table projekty;
  end if;
end;
$$;
