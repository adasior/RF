-- Migracja 0001: tabela `projekty` + trigger updated_at
-- Źródło schematu: SPEC_projekty.md (sekcja "Baza danych — SQL").
-- Odchylenia od SPEC (świadome decyzje planu):
--   D6 — kolumna `archived_at` (soft delete; nie ma jej w SPEC).
-- RLS i Realtime są w osobnych migracjach (0002, 0003).

create table if not exists projekty (
  id          uuid default gen_random_uuid() primary key,
  nazwa       text not null,
  kategoria   text not null,

  -- 4 niezależne flagi stanu projektu (D4) — domyślnie wszystkie false
  rozpisane   boolean not null default false,
  przeslany   boolean not null default false,  -- Przesłany haft/sito
  sprawdzony  boolean not null default false,
  wydrukowany boolean not null default false,

  kontakt     text,
  uwagi       text,
  dodal       text not null,                   -- imię osoby, która dodała projekt

  archived_at timestamptz,                     -- D6: soft delete; null = projekt aktywny

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Funkcja aktualizująca `updated_at` przy każdym UPDATE.
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger idempotentny: usuwamy istniejący przed ponownym utworzeniem.
drop trigger if exists set_updated_at on projekty;
create trigger set_updated_at
before update on projekty
for each row
execute function update_updated_at();

-- Indeks dla domyślnego sortowania listy (created_at desc).
-- Częściowy: lista domyślnie pokazuje tylko aktywne projekty (archived_at is null).
create index if not exists projekty_created_at_active_idx
on projekty (created_at desc)
where archived_at is null;
