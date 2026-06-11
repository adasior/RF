import { Header } from '@/components/Header';

/**
 * Placeholder widoku głównego (shell). Tabela/karty + filtry przychodzą w U5/U6/U8.
 */
export function ListaPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <Header />
      <main className="p-5">
        <p className="text-sm text-text-secondary">
          Lista projektów pojawi się tutaj (U5–U8).
        </p>
      </main>
    </div>
  );
}

export default ListaPage;
