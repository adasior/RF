import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { useProjektData } from '@/hooks/useProjektData';
import { useProjektMutations } from '@/hooks/useProjektMutations';
import type { NowyProjektInput } from '@/lib/types';

import { ProjektForm } from '@/features/projekty/components/ProjektForm';
import { SzczegolyWidok } from '@/features/projekty/components/SzczegolyWidok';

import { NotFoundPage } from './NotFoundPage';

/** Kod błędu PostgREST dla `.single()` bez wiersza (= projekt nie istnieje). */
const POSTGREST_NO_ROWS = 'PGRST116';

interface PostgrestError {
  code: string;
}

/** Type guard: błąd PostgREST „brak wiersza" → projekt nie istnieje (404), nie błąd przejściowy. */
function isNotFoundError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === POSTGREST_NO_ROWS
  );
}

/** `:id` z URL musi być UUID — nie-UUID nie wskaże realnego projektu (404 bez zapytania). */
function isPoprawneId(id: string | undefined): boolean {
  return id !== undefined && z.string().uuid().safeParse(id).success;
}

/**
 * Szczegóły projektu (`/projekt/:id`):
 * - read-only: `SzczegolyWidok` (flagi, grid danych);
 * - tryb edycji: `ProjektForm` mode='edit' (pola wypełnione, BEZ flag — flagi zostają);
 * - brak rekordu (PGRST116) → `NotFoundPage` z linkiem do `/`;
 * - Usuń: archiwizacja (placeholder — pełny dialog potwierdzenia w U10).
 */
export function ProjektSzczegolyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEdycja, setIsEdycja] = useState(false);

  const isId = isPoprawneId(id);
  const { data: projekt, isLoading, error } = useProjektData(isId ? id : undefined);
  const { update, archive } = useProjektMutations();

  // Niepoprawny/nie-UUID :id → 404 od razu (zapytanie nie odpala się dzięki enabled).
  if (!isId) {
    return (
      <NotFoundPage
        tytul="Nie znaleziono projektu"
        opis="Projekt nie istnieje albo został usunięty."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg">
        <p className="px-5 py-12 text-center text-sm text-text-secondary">Ładowanie…</p>
      </div>
    );
  }

  if (error && isNotFoundError(error)) {
    return (
      <NotFoundPage
        tytul="Nie znaleziono projektu"
        opis="Projekt nie istnieje albo został usunięty."
      />
    );
  }

  if (error || !projekt) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-bg p-12 text-center">
        <p role="alert" className="text-sm text-danger">
          Nie udało się wczytać projektu — spróbuj ponownie.
        </p>
        <Link to="/" className="text-sm text-text-secondary underline">
          Wróć do listy
        </Link>
      </div>
    );
  }

  const handleZapiszZmiany = (input: NowyProjektInput): void => {
    // EdycjaProjektuInput = NowyProjektInput + opcjonalne flagi — formularz flag nie zna,
    // więc update NIE dotyka flag (zostają jak są).
    update.mutate(
      { id: projekt.id, input },
      {
        onSuccess: () => {
          toast.success('Zmiany zapisane');
          setIsEdycja(false);
        },
        // Toast błędu pokazuje hook — użytkownik zostaje w trybie edycji.
      },
    );
  };

  const handleUsun = (): void => {
    // Placeholder U10: archiwizacja bez dialogu potwierdzenia (soft delete, D6).
    archive.mutate(projekt.id, {
      onSuccess: () => {
        toast.success('Projekt usunięty');
        void navigate('/');
      },
    });
  };

  if (isEdycja) {
    return (
      <div className="min-h-dvh bg-bg">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-5">
          <Link
            to="/"
            className="text-sm text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            ← Wróć
          </Link>
        </header>
        <main className="mx-auto max-w-[600px] px-6 py-5">
          <h1 className="mb-4 text-xl font-bold text-text-primary">Edytuj projekt</h1>
          <ProjektForm
            mode="edit"
            defaultValues={{
              nazwa: projekt.nazwa,
              kategoria: projekt.kategoria,
              dodal: projekt.dodal,
              kontakt: projekt.kontakt,
              uwagi: projekt.uwagi,
            }}
            isSubmitting={update.isPending}
            onSubmit={handleZapiszZmiany}
            onCancel={() => setIsEdycja(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <SzczegolyWidok
      projekt={projekt}
      onEdytuj={() => setIsEdycja(true)}
      onUsun={handleUsun}
      isUsuwanie={archive.isPending}
    />
  );
}

export default ProjektSzczegolyPage;
