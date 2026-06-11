import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { FLAGI } from '@/lib/config';
import { formatRelativeData } from '@/lib/format';
import type { Projekt } from '@/lib/types';

import { useProjektMutations } from '@/hooks/useProjektMutations';

import { FlagBtn } from './FlagBtn';

interface ProjektTabelaProps {
  projekty: Projekt[];
}

const TH_BASE = 'px-2.5 py-2.5 text-[10px] font-medium uppercase tracking-[0.07em] text-text-meta text-left whitespace-nowrap';

/** Czy wszystkie 4 flagi są true → wiersz przygaszony (opacity 0.4). */
function isKompletny(projekt: Projekt): boolean {
  return FLAGI.every((flaga) => projekt[flaga.key]);
}

/**
 * Tabela desktop (DESIGN.md ≥ 768px). Kolumny: Kategoria · Nazwa · Kontakt · 4× flaga · Dodano.
 * Klik wiersza → szczegóły; klik flagi (stopPropagation) → optimistic toggle + toast.
 * Wiersz z 4× true → `opacity-40`.
 */
export function ProjektTabela({ projekty }: ProjektTabelaProps) {
  const navigate = useNavigate();
  const { toggleFlaga } = useProjektMutations();

  const makeToggleHandler = (
    projekt: Projekt,
    key: (typeof FLAGI)[number]['key'],
    label: string,
  ): ((nowaWartosc: boolean) => void) => {
    return (nowaWartosc: boolean): void => {
      toggleFlaga.mutate(
        { id: projekt.id, key, nowaWartosc },
        {
          onSuccess: () => {
            toast(`${label}: ${nowaWartosc ? 'TAK' : 'NIE'}`);
          },
          // Toast błędu i rollback obsługuje sam hook mutacji (bez re-throw).
        },
      );
    };
  };

  return (
    <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
      <thead>
        <tr className="border-b border-border bg-surface-alt">
          <th className={`${TH_BASE} pl-5`}>Kategoria</th>
          <th className={TH_BASE} style={{ minWidth: 140 }}>
            Nazwa projektu
          </th>
          <th className={TH_BASE}>Kontakt</th>
          {FLAGI.map((flaga) => (
            <th key={flaga.key} className={TH_BASE}>
              {flaga.columnLabel ?? flaga.label}
            </th>
          ))}
          <th className={`${TH_BASE} pr-5 text-right`}>Dodano</th>
        </tr>
      </thead>
      <tbody>
        {projekty.map((projekt) => (
          <tr
            key={projekt.id}
            onClick={() => navigate(`/projekt/${projekt.id}`)}
            className={`cursor-pointer border-b border-border-row transition-colors hover:bg-surface-row ${
              isKompletny(projekt) ? 'opacity-40' : ''
            }`}
          >
            <td className="px-2.5 py-2 pl-5 align-middle">
              <span className="inline-block whitespace-nowrap rounded-pill border border-[#DDD7CC] bg-[#F0EDE7] px-[9px] py-[3px] text-[10px] font-medium text-[#6B6354]">
                {projekt.kategoria}
              </span>
            </td>
            <td className="max-w-0 px-2.5 py-2 align-middle">
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-text-primary">
                {projekt.nazwa}
              </span>
            </td>
            <td className="px-2.5 py-2 align-middle text-xs text-text-secondary">
              {projekt.kontakt ?? '—'}
            </td>
            {FLAGI.map((flaga) => (
              <td key={flaga.key} className="px-2.5 py-2 align-middle">
                <FlagBtn
                  label={flaga.label}
                  isActive={projekt[flaga.key]}
                  size="table"
                  disabled={toggleFlaga.isPending}
                  onToggle={makeToggleHandler(projekt, flaga.key, flaga.label)}
                />
              </td>
            ))}
            <td className="px-2.5 py-2 pr-5 text-right align-middle text-[11px] text-text-meta whitespace-nowrap">
              {formatRelativeData(projekt.created_at)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProjektTabela;
