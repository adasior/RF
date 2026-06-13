import type { UseProjektAkcjeResult } from '../hooks/useProjektAkcje';

import { HardDeleteDialog } from './HardDeleteDialog';
import { UsunDialog } from './UsunDialog';

interface AkcjeDialogiProps {
  akcje: UseProjektAkcjeResult;
}

/**
 * Renderuje dialog akcji projektu (archiwizacja / hard delete) na podstawie stanu `useProjektAkcje`.
 * Wspólny dla `ProjektTabela` i `ProjektKarty` — identyczny blok renderu w obu (dedup, coding-rules §3).
 */
export function AkcjeDialogi({ akcje }: AkcjeDialogiProps) {
  return (
    <>
      {akcje.dialog.rodzaj === 'usun' && (
        <UsunDialog
          nazwa={akcje.dialog.projekt.nazwa}
          isPending={akcje.isPending}
          onConfirm={akcje.potwierdzUsun}
          onCancel={akcje.zamknij}
        />
      )}
      {akcje.dialog.rodzaj === 'hard' && (
        <HardDeleteDialog
          nazwa={akcje.dialog.projekt.nazwa}
          isPending={akcje.isPending}
          onConfirm={akcje.potwierdzHard}
          onCancel={akcje.zamknij}
        />
      )}
    </>
  );
}

export default AkcjeDialogi;
