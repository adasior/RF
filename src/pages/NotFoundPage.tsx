import { Link } from 'react-router-dom';

/**
 * Strona 404 — trasa nieistniejąca lub nieznaleziony projekt (rozszerzane w U9).
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-bg p-12 text-center">
      <h1 className="text-xl font-bold text-text-primary">Nie znaleziono strony</h1>
      <p className="text-sm text-text-secondary">
        Ta strona nie istnieje albo została przeniesiona.
      </p>
      <Link to="/" className="mt-2 rounded-pill bg-accent px-4 py-2 text-xs font-medium text-white">
        Wróć do listy
      </Link>
    </div>
  );
}

export default NotFoundPage;
