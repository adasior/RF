import { Link } from 'react-router-dom';

interface NotFoundPageProps {
  /** Nagłówek — domyślnie generyczne 404 trasy; szczegóły projektu podają własny. */
  tytul?: string;
  opis?: string;
}

/**
 * Strona 404 — trasa nieistniejąca (`*`) lub nieznaleziony projekt (`/projekt/:id`, U9).
 */
export function NotFoundPage({
  tytul = 'Nie znaleziono strony',
  opis = 'Ta strona nie istnieje albo została przeniesiona.',
}: NotFoundPageProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-bg p-12 text-center">
      <h1 className="text-xl font-bold text-text-primary">{tytul}</h1>
      <p className="text-sm text-text-secondary">{opis}</p>
      <Link to="/" className="mt-2 rounded-pill bg-accent px-4 py-2 text-xs font-medium text-white">
        Wróć do listy
      </Link>
    </div>
  );
}

export default NotFoundPage;
