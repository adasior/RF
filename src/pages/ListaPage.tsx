import { useNavigate } from 'react-router-dom';

import { Header } from '@/components/Header';

import { useProjektyData } from '@/hooks/useProjektyData';

import { EmptyState } from '@/features/projekty/components/EmptyState';
import { Filtry } from '@/features/projekty/components/Filtry';
import { ProjektTabela } from '@/features/projekty/components/ProjektTabela';
import { useFiltry } from '@/features/projekty/hooks/useFiltry';

/**
 * Widok główny (U5 + U6): belka filtrów + tabela desktop aktywnych projektów.
 * - Liczniki (D10): liczone client-side z PEŁNEGO zbioru aktywnych projektów.
 * - Tabela: zbiór po nałożeniu filtra flagi + szukaj (AND).
 * - Pusto: rozróżnienie „brak projektów" vs „brak wyników filtra".
 * Karty mobile (U8) dochodzą w kolejnym IU.
 */
export function ListaPage() {
  const navigate = useNavigate();
  const { filtry, szukajInput, setFlaga, setSzukaj, reset } = useFiltry();

  // Pełny zbiór aktywnych projektów — źródło liczników (niezależny od aktywnego filtra).
  const { data: wszystkie } = useProjektyData({});

  // Zbiór po nałożeniu filtrów — to renderuje tabela.
  const {
    data: projekty,
    isLoading,
    error,
  } = useProjektyData(filtry);

  const isFiltrAktywny = filtry.flaga !== undefined || (filtry.szukaj ?? '').trim().length > 0;

  return (
    <div className="min-h-dvh bg-bg">
      <Header />

      <Filtry
        projekty={wszystkie ?? []}
        flagaAktywna={filtry.flaga}
        szukaj={szukajInput}
        onFlagaChange={setFlaga}
        onSzukajChange={setSzukaj}
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
            onAction={isFiltrAktywny ? reset : () => navigate('/nowy')}
          />
        )}

        {!isLoading && !error && projekty && projekty.length > 0 && (
          <ProjektTabela projekty={projekty} />
        )}
      </main>
    </div>
  );
}

export default ListaPage;
