import { useNavigate } from 'react-router-dom';

import { Header } from '@/components/Header';

import { useProjektyData } from '@/hooks/useProjektyData';

import { EmptyState } from '@/features/projekty/components/EmptyState';
import { Filtry } from '@/features/projekty/components/Filtry';
import { ProjektKarty } from '@/features/projekty/components/ProjektKarty';
import { ProjektTabela } from '@/features/projekty/components/ProjektTabela';
import { useFiltry } from '@/features/projekty/hooks/useFiltry';
import { useIsMobile } from '@/features/projekty/hooks/useIsMobile';
import { useRealtimeProjekty } from '@/features/projekty/hooks/useRealtimeProjekty';

/**
 * Widok główny (U5 + U6 + U8): belka filtrów + lista aktywnych projektów.
 * - Tabela desktop ≥768px / karty 2×2 mobile <768px (`useIsMobile`, reaktywnie).
 * - Liczniki (D10): liczone client-side z PEŁNEGO zbioru aktywnych projektów.
 * - Lista: zbiór po nałożeniu filtra flagi + szukaj (AND).
 * - Pusto: rozróżnienie „brak projektów" vs „brak wyników filtra".
 */
export function ListaPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { filtry, szukajInput, setFlaga, setSzukaj, setArchiwum, reset } = useFiltry();

  // Synchronizacja na żywo (D7): zmiany całego zespołu reconciliują cache bez ręcznego odświeżania.
  useRealtimeProjekty();

  // Pełny zbiór aktywnych projektów — źródło liczników (niezależny od aktywnego filtra).
  const { data: wszystkie } = useProjektyData({});

  // Zbiór po nałożeniu filtrów — to renderuje tabela.
  const {
    data: projekty,
    isLoading,
    error,
  } = useProjektyData(filtry);

  const isFiltrAktywny =
    filtry.flaga !== undefined ||
    (filtry.szukaj ?? '').trim().length > 0 ||
    (filtry.archiwum ?? false);

  const handleResetFiltrow = (): void => {
    setArchiwum(false);
    reset();
  };

  return (
    <div className="min-h-dvh bg-bg">
      <Header />

      <Filtry
        projekty={wszystkie ?? []}
        flagaAktywna={filtry.flaga}
        szukaj={szukajInput}
        archiwum={filtry.archiwum ?? false}
        onFlagaChange={setFlaga}
        onSzukajChange={setSzukaj}
        onArchiwumChange={setArchiwum}
      />

      <main>
        {isLoading && (
          <p className="px-5 py-12 text-center text-sm text-text-secondary">Ładowanie…</p>
        )}

        {error && (
          <p role="alert" className="px-5 py-12 text-center text-sm text-danger">
            Nie udało się wczytać projektów — spróbuj ponownie.
          </p>
        )}

        {!isLoading && !error && projekty && projekty.length === 0 && (
          <EmptyState
            variant={isFiltrAktywny ? 'brak-wynikow' : 'brak-projektow'}
            onAction={isFiltrAktywny ? handleResetFiltrow : () => navigate('/nowy')}
          />
        )}

        {!isLoading && !error && projekty && projekty.length > 0 &&
          (isMobile ? (
            <ProjektKarty projekty={projekty} archiwum={filtry.archiwum ?? false} />
          ) : (
            <ProjektTabela projekty={projekty} archiwum={filtry.archiwum ?? false} />
          ))}
      </main>
    </div>
  );
}

export default ListaPage;
