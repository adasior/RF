import { Link } from 'react-router-dom';

/**
 * Placeholder formularza nowego projektu. Pełny formularz (RHF + Zod) w U7.
 */
export function NowyProjektPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-5">
        <Link to="/" className="text-sm text-text-secondary">
          ← Wróć
        </Link>
      </header>
      <main className="mx-auto max-w-[600px] p-6">
        <h1 className="mb-2 text-xl font-bold text-text-primary">Nowy projekt</h1>
        <p className="text-sm text-text-secondary">Formularz pojawi się tutaj (U7).</p>
      </main>
    </div>
  );
}

export default NowyProjektPage;
