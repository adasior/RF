import { Link } from 'react-router-dom';

/**
 * Placeholder widoku głównego (shell). Tabela/karty + filtry przychodzą w U5/U6/U8.
 */
export function ListaPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface px-5">
        <span className="font-serif text-lg italic text-text-primary">
          Pracownia <span className="text-accent">·</span> projekty
        </span>
        <Link
          to="/nowy"
          className="rounded-pill bg-accent px-4 py-2 text-xs font-medium text-white"
        >
          + Nowy projekt
        </Link>
      </header>
      <main className="p-5">
        <p className="text-sm text-text-secondary">
          Lista projektów pojawi się tutaj (U5–U8).
        </p>
      </main>
    </div>
  );
}

export default ListaPage;
