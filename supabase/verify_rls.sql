-- Skrypt kontrolny (uruchom w Supabase SQL Editor po aplikacji migracji 0001-0003).
-- Weryfikuje STRUKTURĘ i KONFIGURACJĘ. Twardy dowód deny-all dla anon daje
-- osobny skrypt z anon key: scripts/verify-rls.mjs (czyta przez REST, nie SQL).

-- 1) Kolumny: 4 flagi + archived_at muszą istnieć z poprawnymi typami.
--    Oczekiwane: 4 wiersze boolean (flagi) + archived_at timestamptz.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'projekty'
  and column_name in (
    'rozpisane', 'przeslany', 'sprawdzony', 'wydrukowany', 'archived_at'
  )
order by column_name;

-- 2) RLS musi być WŁĄCZONE na tabeli projekty.
--    Oczekiwane: relrowsecurity = true.
select relname, relrowsecurity
from pg_class
where relname = 'projekty'
  and relnamespace = 'public'::regnamespace;

-- 3) Polityki: dokładnie 4, wszystkie dla roli authenticated, brak dla anon.
--    Oczekiwane: 4 wiersze, kolumna roles = {authenticated}, brak {anon}.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'projekty'
order by cmd;

-- 4) Trigger updated_at musi istnieć.
--    Oczekiwane: 1 wiersz (set_updated_at, BEFORE UPDATE).
select trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'projekty';

-- 5) Realtime: tabela w publikacji supabase_realtime.
--    Oczekiwane: 1 wiersz (public, projekty).
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'projekty';
