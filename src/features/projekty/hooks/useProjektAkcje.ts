import { useState } from 'react';
import { toast } from 'sonner';

import { useProjektMutations } from '@/hooks/useProjektMutations';
import type { Projekt } from '@/lib/types';

/** Otwarty dialog akcji (discriminated union — żaden, archiwizacja lub hard delete). */
type AktywnyDialog =
  | { rodzaj: 'brak' }
  | { rodzaj: 'usun'; projekt: Projekt }
  | { rodzaj: 'hard'; projekt: Projekt };

export interface UseProjektAkcjeResult {
  dialog: AktywnyDialog;
  isPending: boolean;
  /** Czy trwa przywracanie (do blokady przycisku „Przywróć"). */
  isPrzywracanie: boolean;
  otworzUsun: (projekt: Projekt) => void;
  otworzHard: (projekt: Projekt) => void;
  zamknij: () => void;
  potwierdzUsun: () => void;
  potwierdzHard: () => void;
  przywroc: (projekt: Projekt) => void;
}

/**
 * Akcje cyklu życia projektu na liście (U10): archiwizacja / przywracanie / hard delete.
 * Trzyma stan otwartego dialogu i deleguje do `useProjektMutations`.
 * Toast sukcesu w warstwie UI (hook mutacji toastuje TYLKO błędy).
 */
export function useProjektAkcje(): UseProjektAkcjeResult {
  const { archive, restore, hardDelete } = useProjektMutations();
  const [dialog, setDialog] = useState<AktywnyDialog>({ rodzaj: 'brak' });

  const zamknij = (): void => setDialog({ rodzaj: 'brak' });

  const potwierdzUsun = (): void => {
    if (dialog.rodzaj !== 'usun') {
      return;
    }
    const { projekt } = dialog;
    archive.mutate(projekt.id, {
      onSuccess: () => {
        toast.success('Projekt przeniesiony do archiwum');
        zamknij();
      },
    });
  };

  const potwierdzHard = (): void => {
    if (dialog.rodzaj !== 'hard') {
      return;
    }
    const { projekt } = dialog;
    hardDelete.mutate(projekt.id, {
      onSuccess: () => {
        toast.success('Projekt usunięty bezpowrotnie');
        zamknij();
      },
    });
  };

  const przywroc = (projekt: Projekt): void => {
    restore.mutate(projekt.id, {
      onSuccess: () => {
        toast.success('Projekt przywrócony');
      },
    });
  };

  return {
    dialog,
    isPending: archive.isPending || hardDelete.isPending,
    isPrzywracanie: restore.isPending,
    otworzUsun: (projekt) => setDialog({ rodzaj: 'usun', projekt }),
    otworzHard: (projekt) => setDialog({ rodzaj: 'hard', projekt }),
    zamknij,
    potwierdzUsun,
    potwierdzHard,
    przywroc,
  };
}
