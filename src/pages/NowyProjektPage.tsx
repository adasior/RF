import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ProjektForm } from '@/features/projekty/components/ProjektForm';
import { useProjektMutations } from '@/hooks/useProjektMutations';
import type { NowyProjektInput } from '@/lib/types';

/**
 * Strona nowego projektu (`/nowy`). Formularz RHF + Zod (ProjektForm, mode=create);
 * po sukcesie hook invaliduje listy, strona pokazuje toast „Projekt dodany" i wraca na `/`.
 * Toast błędu pokazuje hook (`useProjektMutations`) — strona nie duplikuje obsługi.
 */
export function NowyProjektPage() {
  const navigate = useNavigate();
  const { create } = useProjektMutations();

  const handleSubmit = (input: NowyProjektInput) => {
    create.mutate(input, {
      onSuccess: () => {
        toast.success('Projekt dodany');
        void navigate('/');
      },
    });
  };

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
        <h1 className="mb-4 text-xl font-bold text-text-primary">Nowy projekt</h1>
        <ProjektForm
          mode="create"
          isSubmitting={create.isPending}
          onSubmit={handleSubmit}
          onCancel={() => void navigate('/')}
        />
      </main>
    </div>
  );
}

export default NowyProjektPage;
