import { Link, useParams } from 'react-router-dom';

/**
 * Placeholder szczegółów projektu. Pełny widok + edycja w U9.
 */
export function ProjektSzczegolyPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-5">
        <Link to="/" className="text-sm text-text-secondary">
          ← Wróć
        </Link>
      </header>
      <main className="mx-auto max-w-[720px] p-6">
        <h1 className="mb-2 text-xl font-bold text-text-primary">Szczegóły projektu</h1>
        <p className="text-sm text-text-secondary">
          Widok szczegółów pojawi się tutaj (U9). ID: {id}
        </p>
      </main>
    </div>
  );
}

export default ProjektSzczegolyPage;
